import { GUEST_CART_ID, isClient, type Store } from '../domain';

export interface CustomerRegistration {name:string;email:string;phone:string;address:string}

// Actualización de presentación; la persistencia y autorización se resuelven por API.
export function updateCustomerProfile(s:Store,data:CustomerRegistration):Store {
  if(!isClient(s))throw new Error('Inicia sesión como cliente para actualizar tu perfil.');
  return {...s,customers:s.customers.map(c=>c.id===s.clientSession?{
    ...c,name:data.name.trim(),email:data.email.trim().toLowerCase(),phone:data.phone,address:data.address.trim(),
  }:c)};
}

export function signOut(s:Store):Store {
  return {...s,session:null,clientSession:null,adminSession:null,registrationNotice:null,
    role:'client',customers:[],orders:[],transactions:[],clientCarts:{},cartOwnerId:GUEST_CART_ID,cart:{}};
}
