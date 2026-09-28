import { useEffect, useId, useState } from 'react';
import { Check, Fish, Minus, Plus, Scale } from 'lucide-react';
import { draftQuantity, draftWeight, formatKg, lineAmount, money, type CaptureDraft } from '../domain';

interface NumberFieldProps {
  label:string;unit:string;value:number;min:number;max:number;step?:number;currency?:boolean;
  onChange:(value:number)=>void;
}

function SaleNumberField({label,unit,value,min,max,step=1,currency=false,onChange}:NumberFieldProps){
  const id=useId();const [text,setText]=useState(String(value));
  useEffect(()=>setText(String(value)),[value]);
  function commit(next:number){const safe=Math.max(min,Math.min(max,Math.floor(Number.isFinite(next)?next:value)));setText(String(safe));if(safe!==value)onChange(safe);}
  return <div className={`sale-number-field ${currency?'sale-money-field':''}`}>
    <label htmlFor={id}>{label}</label>
    <div className="sale-number-row">
      <button type="button" aria-label={`Disminuir ${label}`} disabled={value<=min} onClick={()=>commit(value-step)}><Minus size={21}/></button>
      <div className="sale-number-input">{currency&&<span className="currency-prefix" aria-hidden="true">$</span>}<input id={id} aria-label={`${label} ${unit}`} type="number" inputMode="numeric" step={1} min={min} max={max} value={text}
        onChange={e=>{const raw=e.target.value;setText(raw);const number=Number(raw);if(raw!==''&&Number.isInteger(number)&&number>=min&&number<=max)onChange(number);}}
        onBlur={()=>commit(text===''?value:Number(text))}/><span className="sale-unit" aria-hidden="true">{currency?'/ kg':unit}</span></div>
      <button type="button" aria-label={`Aumentar ${label}`} disabled={value>=max} onClick={()=>commit(value+step)}><Plus size={21}/></button>
    </div>
    <p className="sale-input-hint">{currency?'Cada toque cambia $1.000. También puedes escribir el precio.':'Escribe la cantidad o ajústala con − y +.'}</p>
  </div>;
}

export default function QuantityPriceStep({draft,onChange,speciesName,suggestedPrice}:{draft:CaptureDraft;onChange:(draft:CaptureDraft)=>void;speciesName:string;suggestedPrice:number}){
  const pieces=draft.pieceWeightGrams!==undefined;const quantity=draftQuantity(draft);const kg=draftWeight(draft);
  const [cost,setCost]=useState(0);
  const prices=[...new Set([Math.max(1000,suggestedPrice-2000),suggestedPrice,Math.min(100000,suggestedPrice+2000)])];
  function weight(value:number){onChange({...draft,pieceWeightGrams:value,sameWeightConfirmed:value===draft.pieceWeightGrams?draft.sameWeightConfirmed:false});}
  return <div className="quantity-price-step">
    <fieldset className="sale-method"><legend><span>1</span> ¿Cómo vas a vender tu pesca?</legend><div className="sale-method-options">
      <label className={!pieces?'selected':''}><input type="radio" name="sale-method" aria-label="Por kilos" checked={!pieces} onChange={()=>onChange({...draft,pieceWeightGrams:undefined,quantity:undefined,sameWeightConfirmed:undefined})}/><Scale size={28}/><span><strong>Por kilos</strong><small>Indica el peso total que tienes disponible.</small></span>{!pieces&&<Check className="sale-selected-mark" size={19}/>}</label>
      <label className={pieces?'selected':''}><input type="radio" name="sale-method" aria-label="Peces del mismo peso" checked={pieces} onChange={()=>onChange({...draft,pieceWeightGrams:draft.pieceWeightGrams??1000,quantity:draft.quantity??2,sameWeightConfirmed:draft.sameWeightConfirmed??false})}/><Fish size={28}/><span><strong>Por peces del mismo peso</strong><small>Indica cuánto pesa cada pez y cuántos vendes.</small></span>{pieces&&<Check className="sale-selected-mark" size={19}/>}</label>
    </div></fieldset>
    <div className="sale-form-grid">
      <section className="sale-field-card" aria-labelledby="sale-quantity-title"><h3 id="sale-quantity-title"><span>2</span> {pieces?'Peso y cantidad':'Cantidad disponible'}</h3>
        {pieces?<>
          <SaleNumberField label="Peso de cada pez" unit="g" value={draft.pieceWeightGrams!} min={1} max={50000} step={100} onChange={weight}/>
          <div className="weight-shortcuts" aria-label="Pesos habituales">{[250,500,1000,2000].map(grams=><button type="button" key={grams} aria-pressed={draft.pieceWeightGrams===grams} onClick={()=>weight(grams)}>{grams<1000?`${grams} g`:`${grams/1000} kg`}</button>)}</div>
          <SaleNumberField label="Cantidad de peces para vender" unit="peces" value={draft.quantity??2} min={1} max={500} onChange={value=>onChange({...draft,quantity:value})}/>
          <label className="same-weight-confirmation"><input type="checkbox" checked={draft.sameWeightConfirmed===true} onChange={e=>onChange({...draft,sameWeightConfirmed:e.target.checked})}/><span>Todos estos peces pesan lo mismo.<small>Si pesan diferente, registra otro lote.</small></span></label>
        </>:<SaleNumberField label="Kilos para vender" unit="kg" value={draft.kg} min={1} max={500} onChange={value=>onChange({...draft,kg:value})}/>}
      </section>
      <section className="sale-field-card" aria-labelledby="sale-price-title"><h3 id="sale-price-title"><span>3</span> Precio de venta</h3>
        <SaleNumberField label="Precio por kilo" unit="COP" value={draft.price} min={1000} max={100000} step={1000} currency onChange={value=>onChange({...draft,price:value})}/>
        <p className="sale-quick-label">O elige un precio de referencia:</p><div className="price-shortcuts">{prices.map(price=><button type="button" key={price} aria-pressed={draft.price===price} onClick={()=>onChange({...draft,price})}>{money(price)}</button>)}</div>
        <p className="sale-price-note">El precio siempre es por kilo.{pieces?' Calculamos el valor de cada pez según su peso.':''}</p>
      </section>
    </div>
    <section className="sale-summary" aria-labelledby="sale-summary-title"><div><p className="eyebrow">ASÍ QUEDA TU PUBLICACIÓN</p><h3 id="sale-summary-title">{speciesName}</h3><p className="quantity-summary">{pieces?`${quantity} peces × ${formatKg(draft.pieceWeightGrams!/1000)} kg = ${formatKg(kg)} kg`:`${formatKg(kg)} kg disponibles para vender`}</p>{pieces&&<p>{money(lineAmount(draft,1))} por pez · {money(draft.price)} por kilo</p>}</div><div className="sale-total" aria-live="polite"><span>Si vendes todo, recibes</span><strong>{money(lineAmount(draft,quantity))}</strong><small>Ingreso bruto, antes de tus costos de pesca.</small></div></section>
    <details className="sale-costs"><summary>Calcular resultado después de costos (opcional)</summary><label>Costo de faena por kilo<input type="number" inputMode="numeric" min={0} max={100000} value={cost} onChange={e=>setCost(Math.max(0,Math.min(100000,Number(e.target.value)||0)))}/></label><p>Resultado estimado: <strong>{money(lineAmount(draft,quantity)-Math.round(cost*kg))}</strong>. Solo se descuenta el costo indicado.</p></details>
  </div>;
}
