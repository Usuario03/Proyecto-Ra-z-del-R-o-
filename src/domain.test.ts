import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_PRODUCTS, advanceOrder, blockReason, captureError, changeCartQuantity, completeSale, confirmOrderReceived, createOrder, fisherMetrics, initialStore, lineAmount, loadStore, orderProgress, publishCapture, recordFailedAttempt, removeProduct, STORAGE_KEY, total, updateInventory, validateCart, weightKg, type CaptureDraft, type Cart, type Delivery, type Store } from './domain';
import { enterDemoCustomer, loginFisher } from './auth/authDomain';
import { TEST_PHOTO } from './testFixtures';
const signedStore=()=>enterDemoCustomer(initialStore());

test('calcula comercio justo para varias familias sin comisión adicional',()=>{
  assert.equal(total({bocachico:2,nicuro:3}),84000);
});
test('una veda activada después de agregar bloquea la confirmación y conserva inventario',()=>{
  const state=initialStore();state.cart={bocachico:2};state.bans.bocachico=true;
  assert.match(validateCart(state),/veda/);
  assert.throws(()=>completeSale(state),/veda/);
  assert.equal(state.stock.bocachico,24);assert.equal(state.cart.bocachico,2);
});
test('la simulación de talla bloquea un lote previamente habilitado',()=>{
  const state=initialStore();state.cart={bocachico:1};state.smallSize=true;
  assert.throws(()=>completeSale(state),/Talla/);
  assert.equal(blockReason(MOCK_PRODUCTS.find(p=>p.id==='pintado')!,state),'Talla no permitida');
});
test('no vende cantidades superiores al stock ni carritos inválidos',()=>{
  const state=initialStore();
  const invalidCarts: Cart[] = [{nicuro:5},{nicuro:-1},{nicuro:1.5},{inexistente:1},{}];
  for(const cart of invalidCarts) {
    assert.throws(()=>completeSale({...state,cart}));
  }
});
test('confirma una venta atómica, descuenta existencias y evita repetir el pedido',()=>{
  const state=signedStore();state.cart={nicuro:4,bocachico:2};
  const result=completeSale(state);
  assert.deepEqual(result.cart,{});assert.equal(result.stock.nicuro,0);assert.equal(result.stock.bocachico,22);assert.equal(result.sales,1);
  assert.equal(state.stock.nicuro,4);assert.equal(state.cart.nicuro,4);
  assert.equal(blockReason(MOCK_PRODUCTS.find(p=>p.id==='nicuro')!,result),'Agotado');
  assert.throws(()=>completeSale(result));
});
test('persistencia tolera JSON corrupto y sanea cantidades y banderas',()=>{
  let raw='{invalid';
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>raw}});
  assert.deepEqual(loadStore(),initialStore());
  raw=JSON.stringify({cart:{nicuro:3,bocachico:-1,unknown:20},stock:{nicuro:-3,bocachico:999},bans:{rayado:'false'},sales:-4,large:true});
  const s=loadStore();assert.deepEqual(s.cart,{nicuro:3});assert.equal(s.stock.nicuro,4);assert.equal(s.stock.bocachico,24);assert.equal(s.bans.rayado,true);assert.equal(s.sales,0);assert.equal(s.large,true);
  Reflect.deleteProperty(globalThis,'localStorage');
});

const draft=():CaptureDraft=>({speciesId:'bocachico',kg:7,price:23000,length:28,zone:'Muelle de Barrancabermeja',method:'Atarraya tradicional',capturedAt:new Date(Date.now()-7200000).toISOString(),landedAt:new Date(Date.now()-3600000).toISOString(),temperature:3,photo:TEST_PHOTO});
const delivery:Delivery={name:'Ana Demo',phone:'3001234567',address:'Calle 10 # 20-30',slot:'8–11',date:'Mañana'};

test('publicación, compra y preparación comparten el mismo lote y familia',()=>{
  let s=loginFisher(initialStore(),'FP-0156','1234');s=publishCapture(s,draft());
  const p=s.products[0];assert.equal(p.fisherId,s.session);assert.equal(s.stock[p.id],7);
  s=enterDemoCustomer(s);s.cart={[p.id]:2};const order=createOrder(s,delivery,'PSE','Bancolombia','Persona Natural');
  s=completeSale(s,order);assert.equal(s.stock[p.id],5);assert.equal(s.orders.length,1);assert.equal(s.transactions[0].status,'exitoso');
  s=loginFisher(s,'FP-0156','1234');const metrics=fisherMetrics(s,s.session!);assert.equal(metrics.today,46000);assert.equal(metrics.kg,2);assert.equal(metrics.pending,1);
  s=advanceOrder(s,order.id);assert.equal(s.orders[0].fulfillment['FP-0156'],'preparado');
  s=advanceOrder(s,order.id);assert.equal(s.orders[0].fulfillment['FP-0156'],'enviado');assert.equal(fisherMetrics(s,'FP-0156').pending,0);
});
test('una veda afecta a todos los lotes de una especie y también su publicación',()=>{
  let s=loginFisher(initialStore(),'FP-0018','1234');s=publishCapture(s,draft());const id=s.products[0].id;
  s.bans.bocachico=true;s.cart={[id]:1};
  assert.throws(()=>publishCapture(s,draft()),/veda/);assert.throws(()=>completeSale(s),/veda/);
  assert.equal(blockReason(s.products.find(p=>p.id==='bocachico')!,s),'Especie en veda');
});
test('wizard bloquea talla, temperatura, fechas y cantidades inválidas en dominio',()=>{
  const s=loginFisher(initialStore(),'FP-0018','1234');
  for(const change of [{length:24},{temperature:9},{kg:0},{price:-1},{zone:'desconocida'},{landedAt:'no fecha'},{capturedAt:new Date(Date.now()+3600000).toISOString()}]) {
    assert.notEqual(captureError({...draft(),...change},s),'');assert.throws(()=>publishCapture(s,{...draft(),...change}));
  }
  assert.throws(()=>publishCapture({...s,session:null},draft()),/perfil/);
});
test('pausar o reducir inventario invalida una canasta ya creada',()=>{
  let s=signedStore();s.cart={bocachico:4};
  const order=createOrder(s,delivery,'Nequi');
  s=updateInventory(loginFisher(s,'FP-0018','1234'),'bocachico',{paused:true});s=enterDemoCustomer(s);assert.throws(()=>completeSale(s,order),/pausada/);
  s=updateInventory(loginFisher(s,'FP-0018','1234'),'bocachico',{paused:false,stock:2});s=enterDemoCustomer(s);assert.throws(()=>completeSale(s,order),/Solo quedan/);
});
test('un pescador no modifica el inventario ni la entrega de otro',()=>{
  let s=signedStore();s.cart={bocachico:1};const order=createOrder(s,delivery,'PSE');s=completeSale(s,order);s=loginFisher(s,'FP-0156','1234');
  assert.throws(()=>updateInventory(s,'bocachico',{stock:50}),/propia/);
  assert.throws(()=>advanceOrder(s,order.id),/perfil/);
});
test('el recibo es inmutable y el pago rechaza cambios de precio después de autorizar',()=>{
  let s=signedStore();s.cart={bocachico:2};const order=createOrder(s,delivery,'Tarjeta');
  const changed={...s,products:s.products.map(p=>p.id==='bocachico'?{...p,price:33000}:p)};
  assert.throws(()=>completeSale(changed,order),/precios/);
  s=completeSale(s,order);s.products[0].price=35000;order.items[0].product.price=1;
  assert.equal(s.orders[0].items[0].product.price,18000);assert.equal(s.orders[0].total,36000);
  s.cart={bocachico:2};assert.throws(()=>completeSale(s,s.orders[0]),/ya fue confirmado/);
});
test('pedido con varias familias tiene seguimiento independiente',()=>{
  let s=signedStore();s.cart={bocachico:2,nicuro:1};const order=createOrder(s,delivery,'PSE');s=completeSale(s,order);
  s=loginFisher(s,'FP-0018','1234');s=advanceOrder(s,order.id);s=advanceOrder(s,order.id);
  assert.equal(s.orders[0].fulfillment['FP-0018'],'enviado');assert.equal(s.orders[0].fulfillment['FP-0091'],'pendiente');
  assert.equal(fisherMetrics(s,'FP-0091').week,16000);
});
test('rechazo y vencimiento registran intentos sin pedidos ni cambios de stock',()=>{
  const s=signedStore();s.cart={bocachico:2};
  const failed=recordFailedAttempt(recordFailedAttempt(s,'Nequi','vencido'),'PSE','rechazado');
  assert.deepEqual(failed.cart,s.cart);assert.deepEqual(failed.stock,s.stock);assert.equal(failed.orders.length,0);assert.equal(failed.transactions.length,2);
});
test('persisten lotes, fechas, sesión, pedidos y stock por encima del stock inicial',()=>{
  let s=loginFisher(initialStore(),'FP-0156','1234');s=publishCapture(s,draft());
  const id=s.products[0].id;s=enterDemoCustomer(s);s.cart={[id]:2};s=completeSale(s,createOrder(s,delivery,'Daviplata'));
  s=updateInventory(loginFisher(s,'FP-0156','1234'),id,{stock:40});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>key===STORAGE_KEY?JSON.stringify(s):null}});
  const loaded=loadStore();assert.deepEqual(loaded,s);assert.equal(loaded.products[0].capturedAt,s.products[0].capturedAt);
  Reflect.deleteProperty(globalThis,'localStorage');
});

const pieceDraft=():CaptureDraft=>({...draft(),pieceWeightGrams:750,quantity:4,sameWeightConfirmed:true});
function persisted(s:unknown):Store {
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>key===STORAGE_KEY?JSON.stringify(s):null}});
  try{return loadStore();}finally{Reflect.deleteProperty(globalThis,'localStorage');}
}
test('peces de igual peso se venden completos y el cobro usa gramos por cantidad',()=>{
  let s=publishCapture(loginFisher(initialStore(),'FP-0156','1234'),pieceDraft());
  const product=s.products[0];assert.equal(s.stock[product.id],4);assert.equal(weightKg(product,4),3);
  s=enterDemoCustomer(s);s=changeCartQuantity(s,product.id,2);
  assert.equal(total(s.cart,s.products),34500);assert.equal(weightKg(product,2),1.5);
  assert.throws(()=>changeCartQuantity(s,product.id,.5),/entera/);
  assert.throws(()=>changeCartQuantity(s,product.id,3),/Solo quedan/);
  const order=createOrder(s,delivery,'PSE');s=completeSale(s,order);
  assert.equal(order.items[0].quantity,2);assert.equal(order.items[0].kg,1.5);
  assert.equal(s.stock[product.id],2);
  const metrics=fisherMetrics(s,'FP-0156');assert.equal(metrics.kg,1.5);assert.equal(metrics.pieces,2);assert.equal(metrics.today,34500);
  assert.deepEqual(persisted(s),s);
});
test('no publica cantidades fraccionarias ni pesos inválidos y exige peso uniforme confirmado',()=>{
  const s=loginFisher(initialStore(),'FP-0156','1234');
  for(const change of [{quantity:1.5},{quantity:0},{pieceWeightGrams:0},{pieceWeightGrams:50001},{pieceWeightGrams:500.5},{sameWeightConfirmed:false}]) {
    assert.throws(()=>publishCapture(s,{...pieceDraft(),...change}));
  }
  const created=publishCapture(s,{...pieceDraft(),pieceWeightGrams:1000,quantity:2});
  assert.equal(weightKg(created.products[0],created.stock[created.products[0].id]),2);
});
test('redondeo COP es consistente en líneas, totales y recibos con gramos no redondos',()=>{
  let s=publishCapture(loginFisher(initialStore(),'FP-0156','1234'),{...pieceDraft(),pieceWeightGrams:333,price:18501});
  const p=s.products[0];s=enterDemoCustomer(s);s.cart={[p.id]:3,nicuro:1};
  const expected=Math.round(18501*999/1000)+16000;
  assert.equal(lineAmount(p,3),18482);assert.equal(total(s.cart,s.products),expected);
  s=completeSale(s,createOrder(s,delivery,'Tarjeta'));assert.equal(s.orders[0].total,expected);
  assert.deepEqual(persisted(s),s);
});
test('eliminar un lote limpia canastas pero preserva pedido, preparación e ingresos',()=>{
  let s=publishCapture(loginFisher(initialStore(),'FP-0156','1234'),pieceDraft());const p=s.products[0];
  s=enterDemoCustomer(s);s.cart={[p.id]:1};const order=createOrder(s,delivery,'PSE');s=completeSale(s,order);
  s.cart={[p.id]:2,nicuro:1};s=loginFisher(s,'FP-0156','1234');
  s=removeProduct(s,p.id);
  assert.equal(s.products.some(product=>product.id===p.id),false);assert.equal(p.id in s.stock,false);
  assert.equal(Object.values(s.clientCarts).some(cart=>p.id in cart),false);
  assert.equal(s.orders[0].items[0].product.pieceWeightGrams,750);
  assert.equal(fisherMetrics(s,'FP-0156').today,17250);
  s=advanceOrder(s,order.id);assert.equal(s.orders[0].fulfillment['FP-0156'],'preparado');
  assert.deepEqual(persisted(s),s);
});
test('un lote inicial eliminado no reaparece al recargar y solo el dueño puede eliminar',()=>{
  const s=initialStore();
  assert.throws(()=>removeProduct(s,'bocachico'),/propias/);
  assert.throws(()=>removeProduct(enterDemoCustomer(s),'bocachico'),/propias/);
  assert.throws(()=>removeProduct(loginFisher(s,'FP-0156','1234'),'bocachico'),/propias/);
  const deleted=removeProduct(loginFisher(s,'FP-0018','1234'),'bocachico');
  const loaded=persisted(deleted);assert.equal(loaded.products.some(p=>p.id==='bocachico'),false);assert.equal(loaded.stock.bocachico,undefined);
  assert.equal(loaded.products.length,5);
});
test('retirar un producto antes de confirmar invalida el pedido autorizado',()=>{
  let s=enterDemoCustomer(initialStore());s.cart={bocachico:2};const order=createOrder(s,delivery,'PSE');
  s=enterDemoCustomer(removeProduct(loginFisher(s,'FP-0018','1234'),'bocachico'));
  assert.throws(()=>completeSale(s,order));assert.equal(s.orders.length,0);
});
test('migración de recibos anteriores mantiene sus kilos sin inventar cantidad de peces',()=>{
  let s=enterDemoCustomer(initialStore());s.cart={nicuro:2};s=completeSale(s,createOrder(s,delivery,'PSE'));
  const legacy={...s,orders:s.orders.map(order=>({...order,items:order.items.map(({quantity:_,...line})=>line)}))};
  const loaded=persisted(legacy);assert.equal(loaded.orders[0].items[0].quantity,2);assert.equal(loaded.orders[0].items[0].kg,2);
  assert.equal(loaded.orders[0].items[0].product.pieceWeightGrams,undefined);assert.equal(loaded.orders[0].total,32000);
});
test('la fotografía es obligatoria al publicar y no impide completar los pasos previos',()=>{
  const s=loginFisher(initialStore(),'FP-0018','1234');const capture={...draft(),photo:''};
  assert.equal(captureError(capture,s),'');
  assert.throws(()=>publishCapture(s,capture),/foto/);
  assert.throws(()=>publishCapture(s,{...capture,photo:'https://example.com/pescado.jpg'}),/imagen/);
  assert.equal(publishCapture(s,draft()).products[0].photo,TEST_PHOTO);
});
test('recepción exige titular y envío de todas las familias y persiste sin duplicar ventas',()=>{
  let s=enterDemoCustomer(initialStore());s.cart={bocachico:1,nicuro:1};const order=createOrder(s,delivery,'PSE');s=completeSale(s,order);
  assert.equal(orderProgress(s.orders[0]),'preparando');assert.throws(()=>confirmOrderReceived(s,order.id),/enviado completamente/);
  s=loginFisher(s,'FP-0018','1234');s=advanceOrder(s,order.id);s=advanceOrder(s,order.id);
  assert.throws(()=>confirmOrderReceived(s,order.id),/tus compras/);
  s=enterDemoCustomer(s);assert.throws(()=>confirmOrderReceived(s,order.id),/enviado completamente/);
  s=loginFisher(s,'FP-0091','1234');s=advanceOrder(s,order.id);s=advanceOrder(s,order.id);s=enterDemoCustomer(s);
  assert.equal(orderProgress(s.orders[0]),'enviado');const sales=s.sales;const stock={...s.stock};s=confirmOrderReceived(s,order.id);
  assert.equal(orderProgress(s.orders[0]),'recibido');assert.equal(s.sales,sales);assert.deepEqual(s.stock,stock);
  assert.equal(confirmOrderReceived(s,order.id),s);assert.deepEqual(persisted(s),s);
});
test('preferencias accesibles se restauran y los valores desconocidos usan defaults',()=>{
  const s=initialStore();s.accessibility={textSize:'extra',readInstructions:false};s.large=false;
  assert.deepEqual(persisted(s).accessibility,s.accessibility);
  assert.equal(persisted(s).large,false);
  const legacy=persisted({...s,accessibility:{...s.accessibility,easyMode:true,highVisibility:true,voiceInput:true}});
  assert.equal('easyMode' in legacy.accessibility,false);
  assert.equal('highVisibility' in legacy.accessibility,false);assert.equal('voiceInput' in legacy.accessibility,false);
  const invalid=persisted({...s,accessibility:{textSize:'gigante',highVisibility:'true',readInstructions:5}});
  assert.deepEqual(invalid.accessibility,initialStore().accessibility);
});
