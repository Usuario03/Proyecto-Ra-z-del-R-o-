import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { OrderDto } from '../server/contracts/order';
import type { AuthSessionResponseDto, UserProfileDto } from '../server/contracts/profile';
import {
  fetchCartFromApi,
  fetchOrdersAndTransactionsFromApi,
  mergeGuestCartInApi,
} from './client/cart';
import {
  fetchCatalogAndFishermenFromApi,
  fetchEnvironmentalAuditFromApi,
  fetchEnvironmentalRulesFromApi,
  fetchSpeciesFromApi,
} from './client/catalog';
import { fetchMyProfileFromApi } from './client/session';
import {
  GUEST_CART_ID,
  initialStore,
  isFisher,
  portrait,
  type Customer,
  type Fisherman,
  type Order,
  type Product,
  type Store,
} from './domain';

interface SharedStore {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  getStore: () => Store;
  storageError: boolean;
  cartVersion: number;
  setCartVersion: (v: number) => void;
  lotVersions: Record<string, number>;
  ruleVersions: Record<string, number>;
  refreshFromBackend: () => Promise<void>;
  applyAuthSession: (
    auth: AuthSessionResponseDto,
    options?: { isNewRegistration?: boolean; assignedPin?: string },
  ) => Promise<void>;
}
const Context = createContext<SharedStore | null>(null);

function mapOrderDtoToStoreOrder(dto: OrderDto, productsById: Map<string, Product>): Order {
  return {
    id: dto.id,
    clientId: dto.clientId,
    createdAt: dto.createdAt,
    total: Number(dto.totalCop),
    delivery: dto.delivery,
    method: dto.paymentMethod,
    bank: dto.bank,
    customerType: dto.customerType,
    fulfillment: dto.fulfillment,
    ...(dto.receivedAt ? { receivedAt: dto.receivedAt } : {}),
    items: dto.lines.map(line => {
      const existingProduct = productsById.get(line.lotId);
      const snapshotProduct: Product = existingProduct ?? {
        id: line.lotId,
        speciesId: line.speciesId,
        fisherId: line.fisherId,
        name: line.speciesName,
        scientific: line.scientificName,
        description: '',
        color: '#9baf9b',
        price: line.pricePerKgCop,
        stock: 0,
        ...(line.pieceWeightGrams !== null ? { pieceWeightGrams: line.pieceWeightGrams } : {}),
        length: 0,
        minimum: 0,
        zone: line.zone,
        method: line.method,
        capturedAt: dto.createdAt,
        landedAt: dto.createdAt,
        captured: new Date(dto.createdAt).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        temperature: 2,
        photo: '',
        paused: false,
        fisher: line.fisherName,
        member: line.fisherMember,
      };
      return {
        product: {
          ...snapshotProduct,
          price: line.pricePerKgCop,
          ...(line.pieceWeightGrams !== null
            ? { pieceWeightGrams: line.pieceWeightGrams }
            : {}),
        },
        kg: line.weightKg,
        quantity: line.quantity,
      };
    }),
  };
}

function mapFisherProfileToFisherman(profile: UserProfileDto, index: number, pinOverride?: string): Fisherman {
  const palette = ['#dbe8bf', '#ead8b7', '#ceddd6'];
  const defaultPhoto = portrait(palette[index % palette.length], index);
  const member = profile.fisherDetail?.memberCode || `FP-000${index + 1}`;
  const isSeededDemo = /^FP-0(018|042|067|091|113|156)$/.test(member);
  return {
    id: profile.userId,
    member,
    name: profile.name,
    nickname: profile.fisherDetail?.nickname || profile.name.split(' ')[0] || profile.name,
    port: profile.fisherDetail?.port || 'Muelle de Barrancabermeja',
    photo: profile.fisherDetail?.photoId || defaultPhoto,
    pin: pinOverride || (isSeededDemo ? '1234' : (profile.fisherDetail?.document?.slice(-4) || '1234')),
    email: profile.email,
    document: profile.fisherDetail?.document || '',
    registration: isSeededDemo ? 'demo' : 'solicitud-local',
  };
}

export function StoreProvider({children}: {children: ReactNode}) {
  const [store, renderStore] = useState<Store>(() => ({
    ...initialStore(),
    products: [],
    fishermen: [],
    customers: [],
    orders: [],
    transactions: [],
  }));
  const current = useRef(store);
  const [storageError] = useState(false);
  const [cartVersion, setCartVersion] = useState(1);
  const [lotVersions, setLotVersions] = useState<Record<string, number>>({});
  const [ruleVersions, setRuleVersions] = useState<Record<string, number>>({});
  const fisherPinsRef = useRef<Record<string, string>>({});

  const setStore = useCallback<Dispatch<SetStateAction<Store>>>(action => {
    const next = typeof action === 'function' ? action(current.current) : action;
    current.current = next;
    renderStore(next);
  }, []);
  const getStore = useCallback(() => current.current, []);

  const refreshFromBackend = useCallback(async () => {
    try {
      const [speciesList, catalogData, rulesList] = await Promise.all([
        fetchSpeciesFromApi(),
        fetchCatalogAndFishermenFromApi(),
        fetchEnvironmentalRulesFromApi().catch(() => []),
      ]);

      const nextLotVersions: Record<string, number> = {};
      for (const lot of catalogData.items) {
        nextLotVersions[lot.id] = lot.version;
      }
      setLotVersions(nextLotVersions);

      const nextRuleVersions: Record<string, number> = {};
      let smallSizeSim = false;
      for (const r of rulesList) {
        nextRuleVersions[r.speciesId] = r.version;
        if (r.speciesId === 'bocachico' && r.simulatedLengthCm === 22) {
          smallSizeSim = true;
        }
      }
      setRuleVersions(nextRuleVersions);

      let activeProfile: UserProfileDto | null = null;
      try {
        activeProfile = await fetchMyProfileFromApi();
      } catch {
        activeProfile = null;
      }

      let backendCart: Record<string, number> | null = null;
      let backendOrders: OrderDto[] = [];
      let backendTransactions: Store['transactions'] = [];
      let backendAudit: Store['environmentalChanges'] = [];

      if (activeProfile?.role === 'client') {
        try {
          const [cartDto, ordersData] = await Promise.all([
            fetchCartFromApi(),
            fetchOrdersAndTransactionsFromApi(),
          ]);
          setCartVersion(cartDto.version);
          backendCart = Object.fromEntries(cartDto.lines.map(l => [l.lotId, l.quantity]));
          backendOrders = ordersData.items;
          backendTransactions = ordersData.transactions;
        } catch {
          // ignore if session expired
        }
      } else if (activeProfile?.role === 'fisher') {
        try {
          const ordersData = await fetchOrdersAndTransactionsFromApi();
          backendOrders = ordersData.items;
        } catch {
          // ignore
        }
      } else if (activeProfile?.role === 'admin') {
        try {
          const auditItems = await fetchEnvironmentalAuditFromApi(50);
          backendAudit = auditItems.map(a => ({
            id: a.id,
            date: a.occurredAt,
            actor: a.actorName,
            description: a.description,
          }));
        } catch {
          // ignore
        }
      }

      setStore(prev => {
        const nextBans = { ...prev.bans };
        const nextMinimums = { ...prev.minimumSizes };
        for (const sp of speciesList) {
          nextBans[sp.id] = sp.banned;
          nextMinimums[sp.id] = sp.minimumLengthCm;
        }
        for (const r of rulesList) {
          nextBans[r.speciesId] = r.banned;
          nextMinimums[r.speciesId] = r.minimumLengthCm;
        }

        const mappedProducts: Product[] = catalogData.items.map(lot => ({
          id: lot.id,
          speciesId: lot.speciesId,
          fisherId: lot.fisherId,
          name: lot.name,
          scientific: lot.scientific,
          description: lot.description,
          color: lot.color,
          price: lot.price,
          stock: lot.stock,
          ...(lot.pieceWeightGrams !== undefined
            ? { pieceWeightGrams: lot.pieceWeightGrams }
            : {}),
          length: lot.length,
          minimum: lot.minimum,
          zone: lot.zone,
          method: lot.method,
          capturedAt: lot.capturedAt,
          landedAt: lot.landedAt,
          captured: new Date(lot.capturedAt).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          temperature: lot.temperature,
          photo: lot.photo,
          paused: lot.paused,
          fisher: lot.fisher,
          member: lot.member,
        }));

        const productsById = new Map(mappedProducts.map(p => [p.id, p]));
        const nextStock = Object.fromEntries(mappedProducts.map(p => [p.id, p.stock]));
        const mappedFishermen = catalogData.fishermen.map((f, idx) =>
          mapFisherProfileToFisherman(f, idx, fisherPinsRef.current[f.userId]),
        );

        let nextCustomers = prev.customers;
        let nextClientSession = prev.clientSession;
        let nextAdminSession = prev.adminSession;
        let nextSession = prev.session;
        let nextRole = prev.role;
        let nextCart = prev.cart;
        let nextCartOwnerId = prev.cartOwnerId;
        let nextAccessibility = prev.accessibility;
        let nextLarge = prev.large;

        if (activeProfile) {
          nextRole = activeProfile.role;
          nextAccessibility = {
            ...prev.accessibility,
            textSize: activeProfile.textSize,
            readInstructions: activeProfile.readInstructions,
          };
          nextLarge = activeProfile.textSize !== 'normal';

          if (activeProfile.role === 'client') {
            const cust: Customer = {
              id: activeProfile.userId,
              name: activeProfile.name,
              email: activeProfile.email,
              phone: activeProfile.phone,
              address: activeProfile.address,
              passwordDigest: '',
              passwordSalt: '',
            };
            nextCustomers = [cust, ...prev.customers.filter(c => c.id !== cust.id)];
            nextClientSession = activeProfile.userId;
            nextAdminSession = null;
            nextSession = null;
            nextCartOwnerId = activeProfile.userId;
            if (backendCart !== null) {
              nextCart = backendCart;
            }
          } else if (activeProfile.role === 'fisher') {
            nextSession = activeProfile.userId;
            nextClientSession = null;
            nextAdminSession = null;
            nextCartOwnerId = GUEST_CART_ID;
          } else if (activeProfile.role === 'admin') {
            nextAdminSession = activeProfile.userId;
            nextClientSession = null;
            nextSession = null;
            nextCartOwnerId = GUEST_CART_ID;
          }
        }

        const mappedOrders = activeProfile
          ? backendOrders.map(o => mapOrderDtoToStoreOrder(o, productsById))
          : prev.orders;

        return {
          ...prev,
          products: mappedProducts,
          stock: nextStock,
          fishermen: mappedFishermen.length > 0 ? mappedFishermen : prev.fishermen,
          customers: nextCustomers,
          clientSession: nextClientSession,
          adminSession: nextAdminSession,
          session: nextSession,
          role: nextRole,
          cart: nextCart,
          cartOwnerId: nextCartOwnerId,
          bans: nextBans,
          minimumSizes: nextMinimums,
          smallSize: smallSizeSim,
          orders: mappedOrders,
          transactions: activeProfile?.role === 'client' ? backendTransactions : prev.transactions,
          environmentalChanges:
            activeProfile?.role === 'admin' ? backendAudit : prev.environmentalChanges,
          accessibility: nextAccessibility,
          large: nextLarge,
        };
      });
    } catch {
      // ignore network error during initial hydration
    }
  }, [setStore]);

  const applyAuthSession = useCallback(
    async (
      auth: AuthSessionResponseDto,
      options?: { isNewRegistration?: boolean; assignedPin?: string },
    ) => {
      const profile = auth.profile;
      if (options?.assignedPin) {
        fisherPinsRef.current[profile.userId] = options.assignedPin;
      }

      const guestCartEntries = Object.entries(current.current.cart).filter(([, qty]) => qty > 0);

      if (profile.role === 'client' && guestCartEntries.length > 0) {
        try {
          const currentCartDto = await fetchCartFromApi();
          const mergeId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : '11111111-2222-4333-8444-555555555555';
          await mergeGuestCartInApi({
            mergeId,
            expectedCartVersion: currentCartDto.version,
            lines: guestCartEntries.map(([lotId, quantity]) => ({ lotId, quantity })),
          });
        } catch {
          // Si algún lote invitado ya no tiene stock, se conserva el carrito del servidor
        }
      }

      setStore(prev => {
        if (profile.role === 'client') {
          const cust: Customer = {
            id: profile.userId,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            passwordDigest: '',
            passwordSalt: '',
          };
          return {
            ...prev,
            role: 'client',
            clientSession: profile.userId,
            adminSession: null,
            session: null,
            cartOwnerId: profile.userId,
            customers: [cust, ...prev.customers.filter(c => c.id !== cust.id)],
            registrationNotice: options?.isNewRegistration
              ? { role: 'client', id: profile.userId }
              : null,
          };
        }
        if (profile.role === 'fisher') {
          const mappedFisher = mapFisherProfileToFisherman(
            profile,
            prev.fishermen.length,
            options?.assignedPin,
          );
          return {
            ...prev,
            role: 'fisher',
            session: profile.userId,
            clientSession: null,
            adminSession: null,
            fishermen: [
              mappedFisher,
              ...prev.fishermen.filter(f => f.id !== mappedFisher.id),
            ],
            registrationNotice: options?.isNewRegistration
              ? { role: 'fisher', id: profile.userId }
              : null,
          };
        }
        return {
          ...prev,
          role: 'admin',
          adminSession: profile.userId,
          clientSession: null,
          session: null,
          registrationNotice: null,
        };
      });

      await refreshFromBackend();
    },
    [refreshFromBackend, setStore],
  );

  useEffect(() => {
    void refreshFromBackend();
  }, [refreshFromBackend]);

  useEffect(() => {
    const root=document.documentElement;
    const fisher=isFisher(store);
    root.classList.toggle('large-text',fisher?store.accessibility.textSize!=='normal':store.role==='client'&&store.large);
    root.classList.toggle('extra-text',fisher&&store.accessibility.textSize==='extra');
    root.classList.remove('easy-mode','high-visibility');
  }, [store.accessibility,store.large,store.role,store.session]);

  return (
    <Context.Provider
      value={{
        store,
        setStore,
        getStore,
        storageError,
        cartVersion,
        setCartVersion,
        lotVersions,
        ruleVersions,
        refreshFromBackend,
        applyAuthSession,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useStore() {
  const context = useContext(Context);
  if (!context) throw new Error('El componente debe estar dentro de StoreProvider.');
  return context;
}
