import { Check, Printer } from 'lucide-react';
import { dateTime, formatKg, lineAmount, money, quantityLabel, type Order } from './domain';

export function ReceiptView({order}: {order: Order}) {
  const families = [...new Set(order.items.map(i => i.product.fisherId))];
  return <div className="receipt space-y-5">
    <div className="flex justify-center"><span className="rounded-full bg-leaf p-4"><Check size={30}/></span></div>
    <div className="text-center"><p className="eyebrow">COMPRA LOCAL DE DEMOSTRACIÓN</p><h3 className="font-display text-3xl">Tu pedido tiene una historia.</h3><p>Gracias, {order.delivery.name}. No se realizó ningún cobro.</p></div>
    <div className="rounded-xl border border-river/20 p-4 space-y-2">
      <h3 className="font-bold break-all">Recibo {order.id}</h3>
      <p>Compra: {dateTime(order.createdAt)}</p>
      <p>Entrega: {order.delivery.date} · {order.delivery.slot}</p>
      {order.receivedAt&&<p>Recepción confirmada: {dateTime(order.receivedAt)}</p>}
      <p>{order.delivery.address} · Barrancabermeja · {order.delivery.phone}</p>
      <p>Método: {order.method}{order.bank ? ` · ${order.bank} · ${order.customerType}` : ''}</p>
      {order.items.map(({product:p,quantity}) => <div key={p.id} className="border-t border-river/15 pt-3">
        <div className="flex justify-between gap-3"><strong>{p.name} · {quantityLabel(p,quantity)}</strong><span>{money(lineAmount(p,quantity))}</span></div>
        {p.pieceWeightGrams&&<p>{formatKg(p.pieceWeightGrams/1000)} kg por pez · peces completos del mismo peso</p>}
        <p>{money(p.price)}/kg · prepara {p.fisher}</p>
        <p className="text-sm">Lote {p.id} · captura {dateTime(p.capturedAt)} · {p.zone}</p>
      </div>)}
      <div className="flex justify-between text-xl font-bold border-t pt-4"><span>Total · envío incluido</span><span>{money(order.total)}</span></div>
    </div>
    <section className="impact-widget"><h3 className="font-bold">100% del producto para las familias</h3>
      {families.map(id => {
        const lines=order.items.filter(i=>i.product.fisherId===id);
        return <div key={id}><p>{lines[0].product.fisher}: <strong>{money(lines.reduce((n,i)=>n+lineAmount(i.product,i.quantity),0))}</strong></p><p className="text-sm">Estado: <strong>{order.fulfillment[id]}</strong></p></div>;
      })}
      <p className="text-sm">Ingreso bruto sin comisión. Intermediación evitada ilustrativa: {money(order.total*.5)}–{money(order.total*.6)}. No equivale a utilidad neta.</p>
    </section>
    <p className="text-sm">Recibo académico sin validez fiscal. Se conserva en este navegador. No contiene datos de tarjeta ni credenciales bancarias.</p>
    <button className="btn-primary print:hidden" onClick={()=>window.print()}><Printer size={20}/> Imprimir recibo</button>
  </div>;
}
