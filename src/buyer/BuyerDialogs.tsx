import { Heart, Leaf, Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { blockReason, formatKg, lineAmount, money, quantityLabel, total, unitLabel, validateCart, type Product } from '../domain';
import { FishArt, Modal } from '../components';
import { useStore } from '../StoreContext';

export function CartDialog({onClose,onCheckout,onQuantity}:{onClose:()=>void;onCheckout:()=>void;onQuantity:(p:Product,delta:number)=>void}) {
  const {store,setStore}=useStore();const subtotal=total(store.cart,store.products);const error=validateCart(store);
  const products=store.products.filter(p=>store.cart[p.id]);
  // Agrupamos por ID del pescador, no por producto: varios lotes de la misma familia
  // aparecen como un único ingreso directo en el desglose de comercio justo.
  const families=[...new Set(products.map(p=>p.fisherId))].map(id=>({
    name:store.fishermen.find(f=>f.id===id)!.name,
    amount:products.filter(p=>p.fisherId===id).reduce((n,p)=>n+lineAmount(p,store.cart[p.id]),0),
  }));
  function remove(id:string){setStore(s=>{const cart={...s.cart};delete cart[id];return {...s,cart};});}
  return <Modal title="Mi canasta" onClose={onClose} wide>
    {!products.length?<div className="empty-state"><ShoppingBasket size={45}/><h3>Tu próxima historia empieza aquí.</h3><p>Agrega pesca del día a tu canasta.</p><button className="btn-primary" onClick={onClose}>Explorar la pesca</button></div>:
      <div className="space-y-5">
        {Object.values(store.bans).some(Boolean)&&<div className="notice"><Leaf/><p>Hay vedas simuladas activas. Elegir alternativas habilitadas protege la reproducción y apoya los ODS 12 y 14.</p></div>}
        {products.map(p=><div key={p.id} className="cart-item"><FishArt product={p} className="w-24 shrink-0"/><div className="flex-1"><h3 className="font-bold text-lg">{p.name}</h3><p>{money(p.price)}/kg · {p.fisher}</p>{p.pieceWeightGrams&&<p>{formatKg(p.pieceWeightGrams/1000)} kg por pez · venta por peces completos</p>}<p className="font-semibold">Seleccionado: {quantityLabel(p,store.cart[p.id])}</p>{blockReason(p,store)&&<p className="text-red-800 font-bold">{blockReason(p,store)} · retira este lote</p>}<div className="flex gap-3 items-center mt-2"><div className="quantity"><button aria-label={`Quitar un ${unitLabel(p)} de ${p.name}`} onClick={()=>onQuantity(p,-1)}><Minus size={16}/></button><span>{store.cart[p.id]} {p.pieceWeightGrams?'peces':'kg'}</span><button aria-label={`Añadir un ${unitLabel(p)} de ${p.name}`} disabled={!!blockReason(p,store)||store.cart[p.id]>=store.stock[p.id]} onClick={()=>onQuantity(p,1)}><Plus size={16}/></button></div><button className="icon-btn" aria-label={`Eliminar ${p.name}`} onClick={()=>remove(p.id)}><Trash2 size={18}/></button></div></div><strong>{money(lineAmount(p,store.cart[p.id]))}</strong></div>)}
        <button className="btn-secondary" onClick={()=>setStore(s=>({...s,cart:{}}))}>Vaciar canasta</button>
        <div className="impact-widget"><Heart/><h3 className="font-display text-2xl">Tu compra llega a las manos correctas.</h3><p>El 100% de los productos (<strong>{money(subtotal)}</strong>) va a las familias pescadoras:</p>{families.map(f=><p key={f.name}>{f.name}: <strong>{money(f.amount)}</strong></p>)}<p className="border-t border-river/15 pt-3">Intermediación evitada estimada: {money(subtotal*.5)}–{money(subtotal*.6)}. Comparación ilustrativa del 50–60%, no descuento ni ahorro de CO₂ medido. El ingreso mostrado es bruto, antes de costos de faena.</p></div>
        <div className="flex justify-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="flex justify-between"><span>Entrega local de demostración</span><span>Incluida</span></div><div className="flex justify-between text-2xl font-bold border-t pt-4"><span>Total</span><span>{money(subtotal)}</span></div>
        {error&&<p role="alert" className="alert">{error}</p>}<button className="btn-primary w-full justify-center" disabled={!!error} onClick={onCheckout}>Continuar con mi compra</button>
      </div>}
  </Modal>;
}
