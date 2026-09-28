import { useState } from 'react';
import { Bell, PackageCheck, Plus, Scale, Truck, Wallet } from 'lucide-react';
import { advanceOrder, dateTime, fisherMetrics, formatKg, lineAmount, money, quantityLabel, type Order } from '../domain';
import { useStore } from '../StoreContext';
import CaptureWizard from './CaptureWizard';
import { PhotoPicker, VoiceButton } from './InclusiveControls';
import InventoryItem from './InventoryItem';
import ActionFeedback from '../accessibility/ActionFeedback';
import FisherHelp from './FisherHelp';

export default function FisherPortal({onShop}:{onShop:()=>void}) {
  const {store,setStore,getStore}=useStore();
  const [wizard,setWizard]=useState(false);const [tab,setTab]=useState<'inventory'|'orders'|'profile'>('inventory');
  const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const fisher=store.fishermen.find(f=>f.id===store.session);
  if(!fisher)return null;
  if(wizard)return <CaptureWizard onClose={()=>setWizard(false)} onShop={onShop}/>;
  const metrics=fisherMetrics(store,fisher.id);const max=Math.max(1,...metrics.days.map(d=>d.amount));
  const orders=store.orders.filter(o=>o.fulfillment[fisher.id]);const ownProducts=store.products.filter(p=>p.fisherId===fisher.id);
  function task(next:'inventory'|'orders'|'profile'){setTab(next);setNotice('');setError('');}
  function prepare(order:Order){try{setStore(advanceOrder(getStore(),order.id));setError('');setNotice(order.fulfillment[fisher!.id]==='pendiente'?'PEDIDO PREPARADO. Tu pesca está lista en el puerto.':'PEDIDO ENVIADO. El cliente ya puede ver que su pesca va en camino.');}catch(err){setError((err as Error).message);}}
  return <main className="fisher-page site-width">
    <div className="portal-heading"><div className="flex items-center gap-4"><img src={fisher.photo} alt={`Retrato de ${fisher.nickname}`} className="h-20 w-20 rounded-2xl"/><div><p className="eyebrow">TU TRABAJO VALE</p><h1>¡Hola, {fisher.nickname}!</h1><p>{fisher.port}</p></div></div></div>
    <FisherHelp/>
    <VoiceButton text={`Hola ${fisher.nickname}. Tienes ${metrics.pending} pedidos por entregar. Toca registrar pesca para publicar, mi pesca para ajustar cantidades, o mis pedidos para preparar entregas.`}/>
    <div className="fisher-metrics"><section><Wallet/><span>Ingreso de hoy</span><strong>{money(metrics.today)}</strong><small>Esta semana: {money(metrics.week)}</small></section><section><Scale/><span>Kilos vendidos · 7 días</span><strong>{formatKg(metrics.kg)} kg</strong><small>{metrics.pieces} peces vendidos en lotes de peso uniforme</small></section><button onClick={()=>task('orders')}><Bell/><span>Pedidos por entregar</span><strong>{metrics.pending}</strong><small>Toca aquí para prepararlos</small></button></div>
    <section className="earnings-chart"><div><h2 className="text-2xl font-bold">El 100% llega a tu familia</h2><p>Ingreso bruto de ventas directas, antes de costos de faena.</p><p>Intermediación evitada ilustrativa: <strong>{money(metrics.week*.5)}–{money(metrics.week*.6)}</strong>.</p></div><div className="bar-chart" role="img" aria-label={`Ingresos de los últimos siete días: ${metrics.days.map(d=>`${d.day.toLocaleDateString('es-CO')}: ${money(d.amount)}`).join('. ')}`}>{metrics.days.map(d=><div key={d.day.toISOString()}><span className="chart-amount">{money(d.amount)}</span><div className="bar-space"><div style={{height:`${Math.max(2,d.amount/max*100)}%`}}/></div><span>{d.day.toLocaleDateString('es-CO',{weekday:'short'})}</span></div>)}</div></section>
    <button className="fisher-primary new-capture" onClick={()=>{setWizard(true);setNotice('');}}><Plus size={34}/> REGISTRAR Y SUBIR NUEVA PESCA</button>
    <section id="portal-management">
      <div className="portal-tabs">{([{id:'inventory',label:'Mi pesca'},{id:'orders',label:`Mis pedidos (${orders.length})`},{id:'profile',label:'Mi perfil'}] as const).map(t=><button key={t.id} aria-pressed={tab===t.id} onClick={()=>task(t.id)}>{t.label}</button>)}</div>
      {notice&&<ActionFeedback title="ACCIÓN COMPLETADA" text={notice}/>}{error&&<ActionFeedback error title="NO SE PUDO GUARDAR" text={error}/>}
      {tab==='inventory'&&<div className="space-y-5"><h2 className="text-3xl">Tu inventario, al día</h2><p className="text-lg">Escribe la cantidad disponible o usa los botones. Las ventas confirmadas se conservan aunque elimines la publicación.</p>
        {ownProducts.map(p=><InventoryItem key={p.id} product={p} onRemoved={name=>setNotice(`PUBLICACIÓN ELIMINADA. ${name} ya no está en la tienda. Los pedidos confirmados se conservan.`)}/>)}
        {!ownProducts.length&&<p>Aún no tienes capturas publicadas. Registra una pesca para comenzar.</p>}
      </div>}
      {tab==='orders'&&<div className="space-y-5"><h2 className="text-3xl">Mis pedidos</h2>{!orders.length&&<p className="notice">Cuando un cliente compre tu pesca, su pedido aparecerá aquí.</p>}
        {[...orders].reverse().map(order=>{
          const items=order.items.filter(i=>i.product.fisherId===fisher.id);const state=order.fulfillment[fisher.id];
          return <article className="fisher-order" key={order.id}><h3 className="text-xl font-bold">Pedido de {order.delivery.name}</h3><p>{dateTime(order.createdAt)}</p>{items.map(i=><p className="text-xl" key={i.product.id}>{i.product.name} · <strong>{quantityLabel(i.product,i.quantity)}</strong> · {money(lineAmount(i.product,i.quantity))}</p>)}<p>Entrega: {order.delivery.date} · {order.delivery.slot}</p><p>{order.delivery.address} · {order.delivery.phone}</p><p className="notice">Estado: <strong>{state}</strong></p>{state!=='enviado'?<button className="fisher-primary" onClick={()=>prepare(order)}>{state==='pendiente'?<PackageCheck/>:<Truck/>}{state==='pendiente'?'Pedido preparado en puerto':'Enviado con domiciliario'}</button>:<p className="text-xl font-bold">Tu pescado ya va en camino.</p>}</article>;
        })}
      </div>}
      {tab==='profile'&&<section className="wizard-card max-w-xl"><h2 className="text-3xl mb-4">{fisher.name}</h2><p className="text-lg mb-4">{fisher.member} · {fisher.port}</p><p className="text-lg break-all mb-3">Correo: <strong>{fisher.email}</strong></p><p className="text-lg mb-5">PIN de prueba: <strong>{fisher.pin}</strong></p><PhotoPicker profile value={fisher.photo} onChange={photo=>{setStore(s=>({...s,fishermen:s.fishermen.map(f=>f.id===fisher.id?{...f,photo}:f)}));setNotice('FOTO GUARDADA. Tu perfil ya muestra la nueva imagen.');}}/></section>}
    </section>
  </main>;
}
