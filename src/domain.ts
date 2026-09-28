import { defaultAccessibility, type AccessibilityPreferences } from './accessibility/preferences';

export interface Product {
  id: string; name: string; scientific: string; price: number; stock: number; zone: string;
  fisher: string; member: string; length: number; minimum: number; method: string;
  captured: string; temperature: number; color: string; description: string;
  speciesId: string; fisherId: string; capturedAt: string; landedAt: string;
  photo: string; paused: boolean;
  // Ausente = venta tradicional por kg. Presente = cada unidad es un pez
  // completo de este peso. El stock y la canasta cuentan unidades, no gramos.
  pieceWeightGrams?: number;
}
export interface Fisherman {
  id: string; name: string; nickname: string; port: string; member: string;
  photo: string; pin: string; email: string; document: string;
  registration: 'demo' | 'solicitud-local';
}
export interface Customer {
  id: string; name: string; email: string; phone: string; address: string;
  passwordDigest: string; passwordSalt: string;
}
export const DEMO_CUSTOMER_ID = 'cliente-demo';
export const GUEST_CART_ID = 'invitado';
export const DEMO_CUSTOMER: Customer = {
  id: DEMO_CUSTOMER_ID, name: 'Cliente de demostración', email: 'comprador@gmail.com',
  phone: '', address: '', passwordSalt: 'raiz-demo-v4',
  passwordDigest: 'a52d8b1daf90149926eaae77fd9910689d117226bd6169f466f481f6418a929e',
};
export type UserRole = 'client' | 'fisher' | 'admin';
export const ADMIN_ACCOUNT = {
  id:'admin-ambiental', name:'Administración ambiental', email:'jairoleal@admin.com',
  passwordSalt:'raiz-admin-v4', passwordDigest:'726c3ba351d72b4cbc36299aa93d06a036bfc8925d88c96d7f912e0b485e217c',
};
export interface EnvironmentalChange {id:string;date:string;actor:string;description:string}
export type PaymentMethod = 'PSE' | 'Nequi' | 'Daviplata' | 'Tarjeta';
export type Fulfillment = 'pendiente' | 'preparado' | 'enviado';
export interface VedaStatus { [speciesId: string]: boolean }
export interface CartItem { product: Product; kg: number; quantity: number }
export interface Delivery { name: string; phone: string; address: string; slot: string; date: string }
export interface Order {
  id: string; clientId: string; createdAt: string; items: CartItem[]; total: number;
  delivery: Delivery; method: PaymentMethod; bank: string; customerType: string;
  fulfillment: Record<string, Fulfillment>;
  receivedAt?: string;
}
export interface Transaction {
  id: string; clientId: string; createdAt: string; method: PaymentMethod; amount: number;
  status: 'exitoso' | 'rechazado' | 'vencido'; orderId: string | null;
}
export interface CaptureDraft {
  speciesId: string; kg: number; price: number; length: number; zone: string;
  method: string; capturedAt: string; landedAt: string; temperature: number; photo: string;
  pieceWeightGrams?: number; quantity?: number; sameWeightConfirmed?: boolean;
}
// Fichas académicas ficticias. Las tallas son parámetros ilustrativos, no una tabla
// normativa oficial. Una implementación real debe consultar resoluciones vigentes.
const SPECIES_SEEDS = [
  { id:'bocachico', name:'Bocachico', scientific:'Prochilodus magdalenae', price:18000, stock:24, zone:'Ciénaga San Silvestre', fisher:'José Antonio Rueda', member:'FP-0018', length:28, minimum:25, method:'Atarraya tradicional', captured:'05:30', temperature:3, color:'#9baf9b', description:'El sabor de nuestra tierra. Ideal para un buen sancocho ribereño.' },
  { id:'rayado', name:'Bagre rayado', scientific:'Pseudoplatystoma magdaleniatum', price:28000, stock:12, zone:'Muelle de Barrancabermeja', fisher:'María del Carmen Díaz', member:'FP-0042', length:85, minimum:80, method:'Línea de mano / anzuelo', captured:'04:45', temperature:2, color:'#b5a98a', description:'Carne suave y llena de tradición, para compartir en familia.' },
  { id:'pintado', name:'Bagre pintado', scientific:'Pseudoplatystoma sp.', price:26000, stock:8, zone:'Corregimiento El Llanito', fisher:'Luis Eduardo Montes', member:'FP-0067', length:75, minimum:80, method:'Línea de mano / anzuelo', captured:'05:15', temperature:3, color:'#a4a89a', description:'Lote de demostración retenido por talla. Identificación taxonómica pendiente.' },
  { id:'nicuro', name:'Nicuro', scientific:'Pimelodus blochii', price:16000, stock:4, zone:'Corregimiento El Llanito', fisher:'Rosa Elena Jiménez', member:'FP-0091', length:22, minimum:18, method:'Línea de mano / anzuelo', captured:'06:00', temperature:2, color:'#c5ac7d', description:'Pequeño en tamaño, grande en sabor. Perfecto para una viuda de pescado.' },
  { id:'dorada', name:'Dorada del río Magdalena', scientific:'Brycon moorei', price:32000, stock:10, zone:'Muelle de Barrancabermeja', fisher:'Carlos Alberto Moreno', member:'FP-0113', length:38, minimum:35, method:'Línea de mano / anzuelo', captured:'05:40', temperature:3, color:'#c9b66f', description:'Nuestra selección especial. Deliciosa a la plancha con limón.' },
  { id:'blanquillo', name:'Blanquillo', scientific:'Sorubim cuspicaudus', price:24000, stock:16, zone:'Ciénaga San Silvestre', fisher:'Pedro Enrique Salom', member:'FP-0156', length:52, minimum:45, method:'Línea de mano / anzuelo', captured:'06:10', temperature:2, color:'#9caaa9', description:'Un clásico del Magdalena, fresco y listo para tu receta favorita.' },
];
export const ZONES = ['Muelle de Barrancabermeja', 'Ciénaga San Silvestre', 'Corregimiento El Llanito', 'La Rampa'];
export const METHODS = ['Atarraya tradicional', 'Línea de mano / anzuelo'];
export const PAYMENT_METHODS: PaymentMethod[] = ['PSE', 'Nequi', 'Daviplata', 'Tarjeta'];

// Retratos ilustrados locales, no fotografías de personas reales. El portal permite
// sustituirlos por una imagen propia. Los perfiles están identificados como ficticios.
export function portrait(color: string, index: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="30" fill="${color}"/><path d="M25 200q5-65 75-65t75 65" fill="#214f43"/><ellipse cx="100" cy="90" rx="39" ry="48" fill="${index % 2 ? '#b57e54' : '#cd9a70'}"/><path d="M56 78q0-53 44-53t44 53l-14-13-30-12-31 13" fill="#454035"/><path d="M43 60h114l-24-23H68z" fill="#e1c38a"/><circle cx="85" cy="89" r="3" fill="#273e33"/><circle cx="116" cy="89" r="3" fill="#273e33"/><path d="M87 114q13 10 26 0" fill="none" stroke="#593f30" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export const FISHERMEN: Fisherman[] = SPECIES_SEEDS.map((p, i) => ({
  id: p.member, member: p.member, name: p.fisher,
  nickname: ['Don José', 'Doña María', 'Don Luis', 'Doña Rosa', 'Don Carlos', 'Don Pedro'][i],
  port: ['Muelle de Barrancabermeja','Corregimiento El Llanito','La Rampa','Corregimiento El Llanito','Muelle de Barrancabermeja','Muelle de Barrancabermeja'][i],
  photo: portrait(['#dbe8bf', '#ead8b7', '#ceddd6'][i % 3], i), pin: '1234',
  email: ['don.jose','dona.maria','don.luis','dona.rosa','don.carlos','don.pedro'][i]+'.fedepesan@pescabarranca.co',
  document: '', registration: 'demo',
}));
const seedDate = (time: string) => {
  const date = new Date(); const [h, m] = time.split(':').map(Number);
  date.setHours(h, m, 0, 0); return date.toISOString();
};
export const MOCK_PRODUCTS: Product[] = SPECIES_SEEDS.map(p => ({
  ...p, speciesId: p.id, fisherId: p.member, capturedAt: seedDate(p.captured),
  landedAt: seedDate('07:00'), paused: false, photo: '',
}));
export const INITIAL_MOCK_DATA = { products: MOCK_PRODUCTS, fishermen: FISHERMEN, customers: [DEMO_CUSTOMER], orders: [] as Order[] };
export type Cart = Record<string, number>;
export type Bans = VedaStatus;
export interface Store {
  version: 4; products: Product[]; fishermen: Fisherman[]; orders: Order[]; transactions: Transaction[];
  customers: Customer[]; clientSession: string | null;
  adminSession: string | null; minimumSizes: Record<string,number>; environmentalChanges: EnvironmentalChange[];
  cartOwnerId: string; clientCarts: Record<string, Cart>;
  registrationNotice: {role:'client'|'fisher';id:string} | null;
  session: string | null; role: UserRole; cart: Cart; bans: VedaStatus;
  stock: Record<string, number>; smallSize: boolean; large: boolean; sales: number;
  deletedProductIds: string[];
  accessibility: AccessibilityPreferences;
}
export const initialStore = (): Store => ({
  version: 4, products: MOCK_PRODUCTS.map(p => ({...p})), fishermen: FISHERMEN.map(f => ({...f})),
  customers: [{...DEMO_CUSTOMER}], clientSession: null, cartOwnerId: GUEST_CART_ID, clientCarts: {}, registrationNotice: null,
  adminSession:null, minimumSizes:Object.fromEntries(MOCK_PRODUCTS.map(p=>[p.speciesId,p.minimum])), environmentalChanges:[],
  orders: [], transactions: [], session: null, role: 'client', cart: {},
  bans: {bocachico:false,rayado:true}, stock: Object.fromEntries(MOCK_PRODUCTS.map(p=>[p.id,p.stock])),
  smallSize: false, large: false, sales: 0, deletedProductIds:[], accessibility:defaultAccessibility(),
});
export const money = (n: number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
export const formatKg = (kg:number) => new Intl.NumberFormat('es-CO',{maximumFractionDigits:3}).format(kg);
export const weightKg = (p:Pick<Product,'pieceWeightGrams'>,quantity:number) => (p.pieceWeightGrams??1000)*quantity/1000;
export const lineAmount = (p:Pick<Product,'pieceWeightGrams'|'price'>,quantity:number) => Math.round(p.price*(p.pieceWeightGrams??1000)*quantity/1000);
export const quantityLabel = (p:Pick<Product,'pieceWeightGrams'>,quantity:number) => p.pieceWeightGrams?`${quantity} ${quantity===1?'pez':'peces'} · ${formatKg(weightKg(p,quantity))} kg`:`${quantity} kg`;
export const unitLabel = (p:Product) => p.pieceWeightGrams?'pez':'kg';
export const cartWeight = (s:Store) => s.products.reduce((g,p)=>g+(p.pieceWeightGrams??1000)*(s.cart[p.id]||0),0)/1000;
export const draftQuantity = (d:CaptureDraft) => d.pieceWeightGrams!==undefined?(d.quantity??0):d.kg;
export const draftWeight = (d:CaptureDraft) => weightKg(d,draftQuantity(d));
export const dateTime = (value: string) => new Date(value).toLocaleString('es-CO', {dateStyle:'medium',timeStyle:'short'});
export const measuredLength = (p: Product, s: Store) => p.speciesId === 'bocachico' && s.smallSize ? 22 : p.length;
export const minimumFor = (p:Product,s:Store) => s.minimumSizes[p.speciesId]??p.minimum;
export const isAdmin = (s:Store) => s.role==='admin'&&s.adminSession===ADMIN_ACCOUNT.id;
export const isClient = (s:Store) => s.role==='client'&&s.customers.some(c=>c.id===s.clientSession);
export const isFisher = (s:Store) => s.role==='fisher'&&s.fishermen.some(f=>f.id===s.session);
export const canShop = (s:Store) => !isAdmin(s)&&!isFisher(s);
export function blockReason(p: Product, s: Store): string {
  if(s.bans[p.speciesId]) return 'Especie en veda';
  if(measuredLength(p,s) < minimumFor(p,s)) return 'Talla no permitida';
  if(p.paused) return 'Venta pausada';
  if(!Number.isInteger(s.stock[p.id]) || s.stock[p.id] <= 0) return 'Agotado';
  return '';
}
// Calculamos con gramos y cantidades enteras; redondeamos cada línea al peso COP.
// Dos peces de 750 g equivalen a 1,5 kg, pero nunca se vende medio pez.
// El 50–60% presentado en la canasta es comparación social, no descuento real.
export const total = (cart: Cart, products: Product[] = MOCK_PRODUCTS) => products.reduce((sum,p)=>sum+lineAmount(p,cart[p.id]||0),0);
export function validateCart(s: Store): string {
  if(!Object.keys(s.cart).length) return 'Agrega pescado a tu canasta para continuar.';
  for(const [id,kg] of Object.entries(s.cart)) {
    const p=s.products.find(p=>p.id===id);
    if(!p || !Number.isInteger(kg) || kg<=0) return 'La cantidad del pedido no es válida.';
    const reason=blockReason(p,s);
    if(reason) return `${p.name}: ${reason}. Retíralo de tu canasta para continuar.`;
    if(kg>s.stock[id]) return `Solo quedan ${quantityLabel(p,s.stock[id])} de ${p.name}. Ajusta tu canasta.`;
  }
  return '';
}
export function changeCartQuantity(s:Store,id:string,delta:number):Store {
  if(!canShop(s))throw new Error('La compra está disponible en las cuentas de cliente.');
  const product=s.products.find(p=>p.id===id);
  if(!product)throw new Error('Ese lote ya no está disponible.');
  if(!Number.isInteger(delta))throw new Error('Elige una cantidad entera; los peces se venden completos.');
  const kg=(s.cart[id]||0)+delta;
  if(delta>0){
    const reason=blockReason(product,s);if(reason)throw new Error(reason);
    if(kg>s.stock[id])throw new Error(`Solo quedan ${quantityLabel(product,s.stock[id])} de ${product.name}.`);
  }
  const cart={...s.cart};if(kg<=0)delete cart[id];else cart[id]=kg;
  return {...s,cart};
}
// Se revalida al confirmar, no solo al añadir: evita vender un lote que entró
// en veda durante el checkout y descontar inventario en una transacción fallida.
export function completeSale(s: Store, order?: Order): Store {
  const error=validateCart(s); if(error) throw new Error(error);
  if(!isClient(s))throw new Error('Entra con tu cuenta de cliente antes de confirmar la compra.');
  if (order) {
    if(!isClient(s) || order.clientId!==s.clientSession) throw new Error('Entra con tu cuenta de cliente antes de confirmar la compra.');
    if (s.orders.some(o => o.id === order.id)) throw new Error('Este pedido ya fue confirmado.');
    const actual = snapshotItems(s);
    if (JSON.stringify(actual) !== JSON.stringify(order.items) || order.total !== total(s.cart,s.products)) {
      throw new Error('Tu canasta o sus precios cambiaron. Revisa el pedido antes de pagar.');
    }
  }
  const stock={...s.stock}; for(const [id,kg] of Object.entries(s.cart)) stock[id]-=kg;
  return {...s,stock,cart:{},sales:s.sales+1,
    orders: order ? [...s.orders, structuredClone(order)] : s.orders,
    transactions: order ? [...s.transactions, {id:order.id, clientId:order.clientId, createdAt:order.createdAt, method:order.method, amount:order.total, status:'exitoso', orderId:order.id}] : s.transactions,
  };
}
// Cada pedido conserva una fotografía de sus datos comerciales (sin imagen pesada):
// cambiar o pausar una publicación nunca altera un recibo ni las ganancias históricas.
export function snapshotItems(s: Store): CartItem[] {
  return s.products.filter(p => s.cart[p.id]).map(p => ({product:{...p,minimum:minimumFor(p,s),length:measuredLength(p,s),photo:''},quantity:s.cart[p.id],kg:weightKg(p,s.cart[p.id])}));
}
export function createOrder(s: Store, delivery: Delivery, method: PaymentMethod, bank = '', customerType = ''): Order {
  if(!isClient(s)) throw new Error('Inicia sesión como cliente para comprar.');
  const error=validateCart(s); if(error) throw new Error(error);
  const items=snapshotItems(s);
  return {
    id:`RIO-${crypto.randomUUID()}`, clientId:s.clientSession!, createdAt:new Date().toISOString(), items,
    total:total(s.cart,s.products), delivery:{...delivery}, method, bank, customerType,
    fulfillment:Object.fromEntries(items.map(item => [item.product.fisherId,'pendiente' as const])),
  };
}
export function recordFailedAttempt(s: Store, method: PaymentMethod, status: 'rechazado' | 'vencido'): Store {
  if(!isClient(s)) throw new Error('Inicia sesión como cliente para simular un pago.');
  return {...s,transactions:[...s.transactions,{id:crypto.randomUUID(),clientId:s.clientSession!,createdAt:new Date().toISOString(),method,amount:total(s.cart,s.products),status,orderId:null}]};
}
export function captureError(d: CaptureDraft, s: Store, requirePhoto=false): string {
  const species=MOCK_PRODUCTS.find(p => p.speciesId===d.speciesId);
  if(!species) return 'Elige una especie de nuestra región.';
  if(s.bans[d.speciesId]) return 'Esta especie está en veda. Ayudemos a cuidar la reproducción del río Magdalena.';
  const length=d.speciesId==='bocachico'&&s.smallSize?22:d.length;
  if(!Number.isInteger(d.length)||length<minimumFor(species,s)) return `La talla es menor a la permitida en esta prueba (${minimumFor(species,s)} cm). Dejemos crecer a los peces.`;
  const quantities=captureQuantityError(d);if(quantities)return quantities;
  if(!integer(d.price,1000,100000)) return 'Elige un precio entre $1.000 y $100.000 por kilo.';
  if(!ZONES.includes(d.zone)||!METHODS.includes(d.method)) return 'Elige el lugar y la forma de pesca.';
  if(!validDate(d.capturedAt)||!validDate(d.landedAt)||Date.parse(d.capturedAt)>Date.parse(d.landedAt)||Date.parse(d.landedAt)>Date.now()+60000) return 'La captura debe ser anterior al desembarque y no puede ser del futuro.';
  if(!Number.isFinite(d.temperature)||d.temperature<0||d.temperature>4) return 'Conserva el lote entre 0 y 4 °C antes de publicarlo.';
  if(requirePhoto&&!d.photo)return 'Agrega una foto del pescado antes de publicar.';
  if(d.photo && !validPhoto(d.photo)) return 'Usa una imagen pequeña en formato JPG, PNG o WebP.';
  return '';
}
export function captureQuantityError(d:CaptureDraft):string {
  if(d.pieceWeightGrams!==undefined){
    if(!integer(d.pieceWeightGrams,1,50000))return 'Indica el peso de cada pez entre 1 y 50.000 gramos.';
    if(!integer(d.quantity,1,500))return 'Indica entre 1 y 500 peces completos para este lote.';
    if(d.sameWeightConfirmed!==true)return 'Confirma que todos los peces del lote tienen el mismo peso. Si pesan diferente, crea lotes separados.';
  }else if(!integer(d.kg,1,500))return 'Elige entre 1 y 500 kilos.';
  return '';
}
export function publishCapture(s: Store, d: CaptureDraft): Store {
  const fisher=s.fishermen.find(f=>f.id===s.session);
  if(!fisher||!isFisher(s)) throw new Error('Primero elige tu perfil de pescador e ingresa al portal.');
  const error=captureError(d,s,true); if(error) throw new Error(error);
  const species=MOCK_PRODUCTS.find(p=>p.speciesId===d.speciesId)!;
  const product: Product={...species,id:`lote-${crypto.randomUUID()}`,fisherId:fisher.id,fisher:fisher.name,member:fisher.member,
    stock:draftQuantity(d),price:d.price,length:d.length,minimum:minimumFor(species,s),zone:d.zone,method:d.method,photo:d.photo,paused:false,
    ...(d.pieceWeightGrams===undefined?{}:{pieceWeightGrams:d.pieceWeightGrams}),
    capturedAt:d.capturedAt,landedAt:d.landedAt,captured:new Date(d.capturedAt).toLocaleTimeString('es-CO'),temperature:d.temperature};
  return {...s,products:[product,...s.products],stock:{...s.stock,[product.id]:draftQuantity(d)}};
}
export function updateInventory(s: Store, id: string, changes: {stock?:number;paused?:boolean}): Store {
  const product=s.products.find(p=>p.id===id);
  if(!isFisher(s)||!product||product.fisherId!==s.session) throw new Error('Solo puedes cambiar tu propia pesca desde tu perfil de pescador.');
  if(changes.stock!==undefined&&!integer(changes.stock,0,500)) throw new Error(`El inventario debe estar entre 0 y 500 ${product.pieceWeightGrams?'peces completos':'kilos'}.`);
  return {...s,products:s.products.map(p=>p.id===id?{...p,paused:changes.paused??p.paused}:p),
    stock:changes.stock===undefined?s.stock:{...s.stock,[id]:changes.stock}};
}
export function removeProduct(s:Store,id:string):Store {
  const product=s.products.find(p=>p.id===id);
  if(!isFisher(s)||!product||product.fisherId!==s.session)throw new Error('Solo puedes eliminar tus propias publicaciones.');
  const without=(cart:Cart)=>Object.fromEntries(Object.entries(cart).filter(([key])=>key!==id));
  // Retirar una oferta no cancela pedidos ya pagados: sus líneas contienen una
  // copia del lote. Se limpian todas las canastas para impedir comprar lo retirado.
  return {...s,products:s.products.filter(p=>p.id!==id),stock:without(s.stock),cart:without(s.cart),
    clientCarts:Object.fromEntries(Object.entries(s.clientCarts).map(([owner,cart])=>[owner,without(cart)])),
    deletedProductIds:[...new Set([...s.deletedProductIds,id])]};
}
export function advanceOrder(s: Store, orderId: string): Store {
  const order=s.orders.find(o=>o.id===orderId);const fisher=s.session;
  if(!isFisher(s)||!fisher||!order?.fulfillment[fisher]) throw new Error('Este pedido no corresponde a tu perfil.');
  const next: Fulfillment=order.fulfillment[fisher]==='pendiente'?'preparado':'enviado';
  return {...s,orders:s.orders.map(o=>o.id===orderId?{...o,fulfillment:{...o.fulfillment,[fisher]:next}}:o)};
}
export function confirmOrderReceived(s:Store,orderId:string):Store {
  const order=s.orders.find(o=>o.id===orderId);
  if(!isClient(s)||!order||order.clientId!==s.clientSession)throw new Error('Solo puedes confirmar la recepción de tus compras.');
  if(!Object.values(order.fulfillment).every(status=>status==='enviado'))throw new Error('El pedido todavía no ha sido enviado completamente.');
  if(order.receivedAt)return s;
  return {...s,orders:s.orders.map(o=>o.id===orderId?{...o,receivedAt:new Date().toISOString()}:o)};
}
export function orderProgress(order:Order):'preparando'|'listo'|'enviado'|'recibido' {
  if(order.receivedAt)return 'recibido';
  const states=Object.values(order.fulfillment);
  if(states.every(s=>s==='enviado'))return 'enviado';
  if(states.every(s=>s!=='pendiente'))return 'listo';
  return 'preparando';
}
export function fisherMetrics(s: Store, fisherId: string, now=new Date()) {
  const days=Array.from({length:7},(_,i)=>{const day=new Date(now);day.setHours(0,0,0,0);day.setDate(day.getDate()-6+i);return {day,amount:0,kg:0,pieces:0};});
  for(const order of s.orders) {
    const date=new Date(order.createdAt);
    const day=days.find(d=>d.day.toDateString()===date.toDateString());
    if(day) for(const line of order.items.filter(i=>i.product.fisherId===fisherId)){day.amount+=lineAmount(line.product,line.quantity);day.kg+=line.kg;day.pieces+=line.product.pieceWeightGrams?line.quantity:0;}
  }
  return {days,today:days[6].amount,week:days.reduce((n,d)=>n+d.amount,0),kg:days.reduce((n,d)=>n+d.kg,0),pieces:days.reduce((n,d)=>n+d.pieces,0),
    pending:s.orders.filter(o=>o.fulfillment[fisherId]&&o.fulfillment[fisherId]!=='enviado').length};
}

// Se verifica el rol también en la lógica de negocio: ocultar un botón no basta
// para impedir que una vista de cliente cambie las reglas compartidas.
function environmentalChange(s:Store,description:string):EnvironmentalChange[] {
  return [{id:crypto.randomUUID(),date:new Date().toISOString(),actor:ADMIN_ACCOUNT.email,description},...s.environmentalChanges].slice(0,50);
}
export function updateEnvironmentalRule(s:Store,speciesId:string,changes:{banned?:boolean;minimum?:number}):Store {
  if(!isAdmin(s))throw new Error('Solo la cuenta administradora puede modificar los controles ambientales.');
  const species=MOCK_PRODUCTS.find(p=>p.speciesId===speciesId);
  if(!species)throw new Error('Selecciona una especie del catálogo.');
  if(changes.minimum!==undefined&&!integer(changes.minimum,1,250))throw new Error('La talla de prueba debe ser un número entero entre 1 y 250 cm.');
  if(changes.banned!==undefined&&typeof changes.banned!=='boolean')throw new Error('El estado de veda no es válido.');
  const description=`${species.name}: ${changes.banned!==undefined?`veda ${changes.banned?'activada':'desactivada'}`:`talla mínima ajustada a ${changes.minimum} cm`}.`;
  return {...s,bans:changes.banned===undefined?s.bans:{...s.bans,[speciesId]:changes.banned},
    minimumSizes:changes.minimum===undefined?s.minimumSizes:{...s.minimumSizes,[speciesId]:changes.minimum},
    environmentalChanges:environmentalChange(s,description)};
}
export function setSmallSizeSimulation(s:Store,enabled:boolean):Store {
  if(!isAdmin(s))throw new Error('Solo la cuenta administradora puede modificar los controles ambientales.');
  return {...s,smallSize:enabled,environmentalChanges:environmentalChange(s,`Simulación de Bocachico de 22 cm ${enabled?'activada':'desactivada'}.`)};
}

export const STORAGE_KEY='raiz-rio-demo-v4';
const integer=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;
const validDate=(s:unknown):s is string=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const validPhoto=(s:unknown):s is string=>typeof s==='string'&&s.length<220000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
const isRecord=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
function validProduct(v:unknown, fishermen: Fisherman[]):v is Product {
  if(!isRecord(v))return false;
  const strings=['id','speciesId','fisherId','name','scientific','zone','fisher','member','method','captured','color','description'];
  return strings.every(k=>typeof v[k]==='string'&&(v[k] as string).length<500)
    &&MOCK_PRODUCTS.some(p=>p.speciesId===v.speciesId)&&fishermen.some(f=>f.id===v.fisherId)
    &&typeof v.id==='string'&&/^[a-zA-Z0-9-]+$/.test(v.id)
    &&integer(v.price,1000,100000)&&integer(v.stock,0,500)&&integer(v.length,1,250)&&integer(v.minimum,1,250)
    &&(v.pieceWeightGrams===undefined||integer(v.pieceWeightGrams,1,50000))
    &&validDate(v.capturedAt)&&validDate(v.landedAt)&&typeof v.paused==='boolean'
    &&typeof v.temperature==='number'&&Number.isFinite(v.temperature)&&(v.photo===''||validPhoto(v.photo));
}
function validOrder(v:unknown, fishermen:Fisherman[], customers:Customer[]):v is Order {
  if(!isRecord(v)||typeof v.id!=='string'||!validDate(v.createdAt)||!PAYMENT_METHODS.includes(v.method as PaymentMethod)
    ||!Array.isArray(v.items)||!v.items.length||!isRecord(v.delivery)||!isRecord(v.fulfillment))return false;
  if(!['name','phone','address','slot','date'].every(k=>typeof (v.delivery as Record<string,unknown>)[k]==='string'))return false;
  const fulfillment=v.fulfillment;
  return customers.some(c=>c.id===v.clientId)&&v.items.every(i=>isRecord(i)&&validProduct(i.product,fishermen)&&integer(i.quantity,1,500)&&i.kg===weightKg(i.product,i.quantity)
    &&['pendiente','preparado','enviado'].includes(String(fulfillment[i.product.fisherId])))
    &&v.total===v.items.reduce((n,i)=>n+lineAmount(i.product,i.quantity),0)&&typeof v.bank==='string'&&typeof v.customerType==='string'
    &&(v.receivedAt===undefined||(validDate(v.receivedAt)&&Object.values(fulfillment).every(status=>status==='enviado')));
}
const validEmail=(v:unknown):v is string=>typeof v==='string'&&v.length<=150&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v===v.trim().toLowerCase();
function registeredFisher(v:unknown):Fisherman|null {
  if(!isRecord(v)||typeof v.id!=='string'||!/^fisher-[a-z0-9-]+$/.test(v.id)
    ||!validEmail(v.email)||typeof v.document!=='string'||!/^\d{6,12}$/.test(v.document)
    ||typeof v.pin!=='string'||!/^\d{4}$/.test(v.pin)||v.registration!=='solicitud-local'
    ||!['name','nickname','port','member'].every(k=>typeof v[k]==='string'&&(v[k] as string).length>0&&(v[k] as string).length<=150)
    ||!ZONES.includes(String(v.port)))return null;
  return {id:v.id,name:String(v.name),nickname:String(v.nickname),port:String(v.port),member:String(v.member),
    photo:validPhoto(v.photo)?v.photo:portrait('#dbe8bf',0),pin:v.pin,email:v.email,document:v.document,registration:'solicitud-local'};
}
function registeredCustomer(v:unknown):Customer|null {
  if(!isRecord(v)||typeof v.id!=='string'||!(v.id===DEMO_CUSTOMER_ID||/^client-[a-z0-9-]+$/.test(v.id))||!validEmail(v.email)
    ||typeof v.name!=='string'||v.name.trim().length<2||v.name.length>100
    ||typeof v.phone!=='string'||!(v.id===DEMO_CUSTOMER_ID&&v.phone===''||/^3\d{9}$/.test(v.phone))||typeof v.address!=='string'||!(v.id===DEMO_CUSTOMER_ID&&v.address===''||v.address.trim().length>=8&&v.address.length<=180)
    ||typeof v.passwordDigest!=='string'||!/^[a-f0-9]{64}$/.test(v.passwordDigest)
    ||typeof v.passwordSalt!=='string'||v.passwordSalt.length<8||v.passwordSalt.length>100)return null;
  return {id:v.id,name:v.name,email:v.email,phone:v.phone,address:v.address,passwordDigest:v.id===DEMO_CUSTOMER_ID?DEMO_CUSTOMER.passwordDigest:v.passwordDigest,passwordSalt:v.id===DEMO_CUSTOMER_ID?DEMO_CUSTOMER.passwordSalt:v.passwordSalt};
}
// V4 carga primero identidades y después los lotes/pedidos que las referencian.
// Así una publicación de un pescador registrado no desaparece al recargar.
// Las sesiones antiguas no se convierten en accesos autenticados V4: la migración
// conserva el comercio anterior y pide entrar por el nuevo módulo unificado.
export function loadStore(): Store {
  const base=initialStore();
  try {
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem('raiz-rio-demo-v2')||localStorage.getItem('raiz-rio-demo-v1')||'null');
    if(!raw || typeof raw!=='object') return base;
    const modern=raw.version===2||raw.version===4;
    if(modern) {
      if(Array.isArray(raw.deletedProductIds))base.deletedProductIds=[...new Set(raw.deletedProductIds.filter((id:unknown):id is string=>typeof id==='string'&&/^[a-zA-Z0-9-]+$/.test(id)))] as string[];
      if(Array.isArray(raw.fishermen)) {
        base.fishermen=base.fishermen.map(f=>{
          const saved=raw.fishermen.find((r:unknown)=>isRecord(r)&&r.id===f.id);
          return saved&&validPhoto(saved.photo)?{...f,photo:saved.photo}:f;
        });
        if(raw.version===4)for(const entry of raw.fishermen) {
          const fisher=registeredFisher(entry);
          if(fisher&&!base.fishermen.some(f=>f.id===fisher.id||f.email===fisher.email||(f.document&&f.document===fisher.document))&&fisher.email!==DEMO_CUSTOMER.email&&fisher.email!==ADMIN_ACCOUNT.email)base.fishermen.push(fisher);
        }
      }
      if(raw.version===4&&Array.isArray(raw.customers)){
        // La cuenta de demostración también puede editar sus datos. Restaurarla
        // primero evita que el arranque vuelva a sobrescribirlos con la semilla.
        const demo=registeredCustomer(raw.customers.find((entry:unknown)=>isRecord(entry)&&entry.id===DEMO_CUSTOMER_ID));
        if(demo&&demo.email!==ADMIN_ACCOUNT.email&&!base.fishermen.some(f=>f.email===demo.email))base.customers[0]=demo;
        for(const entry of raw.customers){
          const customer=registeredCustomer(entry);
          if(customer&&customer.email!==ADMIN_ACCOUNT.email&&!base.customers.some(c=>c.id===customer.id||c.email===customer.email)&&!base.fishermen.some(f=>f.email===customer.email))base.customers.push(customer);
        }
      }
      if(Array.isArray(raw.products)) {
        const seen=new Set<string>();
        const products=raw.products.filter((p:unknown)=>{if(!validProduct(p,base.fishermen)||seen.has(p.id)||base.deletedProductIds.includes(p.id))return false;seen.add(p.id);return true;}) as Product[];
        base.products=[...products,...MOCK_PRODUCTS.filter(p=>!seen.has(p.id)&&!base.deletedProductIds.includes(p.id)).map(p=>({...p}))];
      }
      base.products=base.products.filter(p=>!base.deletedProductIds.includes(p.id));
      if(Array.isArray(raw.orders)){
        const seen=new Set<string>();
        base.orders=raw.orders.map((o:unknown)=>isRecord(o)&&raw.version===2?{...o,clientId:DEMO_CUSTOMER_ID}:o)
          .map((o:unknown)=>isRecord(o)&&Array.isArray(o.items)?{...o,items:o.items.map((i:unknown)=>isRecord(i)&&isRecord(i.product)&&i.quantity===undefined&&i.product.pieceWeightGrams===undefined?{...i,quantity:i.kg}:i)}:o)
          .filter((o:unknown)=>{if(!validOrder(o,base.fishermen,base.customers)||seen.has(o.id))return false;seen.add(o.id);return true;});
      }
      if(Array.isArray(raw.transactions))base.transactions=raw.transactions.map((t:unknown)=>isRecord(t)&&raw.version===2?{...t,clientId:DEMO_CUSTOMER_ID}:t)
        .filter((t:unknown)=>isRecord(t)&&typeof t.id==='string'&&base.customers.some(c=>c.id===t.clientId)&&validDate(t.createdAt)&&PAYMENT_METHODS.includes(t.method as PaymentMethod)&&integer(t.amount,0,Number.MAX_SAFE_INTEGER)&&['exitoso','rechazado','vencido'].includes(String(t.status))&&(t.orderId===null||typeof t.orderId==='string'));
      if(raw.version===4) {
        base.role=raw.role==='admin'?'admin':raw.role==='fisher'?'fisher':'client';
        base.session=base.role==='fisher'&&base.fishermen.some(f=>f.id===raw.session)?raw.session:null;
        base.clientSession=base.role==='client'&&base.customers.some(c=>c.id===raw.clientSession)?raw.clientSession:null;
        base.adminSession=base.role==='admin'&&raw.adminSession===ADMIN_ACCOUNT.id?ADMIN_ACCOUNT.id:null;
        base.cartOwnerId=raw.cartOwnerId===GUEST_CART_ID?GUEST_CART_ID:base.customers.some(c=>c.id===raw.cartOwnerId)?raw.cartOwnerId:base.clientSession||GUEST_CART_ID;
        if(isRecord(raw.clientCarts))for(const id of [GUEST_CART_ID,...base.customers.map(c=>c.id)]) {
          const cart=raw.clientCarts[id];
          if(isRecord(cart))base.clientCarts[id]=Object.fromEntries(Object.entries(cart).filter((entry):entry is [string,number]=>base.products.some(p=>p.id===entry[0])&&integer(entry[1],1,500)));
        }
        if(isRecord(raw.registrationNotice)) {
          const notice=raw.registrationNotice;
          if((notice.role==='client'&&base.customers.some(c=>c.id===notice.id))||(notice.role==='fisher'&&base.fishermen.some(f=>f.id===notice.id)))base.registrationNotice={role:notice.role as 'client'|'fisher',id:String(notice.id)};
        }
      }
    }
    base.stock=Object.fromEntries(base.products.map(p=>[p.id,p.stock]));
    for(const p of base.products) {
      const stock=raw.stock?.[p.id];
      if(integer(stock,0,modern?500:p.stock)) base.stock[p.id]=stock;
      const kg=raw.cart?.[p.id];
      if(integer(kg,1,modern?500:p.stock)) base.cart[p.id]=kg;
    }
    // Al abrir el catálogo públicamente no exponemos una canasta privada guardada
    // por una versión anterior que conservaba su propietario después del logout.
    if(raw.version===2)base.cartOwnerId=DEMO_CUSTOMER_ID;
    if(!base.clientSession&&base.cartOwnerId!==GUEST_CART_ID){
      base.clientCarts[base.cartOwnerId]={...base.cart};
      base.cart={...(base.clientCarts[GUEST_CART_ID]||{})};base.cartOwnerId=GUEST_CART_ID;
    }
    for(const p of MOCK_PRODUCTS){
      if(typeof raw.bans?.[p.speciesId]==='boolean')base.bans[p.speciesId]=raw.bans[p.speciesId];
      if(integer(raw.minimumSizes?.[p.speciesId],1,250))base.minimumSizes[p.speciesId]=raw.minimumSizes[p.speciesId];
    }
    if(Array.isArray(raw.environmentalChanges))base.environmentalChanges=raw.environmentalChanges.filter((v:unknown)=>isRecord(v)&&typeof v.id==='string'&&validDate(v.date)&&v.actor===ADMIN_ACCOUNT.email&&typeof v.description==='string'&&v.description.length<300).slice(0,50);
    base.large=raw.large===true; base.smallSize=raw.smallSize===true;
    if(isRecord(raw.accessibility)){
      const a=raw.accessibility;
      if(a.textSize==='normal'||a.textSize==='large'||a.textSize==='extra')base.accessibility.textSize=a.textSize;
      if(typeof a.readInstructions==='boolean')base.accessibility.readInstructions=a.readInstructions;
    }
    // Las ayudas del pescador y el botón T del cliente son preferencias
    // independientes. Se ignoran opciones retiradas de versiones anteriores.
    base.sales=modern?base.orders.length:Number.isSafeInteger(raw.sales)&&raw.sales>=0?raw.sales:0;
    return base;
  } catch { return base; }
}
