import { Type, Volume2 } from 'lucide-react';
import { useStore } from '../StoreContext';
import type { AccessibilityPreferences } from '../accessibility/preferences';

// Las ayudas están siempre a la vista dentro del portal: no hay un botón
// adicional, modal de configuración ni un modo de navegación alternativo.
export default function FisherHelp({compact=false}:{compact?:boolean}){
  const {store,setStore}=useStore();const prefs=store.accessibility;
  function update<K extends keyof AccessibilityPreferences>(key:K,value:AccessibilityPreferences[K]){
    setStore(s=>({...s,accessibility:{...s.accessibility,[key]:value}}));
  }
  return <section className={`fisher-help ${compact?'fisher-help-compact':''}`} aria-labelledby="fisher-help-title">
    <div className="fisher-help-heading"><h2 id="fisher-help-title">Ayudas para tu jornada</h2><p>Ajusta el texto y escucha las instrucciones.</p></div>
    <div className="fisher-help-grid">
      <fieldset className="fisher-help-text"><legend className="sr-only">Tamaño de las letras</legend><p className="help-block-label" aria-hidden="true"><Type size={19}/><span>Tamaño de las letras</span></p><div className="fisher-font-options">{([{id:'normal',label:'Normal'},{id:'large',label:'Grande'},{id:'extra',label:'Muy grande'}] as const).map(option=><label key={option.id} className={prefs.textSize===option.id?'selected':''}><input type="radio" name="fisher-text-size" checked={prefs.textSize===option.id} onChange={()=>update('textSize',option.id)}/><span>{option.label}</span></label>)}</div></fieldset>
      <label className="fisher-help-option"><Volume2 size={23}/><span><strong>Leer instrucciones</strong><small>Activa los botones para escuchar la ayuda.</small></span><input className="reading-toggle" type="checkbox" checked={prefs.readInstructions} onChange={e=>update('readInstructions',e.target.checked)}/></label>
    </div>
  </section>;
}
