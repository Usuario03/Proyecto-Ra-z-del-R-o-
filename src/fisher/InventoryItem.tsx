import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { updateLotInventoryInApi, withdrawLotInApi } from '../client/catalog';
import { blockReason, dateTime, formatKg, lineAmount, money, quantityLabel, updateInventory, type Product } from '../domain';
import { FishArt } from '../components';
import { useStore } from '../StoreContext';
import { Stepper } from './InclusiveControls';
import ActionFeedback from '../accessibility/ActionFeedback';

export default function InventoryItem({product,onRemoved}:{product:Product;onRemoved:(name:string)=>void}) {
  const {store,setStore,getStore,lotVersions,refreshFromBackend}=useStore();const [error,setError]=useState('');
  const [saved,setSaved]=useState('');
  const lines=store.orders.flatMap(o=>o.items.filter(i=>i.product.id===product.id));
  const sold=lines.reduce((n,line)=>n+line.quantity,0);
  const income=lines.reduce((n,line)=>n+lineAmount(line.product,line.quantity),0);
  async function update(changes:{stock?:number;paused?:boolean}){
    try{
      setStore(updateInventory(getStore(),product.id,changes));
      await updateLotInventoryInApi(product.id,{
        ...(changes.stock!==undefined?{stock:changes.stock}:{}),
        ...(changes.paused!==undefined?{paused:changes.paused}:{}),
        expectedVersion:lotVersions[product.id]??1,
      });
      await refreshFromBackend();
      setError('');
      if(changes.paused!==undefined)setSaved(changes.paused?'La publicación quedó pausada.':'La publicación está activa.');
    }catch(err){setError((err as Error).message);}
  }
  async function remove(){
    try{
      await withdrawLotInApi(product.id);
      await refreshFromBackend();
      onRemoved(product.name);
    }catch(err){setError((err as Error).message);}
  }
  return <article className="inventory-item">
    <div className="inventory-picture"><FishArt product={product}/></div>
    <div className="flex-1 space-y-4">
      <h3 className="text-2xl font-bold">{product.name}</h3><p>{money(product.price)}/kg · {product.zone}</p>
      <p>Desembarque: {dateTime(product.landedAt)}</p>
      {product.pieceWeightGrams?<div className="notice"><p>Peces del mismo peso: <strong>{formatKg(product.pieceWeightGrams/1000)} kg por pez</strong> ({money(lineAmount(product,1))} cada uno). Para peces de otro peso, registra un lote separado.</p></div>:<p>Venta por kilos. Si quieres indicar el número de peces, registra un lote de peces del mismo peso.</p>}
      <div className="inventory-counts"><p>Disponible para vender: <strong>{quantityLabel(product,store.stock[product.id])}</strong></p><p>Cantidad vendida de este lote: <strong>{quantityLabel(product,sold)}</strong></p><p>Ingreso de ventas confirmadas: <strong>{money(income)}</strong></p></div>
      <p className="font-bold">{blockReason(product,store)||'Disponible para tus clientes'}</p>
      <Stepper label={product.pieceWeightGrams?`Cantidad de peces de ${product.name}`:`Stock de ${product.name}`} unit={product.pieceWeightGrams?'peces':'kg'} value={store.stock[product.id]} onChange={stock=>{setSaved('');update({stock});}}/>
      <p>Esta es la cantidad que queda disponible, no la cantidad ya vendida. {product.pieceWeightGrams?'Solo añade peces de este mismo peso a este lote.':'Al cambiar los kilos actualizas la disponibilidad de esta publicación.'}</p>
      <details open className="inventory-actions"><summary>Pausar o eliminar publicación</summary><label className="toggle-row"><span>Pausar venta</span><input type="checkbox" checked={product.paused} onChange={e=>update({paused:e.target.checked})}/></label><button className="delete-publication" onClick={remove}><Trash2 size={22}/> Eliminar publicación de {product.name}</button></details>
      {saved&&<ActionFeedback title="CAMBIO GUARDADO" text={saved}/>}{error&&<ActionFeedback error title="NO SE PUDO GUARDAR" text={error}/>}
    </div>
  </article>;
}
