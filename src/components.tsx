import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Product } from './domain';

export function FishArt({product, className=''}:{product:Product;className?:string}) {
  const id=useId().replace(/:/g,'');
  const spId = product.speciesId || product.id;
  if(product.photo) return <img className={`product-photo ${className}`} src={product.photo} alt={`Fotografía del lote de ${product.name}`} loading="lazy"/>;
  return <svg className={className} viewBox="0 0 440 230" role="img" aria-label={`Ilustración de ${product.name}`}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0.2" y2="1"><stop stopColor={product.color}/><stop offset=".5" stopColor="#d8ddd0"/><stop offset="1" stopColor="#f8f4df"/></linearGradient><pattern id={`${id}sc`} width="15" height="13" patternUnits="userSpaceOnUse"><path d="M0 0 Q7 13 15 0" fill="none" stroke="#344a3b" strokeOpacity=".17"/></pattern></defs>
    <ellipse cx="218" cy="185" rx="143" ry="10" fill="#203c35" opacity=".07"/>
    <g transform="rotate(-8 220 115)"><path d="M126 117 L51 66 Q62 113 47 165 L127 138" fill={product.color} stroke="#4e6256" strokeWidth="2"/><path d="M172 82 Q205 19 249 68 L271 86 M189 146 L222 184 256 151" fill={product.color} stroke="#4e6256" strokeWidth="2"/><path d="M109 126 C153 58 285 54 360 112 Q392 124 362 143 C280 185 164 176 109 126Z" fill={`url(#${id})`} stroke="#4e6256" strokeWidth="2"/><path d="M119 126 C168 66 272 66 319 98 L311 152 C238 177 156 160 119 126" fill={`url(#${id}sc)`}/><path d="M311 91 Q286 119 309 158 M350 140 L375 131 M218 130 L258 150 241 115" fill="none" stroke="#53685a" strokeWidth="2"/><circle cx="338" cy="113" r="8" fill="#dedcc5"/><circle cx="339" cy="113" r="4" fill="#1b302b"/><circle cx="340" cy="111" r="1.3" fill="white"/>{['rayado','pintado','nicuro','blanquillo'].includes(spId)&&<path d="M370 133 Q391 158 409 144 M364 137 Q377 174 399 170" fill="none" stroke="#53685a" strokeWidth="2"/>}{spId==='rayado'&&[155,183,211,239,267].map(x=><path key={x} d={`M${x} 85 q-20 40 0 74`} fill="none" stroke="#4c5543" opacity=".55" strokeWidth="7"/>)}</g>
  </svg>;
}

// Diálogo compartido: foco inicial, trampa de tabulación, Escape y devolución
// del foco al disparador para navegación completa sin ratón.
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}) {
  const ref=useRef<HTMLDivElement>(null); const id=useId(); const close=useRef(onClose); close.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement; const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden'; ref.current?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape') close.current();
      if(e.key==='Tab') {
        const items=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0);
        const first=items[0],last=items.at(-1);
        if(!first) {e.preventDefault();return;}
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={`modal ${wide?'max-w-3xl':'max-w-xl'}`}><div className="flex items-center justify-between gap-4 border-b border-river/10 p-5"><h2 id={id} className="font-display text-2xl">{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Cerrar ventana"><X/></button></div><div className="p-5 sm:p-7">{children}</div></div></div>;
}
