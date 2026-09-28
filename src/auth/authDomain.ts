import { ADMIN_ACCOUNT, DEMO_CUSTOMER_ID, GUEST_CART_ID, isClient, portrait, type Customer, type Fisherman, type Store } from '../domain';

export const REGISTRATION_PORTS=['Muelle de Barrancabermeja','La Rampa','Corregimiento El Llanito'];
export interface CustomerRegistration {name:string;email:string;phone:string;address:string}
export interface FisherRegistration {name:string;document:string;port:string}
export interface PasswordCredential {passwordDigest:string;passwordSalt:string}
export const normalizeEmail=(email:string)=>email.trim().toLowerCase();
const validEmail=(email:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&email.length<=150;

export function customerRegistrationError(d:CustomerRegistration,s:Store,excludeId?:string):string {
  const email=normalizeEmail(d.email);
  if(d.name.trim().length<2||d.name.trim().length>100)return 'Escribe tu nombre completo, entre 2 y 100 caracteres.';
  if(!validEmail(email))return 'Revisa tu correo. Debe tener un formato como nombre@gmail.com.';
  if(email===ADMIN_ACCOUNT.email||s.customers.some(c=>c.id!==excludeId&&c.email===email)||s.fishermen.some(f=>f.email===email))return 'Ese correo ya tiene una cuenta. Usa un correo diferente.';
  if(!/^3\d{9}$/.test(d.phone))return 'Escribe un celular de 10 números que comience por 3.';
  if(d.address.trim().length<8||d.address.trim().length>180)return 'Escribe la dirección completa de entrega en Barrancabermeja.';
  return '';
}
export function fisherRegistrationError(d:FisherRegistration,s:Store):string {
  if(d.name.trim().length<2||d.name.trim().length>100)return 'Escribe tu nombre completo, entre 2 y 100 caracteres.';
  if(!/^\d{6,12}$/.test(d.document))return 'Escribe tu cédula usando entre 6 y 12 números, sin puntos.';
  if(s.fishermen.some(f=>f.document===d.document))return 'Ya existe una solicitud con esa cédula. Selecciona tu perfil en Inicio de Sesión.';
  if(!REGISTRATION_PORTS.includes(d.port))return 'Elige tu puerto de desembarque.';
  return '';
}

// Web Crypto funciona sin red. Se guarda una huella con sal, no la contraseña
// escrita. Sigue siendo autenticación de demostración controlada por el cliente.
export async function passwordDigest(password:string,salt:string):Promise<string> {
  if(!globalThis.crypto?.subtle)throw new Error('Abre la aplicación en localhost o HTTPS para usar el ingreso con contraseña. También puedes usar el ingreso rápido de demostración.');
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function createCredential(password:string):Promise<PasswordCredential> {
  if(password.length<8||password.length>128)throw new Error('Crea una contraseña de entre 8 y 128 caracteres.');
  const passwordSalt=crypto.randomUUID();
  return {passwordSalt,passwordDigest:await passwordDigest(password,passwordSalt)};
}

// Conservamos la canasta de cada comprador antes de activar otra cuenta. El
// cambio de rol no borra ni asigna a otra persona productos ya seleccionados.
export function activateCustomer(s:Store,id:string):Store {
  if(!s.customers.some(c=>c.id===id))throw new Error('No encontramos esa cuenta de cliente.');
  const clientCarts={...s.clientCarts,[s.cartOwnerId]:{...s.cart}};
  const cart=id===s.cartOwnerId?{...s.cart}:{...(clientCarts[id]||{})};
  // Navegar y preparar la canasta no exige cuenta. Al entrar incorporamos la
  // selección de invitado una sola vez; stock y vedas se revalidan en el checkout.
  if(s.cartOwnerId===GUEST_CART_ID){
    for(const [productId,kg] of Object.entries(s.cart))cart[productId]=Math.min(500,(cart[productId]||0)+kg);
    clientCarts[GUEST_CART_ID]={};
  }
  return {...s,clientSession:id,session:null,adminSession:null,role:'client',cartOwnerId:id,clientCarts,cart,registrationNotice:s.registrationNotice?.role==='client'?s.registrationNotice:null};
}
export const enterDemoCustomer=(s:Store)=>activateCustomer(s,DEMO_CUSTOMER_ID);
export function loginCustomer(s:Store,email:string,digest:string):Store {
  const customer=s.customers.find(c=>c.email===normalizeEmail(email));
  if(!customer||customer.passwordDigest!==digest)throw new Error('El correo o la contraseña no coinciden. Revisa tus datos e inténtalo otra vez.');
  return activateCustomer(s,customer.id);
}
export function registerCustomer(s:Store,d:CustomerRegistration,credential:PasswordCredential):Store {
  const error=customerRegistrationError(d,s);if(error)throw new Error(error);
  if(!/^[a-f0-9]{64}$/.test(credential.passwordDigest)||credential.passwordSalt.length<8)throw new Error('No pudimos preparar la contraseña. Inténtalo otra vez.');
  const customer:Customer={id:`client-${crypto.randomUUID()}`,name:d.name.trim(),email:normalizeEmail(d.email),phone:d.phone,address:d.address.trim(),...credential};
  return activateCustomer({...s,customers:[...s.customers,customer],registrationNotice:{role:'client',id:customer.id}},customer.id);
}
export function updateCustomerProfile(s:Store,data:CustomerRegistration):Store {
  if(!isClient(s))throw new Error('Inicia sesión como cliente para actualizar tu perfil.');
  const error=customerRegistrationError(data,s,s.clientSession!);if(error)throw new Error(error);
  // El ID y las credenciales no cambian. Pedidos, canastas y recibos históricos
  // mantienen su titular y su dirección original; la nueva dirección se usa en
  // futuros checkouts. No se permite editar el perfil de otra cuenta.
  return {...s,customers:s.customers.map(c=>c.id===s.clientSession?{...c,name:data.name.trim(),email:normalizeEmail(data.email),phone:data.phone,address:data.address.trim()}:c)};
}
export function assignedFisherEmail(s:Store,name:string):string {
  const slug=name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean).join('.').slice(0,55)||'pescador';
  let index=1;let email=`${slug}.fedepesan@pescabarranca.co`;
  while(s.fishermen.some(f=>f.email===email)||s.customers.some(c=>c.email===email)){index++;email=`${slug}.${index}.fedepesan@pescabarranca.co`;}
  return email;
}
export function registerFisher(s:Store,d:FisherRegistration):Store {
  const error=fisherRegistrationError(d,s);if(error)throw new Error(error);
  const id=`fisher-${crypto.randomUUID()}`;
  const pin=String(crypto.getRandomValues(new Uint32Array(1))[0]%10000).padStart(4,'0');
  const fisher:Fisherman={id,name:d.name.trim(),nickname:d.name.trim().split(/\s+/)[0],document:d.document,port:d.port,
    email:assignedFisherEmail(s,d.name),pin,member:`FP-DEMO-${id.slice(-8).toUpperCase()}`,registration:'solicitud-local',photo:portrait('#dbe8bf',0)};
  return {...signOut(s),fishermen:[...s.fishermen,fisher],session:id,role:'fisher',registrationNotice:{role:'fisher',id}};
}
export function loginFisher(s:Store,id:string,pin:string,oneTouch=false):Store {
  const fisher=s.fishermen.find(f=>f.id===id);
  if(!fisher)throw new Error('Elige primero tu correo o perfil de pescador.');
  if(!oneTouch&&fisher.pin!==pin)throw new Error('Ese PIN no coincide. Revisa los cuatro números e inténtalo otra vez.');
  return {...signOut(s),session:fisher.id,role:'fisher'};
}
export function signOut(s:Store):Store {
  const clientCarts={...s.clientCarts,[s.cartOwnerId]:{...s.cart}};
  return {...s,session:null,clientSession:null,adminSession:null,registrationNotice:null,role:'client',clientCarts,cartOwnerId:GUEST_CART_ID,cart:{...(clientCarts[GUEST_CART_ID]||{})}};
}
export function loginAdmin(s:Store,email:string,digest:string):Store {
  if(normalizeEmail(email)!==ADMIN_ACCOUNT.email||digest!==ADMIN_ACCOUNT.passwordDigest)throw new Error('El correo o la contraseña de administración no coinciden.');
  return {...signOut(s),role:'admin',adminSession:ADMIN_ACCOUNT.id};
}
