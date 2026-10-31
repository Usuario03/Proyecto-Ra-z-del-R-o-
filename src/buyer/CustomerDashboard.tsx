import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, PackageCheck, ReceiptText, Search, ShoppingBasket, Truck } from 'lucide-react';
import { confirmOrderReceivedInApi } from '../client/cart';
import { dateTime, isClient, money, orderProgress, quantityLabel, type Order } from '../domain';
import { useStore } from '../StoreContext';
import { Modal } from '../components';
import { ReceiptView } from '../Orders';
import ActionFeedback from '../accessibility/ActionFeedback';

const LABELS={preparando:'En preparación',listo:'Listo en puerto',enviado:'En camino',recibido:'Recibido'};
function Tracking({order}:{order:Order}) {
  const stage=orderProgress(order);const active={preparando:1,listo:2,enviado:3,recibido:4}[stage];
  return <section className="purchase-tracking" aria-label="Seguimiento de la compra"><ol>{['Compra confirmada','En preparación','Listo en puerto','Enviado','Recibido'].map((label,index)=><li key={label} aria-current={index===active?'step':undefined} className={index<=active?'complete':''}><span>{index<active?<CheckCircle2 size={18}/>:index+1}</span>{label}</li>)}</ol>
    <div className="family-tracking">{Object.entries(order.fulfillment).map(([id,status])=><p key={id}><strong>{order.items.find(i=>i.product.fisherId===id)?.product.fisher}</strong><span>{status==='pendiente'?'Preparando tu pesca':status==='preparado'?'Pedido preparado en puerto':'Enviado con domiciliario'}</span></p>)}</div>
    {order.receivedAt&&<p>Recepción confirmada por ti: {dateTime(order.receivedAt)}</p>}
  </section>;
}

export default function CustomerDashboard({onBrowse}:{onBrowse:()=>void}) {
  const {store,refreshFromBackend}=useStore();const [filter,setFilter]=useState<'all'|'active'|'received'>('all');const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<string|null>(null);const [feedback,setFeedback]=useState('');const [error,setError]=useState('');
  if(!isClient(store))return null;
  const customer=store.customers.find(c=>c.id===store.clientSession)!;
  const orders=store.orders.filter(o=>o.clientId===customer.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const transactions=store.transactions.filter(t=>t.clientId===customer.id);
  const active=orders.filter(o=>!o.receivedAt).length;
  const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=orders.filter(o=>(filter==='all'||(filter==='active'?!o.receivedAt:!!o.receivedAt))&&normalized(`${o.id} ${o.items.map(i=>`${i.product.name} ${i.product.fisher}`).join(' ')}`).includes(normalized(query)));
  const detail=orders.find(o=>o.id===selected);
  async function receive(id:string){
    try{
      await confirmOrderReceivedInApi(id);
      await refreshFromBackend();
      setFeedback('Marcaste tu pedido como recibido. Puedes consultar su recibo en el historial.');
      setError('');
    }catch(err){setError((err as Error).message);}
  }
  return <main className="customer-dashboard site-width">
    <button className="btn-secondary" onClick={onBrowse}><ArrowLeft size={19}/> Volver a la tienda</button>
    <p className="eyebrow mt-7">TU CUENTA · TUS PEDIDOS</p><h1>Mis compras</h1><p className="text-lg">Hola, {customer.name}. Aquí puedes seguir tus pedidos y consultar todo lo que has comprado.</p>
    <div className="customer-metrics"><section><ShoppingBasket/><strong>{orders.length}</strong><span>Compras realizadas</span></section><section><Truck/><strong>{active}</strong><span>Pedidos en seguimiento</span></section><section><ReceiptText/><strong>{money(orders.reduce((n,o)=>n+o.total,0))}</strong><span>Total de tus compras</span></section></div>
    {feedback&&<ActionFeedback title="COMPRA RECIBIDA" text={feedback}/>} {error&&<ActionFeedback error title="NO SE PUDO ACTUALIZAR" text={error}/>}
    <section aria-labelledby="purchase-history"><h2 id="purchase-history">Historial y seguimiento</h2>
      <div className="purchase-tools"><div className="search-field"><Search size={20}/><input aria-label="Buscar en mis compras" placeholder="Busca un pescado, pescador o pedido" value={query} onChange={e=>setQuery(e.target.value)}/></div><label>Mostrar compras<select aria-label="Mostrar compras" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">Todas mis compras</option><option value="active">En seguimiento</option><option value="received">Recibidas</option></select></label></div>
      {!orders.length?<div className="empty-state"><ShoppingBasket size={44}/><h3>Aún no has realizado compras.</h3><p>Tu primera compra aparecerá aquí con su seguimiento y recibo.</p><button className="btn-primary" onClick={onBrowse}>Explorar la pesca</button></div>:!visible.length?<p className="notice">No hay compras que coincidan con esta búsqueda.</p>:<div className="purchase-list">{visible.map(order=>{
        const state=orderProgress(order);const statuses=Object.values(order.fulfillment);const partial=statuses.some(s=>s==='enviado')&&!statuses.every(s=>s==='enviado');
        return <article className="purchase-card" key={order.id}><header><div><h3>Pedido del {new Date(order.createdAt).toLocaleDateString('es-CO')}</h3><p className="text-sm break-all">{order.id}</p></div><span className={`purchase-status ${state}`}>{state==='recibido'?<PackageCheck size={18}/>:<Clock3 size={18}/>} {partial?'Envío parcial':LABELS[state]}</span></header>
          <ul>{order.items.map(line=><li key={line.product.id}><strong>{line.product.name}</strong> · {quantityLabel(line.product,line.quantity)}</li>)}</ul>
          <p>Entrega programada: <strong>{order.delivery.date} · {order.delivery.slot}</strong></p><Tracking order={order}/>
          <div className="purchase-actions"><strong className="text-xl">{money(order.total)}</strong><button className="btn-secondary" onClick={()=>setSelected(order.id)}>Ver recibo y entrega</button>{state==='enviado'&&<button className="btn-primary" onClick={()=>receive(order.id)}>Confirmar recepción</button>}</div>
        </article>;
      })}</div>}
    </section>
    <details className="transaction-history"><summary>Historial de pagos ({transactions.length})</summary><ul>{[...transactions].reverse().map(t=><li key={t.id}><strong>{t.method} · {money(t.amount)} · {t.status}</strong><span>{dateTime(t.createdAt)}</span></li>)}</ul>{!transactions.length&&<p>Todavía no hay intentos de pago.</p>}</details>
    {detail&&<Modal title="Detalle de mi compra" onClose={()=>setSelected(null)} wide><ReceiptView order={detail}/></Modal>}
  </main>;
}
