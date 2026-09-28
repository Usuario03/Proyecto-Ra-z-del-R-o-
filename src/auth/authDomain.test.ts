import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_ACCOUNT, blockReason, captureError, completeSale, createOrder, DEMO_CUSTOMER_ID, GUEST_CART_ID, initialStore, isAdmin, loadStore, publishCapture, setSmallSizeSimulation, STORAGE_KEY, updateEnvironmentalRule, type Store } from '../domain';
import { activateCustomer, createCredential, enterDemoCustomer, loginAdmin, loginCustomer, loginFisher, passwordDigest, registerCustomer, registerFisher, signOut, updateCustomerProfile } from './authDomain';
import { TEST_PHOTO } from '../testFixtures';

const customerData={name:'Ana Pérez',email:'ANA@GMAIL.COM ',phone:'3001234567',address:'Calle 10 #20-30, Centro'};
function reload(s:unknown,key=STORAGE_KEY):Store {
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(requested:string)=>requested===key?JSON.stringify(s):null}});
  try{return loadStore();}finally{Reflect.deleteProperty(globalThis,'localStorage');}
}

test('registro de cliente normaliza correo, guarda huella y activa la tienda',async()=>{
  const credential=await createCredential('MiClave123');
  const s=registerCustomer(initialStore(),customerData,credential);
  const customer=s.customers.find(c=>c.id===s.clientSession)!;
  assert.equal(customer.email,'ana@gmail.com');assert.equal(s.role,'client');assert.equal(customer.address,customerData.address);
  assert.equal(JSON.stringify(s).includes('MiClave123'),false);
  assert.throws(()=>registerCustomer(s,{...customerData,email:'ana@gmail.com'},credential),/ya tiene/);
  assert.deepEqual(reload(s),s);
  const logged=loginCustomer(signOut(s),' Ana@GMAIL.com ',await passwordDigest('MiClave123',customer.passwordSalt));
  assert.equal(logged.clientSession,customer.id);
  assert.throws(()=>loginCustomer(signOut(s),customer.email,'incorrecto'),/no coinciden/);
});
test('cuenta demo funciona tanto por botón como por contraseña',async()=>{
  const s=initialStore();const demo=s.customers[0];
  assert.equal(loginCustomer(s,'comprador@gmail.com',await passwordDigest('Demo1234',demo.passwordSalt)).clientSession,DEMO_CUSTOMER_ID);
  assert.equal(enterDemoCustomer(s).clientSession,DEMO_CUSTOMER_ID);
  await assert.rejects(()=>createCredential('corta'),/8 y 128/);
});
test('solicitudes de pescador asignan correo único y PIN y rechazan cédulas repetidas',()=>{
  let s=registerFisher(initialStore(),{name:'César Martínez',document:'12345678',port:'La Rampa'});
  const first=s.fishermen.at(-1)!;
  assert.equal(first.email,'cesar.martinez.fedepesan@pescabarranca.co');assert.match(first.pin,/^\d{4}$/);
  assert.equal(s.role,'fisher');assert.equal(s.session,first.id);
  assert.throws(()=>registerFisher(s,{name:'Otra Persona',document:'12345678',port:'La Rampa'}),/cédula/);
  s=registerFisher(s,{name:'César Martínez',document:'87654321',port:'La Rampa'});
  assert.equal(s.fishermen.at(-1)!.email,'cesar.martinez.2.fedepesan@pescabarranca.co');
  assert.equal(loginFisher(signOut(s),first.id,first.pin).session,first.id);
  assert.throws(()=>loginFisher(signOut(s),first.id,'abcd'),/PIN no coincide/);
  assert.equal(loginFisher(signOut(s),first.id,'',true).session,first.id);
  assert.deepEqual(reload(s),s);
});
test('un pescador registrado conserva publicaciones y pedidos después de recargar',()=>{
  let s=registerFisher(initialStore(),{name:'César Martínez',document:'12345678',port:'La Rampa'});
  const fisherId=s.session!;
  s=publishCapture(s,{speciesId:'nicuro',kg:4,price:16000,length:22,zone:'La Rampa',method:'Atarraya tradicional',temperature:3,photo:TEST_PHOTO,capturedAt:new Date(Date.now()-7200000).toISOString(),landedAt:new Date(Date.now()-3600000).toISOString()});
  const product=s.products[0];s=enterDemoCustomer(s);s.cart={[product.id]:1};
  const order=createOrder(s,{name:'Demo',phone:'3001234567',address:'Calle 1 # 2-30',slot:'mañana',date:'mañana'},'PSE');
  s=completeSale(s,order);const loaded=reload(s);
  assert.equal(loaded.products[0].fisherId,fisherId);assert.equal(loaded.stock[product.id],3);
  assert.equal(loaded.orders[0].fulfillment[fisherId],'pendiente');assert.deepEqual(loaded,s);
});
test('las canastas y la titularidad del pedido se separan por cliente',async()=>{
  let s=enterDemoCustomer(initialStore());s.cart={nicuro:2};
  s=registerCustomer(s,customerData,await createCredential('MiClave123'));const id=s.clientSession!;
  assert.deepEqual(s.cart,{});s.cart={bocachico:1};
  const order=createOrder(s,{name:'Ana',phone:'3001234567',address:'Calle 1 #2-30',slot:'mañana',date:'mañana'},'PSE');
  assert.equal(order.clientId,id);
  s=activateCustomer(s,DEMO_CUSTOMER_ID);assert.deepEqual(s.cart,{nicuro:2});
  assert.throws(()=>completeSale(s,order),/cuenta de cliente/);
  s=activateCustomer(s,id);assert.deepEqual(s.cart,{bocachico:1});
  s=completeSale(s,order);assert.equal(s.transactions[0].clientId,id);
  const loggedOut=signOut(s);assert.equal(loggedOut.clientSession,null);assert.equal(loggedOut.session,null);
  assert.throws(()=>createOrder({...loggedOut,cart:{nicuro:1}},order.delivery,'PSE'),/Inicia sesión/);
});
test('migración V2 conserva comercio y solicita autenticación V4',()=>{
  let s=enterDemoCustomer(initialStore());s.cart={bocachico:1};
  s=completeSale(s,createOrder(s,{name:'Demo',phone:'3001234567',address:'Calle 1 #2-30',slot:'mañana',date:'mañana'},'PSE'));
  const old={...s,version:2,session:'FP-0018',orders:s.orders.map(({clientId:_,...o})=>o),transactions:s.transactions.map(({clientId:_,...t})=>t)};
  const loaded=reload(old,'raiz-rio-demo-v2');
  assert.equal(loaded.version,4);assert.equal(loaded.session,null);assert.equal(loaded.clientSession,null);
  assert.equal(loaded.orders[0].clientId,DEMO_CUSTOMER_ID);assert.equal(loaded.stock.bocachico,23);
});
test('persistencia descarta sesiones inexistentes y registros malformados',()=>{
  const s=initialStore();
  const loaded=reload({...s,clientSession:'missing',session:'missing',customers:[{id:'client-broken'}],fishermen:[{id:'fisher-broken'}]});
  assert.equal(loaded.clientSession,null);assert.equal(loaded.session,null);assert.equal(loaded.customers.length,1);assert.equal(loaded.fishermen.length,6);
});
test('la canasta invitada se incorpora una sola vez y logout oculta la canasta privada',()=>{
  let s=initialStore();s.cart={bocachico:2};
  assert.equal(s.cartOwnerId,GUEST_CART_ID);assert.deepEqual(reload(s).cart,s.cart);
  s=enterDemoCustomer(s);assert.deepEqual(s.cart,{bocachico:2});
  s=signOut(s);assert.deepEqual(s.cart,{});assert.equal(s.cartOwnerId,GUEST_CART_ID);
  s.cart={bocachico:1,nicuro:1};s=enterDemoCustomer(reload(s));
  assert.deepEqual(s.cart,{bocachico:3,nicuro:1});
  s=enterDemoCustomer(signOut(s));assert.deepEqual(s.cart,{bocachico:3,nicuro:1});
});
test('administrador autentica con contraseña y las sesiones son excluyentes',async()=>{
  const digest=await passwordDigest('Admin1234',ADMIN_ACCOUNT.passwordSalt);
  assert.throws(()=>loginAdmin(initialStore(),ADMIN_ACCOUNT.email,'incorrecto'),/no coinciden/);
  let s=enterDemoCustomer(initialStore());s.cart={nicuro:2};
  s=loginAdmin(s,ADMIN_ACCOUNT.email.toUpperCase(),digest);
  assert.equal(isAdmin(s),true);assert.equal(s.clientSession,null);assert.equal(s.session,null);assert.deepEqual(s.cart,{});
  assert.deepEqual(reload(s),s);
  s=loginFisher(s,'FP-0018','1234');assert.equal(s.adminSession,null);assert.equal(s.clientSession,null);
  s=enterDemoCustomer(s);assert.equal(s.session,null);assert.equal(s.adminSession,null);assert.deepEqual(s.cart,{nicuro:2});
  assert.throws(()=>loginCustomer(s,ADMIN_ACCOUNT.email,digest),/no coinciden/);
  assert.throws(()=>registerCustomer(s,{...customerData,email:ADMIN_ACCOUNT.email},{passwordSalt:ADMIN_ACCOUNT.passwordSalt,passwordDigest:digest}),/ya tiene/);
});
test('invitados, clientes y pescadores no pueden modificar reglas ambientales',()=>{
  const states=[initialStore(),enterDemoCustomer(initialStore()),loginFisher(initialStore(),'FP-0018','1234')];
  for(const s of states){
    const before=JSON.stringify(s);
    assert.throws(()=>updateEnvironmentalRule(s,'bocachico',{banned:true}),/administradora/);
    assert.throws(()=>updateEnvironmentalRule(s,'bocachico',{minimum:20}),/administradora/);
    assert.throws(()=>setSmallSizeSimulation(s,true),/administradora/);
    assert.equal(JSON.stringify(s),before);
  }
  assert.throws(()=>updateEnvironmentalRule({...initialStore(),adminSession:ADMIN_ACCOUNT.id},'bocachico',{banned:true}),/administradora/);
});
test('administración cambia vedas de todas las especies y tallas con efecto compartido',()=>{
  let s=loginAdmin(initialStore(),ADMIN_ACCOUNT.email,ADMIN_ACCOUNT.passwordDigest);
  s=updateEnvironmentalRule(s,'nicuro',{banned:true});
  assert.equal(blockReason(s.products.find(p=>p.id==='nicuro')!,s),'Especie en veda');
  s=updateEnvironmentalRule(s,'bocachico',{minimum:30});
  assert.equal(blockReason(s.products.find(p=>p.id==='bocachico')!,s),'Talla no permitida');
  const draft={speciesId:'bocachico',kg:4,price:18000,length:28,zone:'La Rampa',method:'Atarraya tradicional',temperature:3,photo:'',capturedAt:new Date(Date.now()-7200000).toISOString(),landedAt:new Date(Date.now()-3600000).toISOString()};
  assert.match(captureError(draft,s),/30 cm/);
  assert.throws(()=>updateEnvironmentalRule(s,'bocachico',{minimum:0}),/1 y 250/);
  s=setSmallSizeSimulation(s,true);assert.equal(s.environmentalChanges.length,3);
  assert.deepEqual(reload(s),s);
  const client=enterDemoCustomer(s);client.cart={bocachico:1};
  assert.throws(()=>createOrder(client,{name:'Ana',phone:'3001234567',address:'Calle 1 #2-30',slot:'mañana',date:'mañana'},'PSE'),/Talla/);
});
test('sesiones mixtas antiguas se migran conservando solo el rol activo',()=>{
  const old=enterDemoCustomer(initialStore());old.cart={nicuro:1};old.session='FP-0018';old.role='fisher';
  const loaded=reload(old);assert.equal(loaded.session,'FP-0018');assert.equal(loaded.clientSession,null);
  assert.deepEqual(loaded.clientCarts[DEMO_CUSTOMER_ID],{nicuro:1});assert.deepEqual(loaded.cart,{});
});
test('editar perfil conserva identidad, contraseña, canasta y recibos anteriores',async()=>{
  let s=registerCustomer(initialStore(),customerData,await createCredential('MiClave123'));const id=s.clientSession!;
  const before=s.customers.find(c=>c.id===id)!;s.cart={bocachico:1};
  s=completeSale(s,createOrder(s,{name:'Nombre original',phone:'3001234567',address:'Dirección original 123',slot:'mañana',date:'mañana'},'PSE'));
  s.cart={nicuro:2};const orders=structuredClone(s.orders);
  s=updateCustomerProfile(s,{name:' Ana Actualizada ',email:' NUEVO@GMAIL.COM ',phone:'3119876543',address:' Barrio El Centro, Calle 20 # 30-40 '});
  const updated=s.customers.find(c=>c.id===id)!;
  assert.equal(updated.email,'nuevo@gmail.com');assert.equal(updated.name,'Ana Actualizada');assert.equal(updated.passwordDigest,before.passwordDigest);assert.equal(updated.passwordSalt,before.passwordSalt);
  assert.deepEqual(s.cart,{nicuro:2});assert.deepEqual(s.orders,orders);assert.equal(s.clientSession,id);assert.deepEqual(reload(s),s);
  const digest=await passwordDigest('MiClave123',updated.passwordSalt);
  assert.equal(loginCustomer(signOut(s),updated.email,digest).clientSession,id);
  assert.throws(()=>loginCustomer(signOut(s),before.email,digest),/no coinciden/);
});
test('el perfil demo también conserva sus cambios al recargar',async()=>{
  let s=enterDemoCustomer(initialStore());s=updateCustomerProfile(s,{name:'Cliente actualizado',email:'demo.editado@example.com',phone:'3119876543',address:'Calle 20 #30-40, Barrancabermeja'});
  const loaded=reload(s);assert.deepEqual(loaded.customers,s.customers);assert.equal(loaded.customers.length,1);
  assert.equal(loginCustomer(signOut(loaded),'demo.editado@example.com',await passwordDigest('Demo1234',loaded.customers[0].passwordSalt)).clientSession,DEMO_CUSTOMER_ID);
  assert.equal(enterDemoCustomer(signOut(loaded)).customers[0].name,'Cliente actualizado');
});
test('el perfil rechaza correos duplicados, datos inválidos y otros roles',async()=>{
  let s=enterDemoCustomer(initialStore());s=registerCustomer(s,customerData,await createCredential('MiClave123'));
  const before=JSON.stringify(s);
  for(const change of [{email:'comprador@gmail.com'},{email:ADMIN_ACCOUNT.email},{email:s.fishermen[0].email},{email:'incorrecto'},{phone:'123'},{name:' '},{address:'corta'}])assert.throws(()=>updateCustomerProfile(s,{...customerData,...change}));
  assert.equal(JSON.stringify(s),before);
  assert.throws(()=>updateCustomerProfile(initialStore(),customerData),/cliente/);
  assert.throws(()=>updateCustomerProfile(loginFisher(s,'FP-0018','1234'),customerData),/cliente/);
  assert.throws(()=>updateCustomerProfile(loginAdmin(s,ADMIN_ACCOUNT.email,ADMIN_ACCOUNT.passwordDigest),customerData),/cliente/);
});
