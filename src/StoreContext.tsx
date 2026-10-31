import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { fetchCatalogFromApi, fetchSpeciesFromApi } from './client/catalog';
import { isFisher, loadStore, STORAGE_KEY, type Product, type Store } from './domain';

interface SharedStore {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  getStore: () => Store;
  storageError: boolean;
  refreshFromBackend: () => Promise<void>;
}
const Context = createContext<SharedStore | null>(null);

export function StoreProvider({children}: {children: ReactNode}) {
  const [store, renderStore] = useState(loadStore);
  const current = useRef(store);
  const [storageError, setStorageError] = useState(false);

  // Ambas vistas consumen esta única fuente de verdad. La referencia se actualiza
  // sincrónicamente: dos acciones del mismo evento no trabajan con stock antiguo.
  const setStore = useCallback<Dispatch<SetStateAction<Store>>>(action => {
    const next = typeof action === 'function' ? action(current.current) : action;
    current.current = next;
    renderStore(next);
  }, []);
  const getStore = useCallback(() => current.current, []);

  const refreshFromBackend = useCallback(async () => {
    try {
      const [speciesList, catalogLots] = await Promise.all([
        fetchSpeciesFromApi(),
        fetchCatalogFromApi(),
      ]);

      setStore(prev => {
        const nextBans = { ...prev.bans };
        const nextMinimums = { ...prev.minimumSizes };
        for (const sp of speciesList) {
          nextBans[sp.id] = sp.banned;
          nextMinimums[sp.id] = sp.minimumLengthCm;
        }

        if (catalogLots.length === 0) {
          return {
            ...prev,
            bans: nextBans,
            minimumSizes: nextMinimums,
          };
        }

        const mappedProducts: Product[] = catalogLots.map(lot => ({
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

        const nextStock = Object.fromEntries(mappedProducts.map(p => [p.id, p.stock]));
        return {
          ...prev,
          products: mappedProducts,
          stock: nextStock,
          bans: nextBans,
          minimumSizes: nextMinimums,
        };
      });
    } catch {
      // Si DATABASE_URL aún no está configurada localmente, conserva el estado actual sin bloquear UI
    }
  }, [setStore]);

  useEffect(() => {
    void refreshFromBackend();
  }, [refreshFromBackend]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [store]);
  useEffect(() => {
    const root=document.documentElement;
    const fisher=isFisher(store);
    root.classList.toggle('large-text',fisher?store.accessibility.textSize!=='normal':store.role==='client'&&store.large);
    root.classList.toggle('extra-text',fisher&&store.accessibility.textSize==='extra');
    root.classList.remove('easy-mode','high-visibility');
  }, [store.accessibility,store.large,store.role,store.session]);

  return <Context.Provider value={{store,setStore,getStore,storageError,refreshFromBackend}}>{children}</Context.Provider>;
}

export function useStore() {
  const context = useContext(Context);
  if (!context) throw new Error('El componente debe estar dentro de StoreProvider.');
  return context;
}
