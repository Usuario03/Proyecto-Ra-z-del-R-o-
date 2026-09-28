import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Rocket } from 'lucide-react';
import { captureError, captureQuantityError, dateTime, draftQuantity, lineAmount, METHODS, minimumFor, MOCK_PRODUCTS, money, publishCapture, quantityLabel, ZONES, type CaptureDraft } from '../domain';
import { FishArt } from '../components';
import { useStore } from '../StoreContext';
import { PhotoPicker, Stepper, VoiceButton } from './InclusiveControls';
import ActionFeedback from '../accessibility/ActionFeedback';
import FisherHelp from './FisherHelp';
import QuantityPriceStep from './QuantityPriceStep';

const STEPS=['Elige tu pescado','Cantidad y precio','Cuidemos la talla','Lugar y forma de pesca','Foto y publicación'];
const localDateValue=(iso:string)=>{const d=new Date(iso);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};

export default function CaptureWizard({onClose,onShop}:{onClose:()=>void;onShop:()=>void}) {
  const {store,setStore,getStore}=useStore();
  const [step,setStep]=useState(0);const [error,setError]=useState('');const [success,setSuccess]=useState(false);const [photoBusy,setPhotoBusy]=useState(false);const title=useRef<HTMLHeadingElement>(null);
  const [draft,setDraft]=useState<CaptureDraft>(()=>({speciesId:'bocachico',kg:5,price:18000,length:28,zone:ZONES[0],method:METHODS[0],capturedAt:new Date(Date.now()-2*3600000).toISOString(),landedAt:new Date(Date.now()-3600000).toISOString(),temperature:3,photo:''}));
  const species=MOCK_PRODUCTS.find(p=>p.speciesId===draft.speciesId)!;const minimum=minimumFor(species,store);
  const problem=captureError(draft,store);const publishProblem=captureError(draft,store,true);const quantities=captureQuantityError(draft);
  const available=draftQuantity(draft);const taskTitle=`Paso ${step+1}. ${STEPS[step]}`;
  const change=<K extends keyof CaptureDraft>(key:K,value:CaptureDraft[K])=>setDraft(d=>({...d,[key]:value}));
  const blocked=photoBusy||(step===4?!!publishProblem:step===1?!!quantities:step>=2?!!problem:false);
  useEffect(()=>{title.current?.focus({preventScroll:true});title.current?.scrollIntoView({behavior:'instant',block:'start'});},[step,success]);
  function publish(){setError('');try{setStore(publishCapture(getStore(),draft));setSuccess(true);}catch(err){setError((err as Error).message);}}
  if(success)return <main className="fisher-page site-width"><div className="wizard-success"><Check size={65}/><h1 ref={title} tabIndex={-1}>¡Tu pesca ya está en la tienda!</h1><ActionFeedback title="PESCA REGISTRADA" text={`Tu publicación de ${species.name} quedó disponible en la tienda: ${quantityLabel(draft,available)} a ${money(draft.price)} por kilo.`}/><button className="fisher-primary" onClick={onShop}>Ver en la tienda <ArrowRight/></button><button className="fisher-secondary" onClick={onClose}>Volver a mi panel</button></div></main>;
  return <main className="fisher-page site-width capture-wizard">
    <button className="fisher-secondary" onClick={onClose}><ArrowLeft/> Volver al panel</button><h1 className="mt-5">Registrar nueva pesca</h1>
    <ol className="wizard-progress" aria-label="Pasos del registro">{STEPS.map((s,i)=><li key={s} aria-label={`Paso ${i+1}: ${s}`} aria-current={step===i?'step':undefined} className={i<=step?'current':''}><span>{i+1}</span><span>{s}</span></li>)}</ol>
    <section className="wizard-card" data-active-task={`step-${step+1}`}>
      <div className="wizard-heading"><h2 tabIndex={-1} ref={title}>{taskTitle}</h2><VoiceButton text={`${taskTitle}. ${step===1?'Primero elige si vendes por kilos o por peces del mismo peso. Después escribe la cantidad y el precio por kilo. Abajo verás el ingreso esperado.':step===2?'Compara la talla con el mínimo. Si hay veda o la talla es pequeña, no podrás publicar.':step===4?'La foto del pescado es obligatoria. Tómala o elige una imagen del celular. Revisa los datos antes de publicar.':'Usa las imágenes y los botones para elegir. Después toca Continuar.'}`}/></div>
      <FisherHelp compact/>
      {step===0&&<div className="species-choices">{MOCK_PRODUCTS.map(p=><button key={p.id} className={`species-choice ${p.speciesId===draft.speciesId?'selected':''}`} aria-pressed={p.speciesId===draft.speciesId} onClick={()=>setDraft(d=>({...d,speciesId:p.speciesId,price:p.price,length:Math.max(p.length,minimumFor(p,store))}))}><FishArt product={p}/><strong>{p.name}</strong><span>{store.bans[p.speciesId]?'En veda · solo consulta':`Mínimo de prueba: ${minimumFor(p,store)} cm`}</span></button>)}</div>}
      {step===1&&<QuantityPriceStep draft={draft} onChange={setDraft} speciesName={species.name} suggestedPrice={species.price}/>}
      {step===2&&<div className="space-y-6"><FishArt product={species} className="max-h-44 mx-auto"/><Stepper label="Talla del pescado" unit="cm" min={1} max={250} value={draft.length} onChange={v=>change('length',v)}/><p className="text-xl text-center">Talla mínima ilustrativa: <strong>{minimum} cm</strong></p><div className="size-track"><div style={{width:`${Math.min(100,draft.length/(minimum*1.5)*100)}%`}}/><span style={{left:'66.67%'}}/></div>{problem?<ActionFeedback error title="NO SE PUEDE PUBLICAR" text={problem}/>:<p className="notice"><Check/> Talla y veda verificadas en la simulación.</p>}</div>}
      {step===3&&<div className="space-y-6">
        <fieldset><legend className="text-xl font-bold mb-3">¿Dónde pescaste?</legend><div className="touch-options">{ZONES.map(z=><button type="button" key={z} aria-pressed={draft.zone===z} onClick={()=>change('zone',z)}>{z}</button>)}</div></fieldset>
        <fieldset><legend className="text-xl font-bold mb-3">¿Cómo pescaste?</legend><div className="touch-options">{METHODS.map(m=><button type="button" key={m} aria-pressed={draft.method===m} onClick={()=>change('method',m)}>{m}</button>)}</div></fieldset>
        <div className="grid sm:grid-cols-2 gap-4"><label className="text-lg">Fecha y hora de captura<input type="datetime-local" value={localDateValue(draft.capturedAt)} onChange={e=>{if(e.target.value)change('capturedAt',new Date(e.target.value).toISOString());}}/></label><label className="text-lg">Desembarque en puerto<input type="datetime-local" value={localDateValue(draft.landedAt)} onChange={e=>{if(e.target.value)change('landedAt',new Date(e.target.value).toISOString());}}/></label></div>
        <Stepper label="Temperatura de conservación" unit="°C" max={4} value={draft.temperature} onChange={v=>change('temperature',v)}/>
      </div>}
      {step===4&&<div className="grid md:grid-cols-2 gap-7"><PhotoPicker value={draft.photo} onChange={v=>change('photo',v)} onBusyChange={setPhotoBusy}/><div className="impact-widget"><h3 className="text-2xl font-bold">Revisa tu pesca</h3><p className="text-xl">{species.name} · {quantityLabel(draft,available)}</p><p>{money(draft.price)}/kg · talla {draft.length} cm</p><p>{draft.zone} · {draft.method}</p><p>Captura: {dateTime(draft.capturedAt)}</p><p>Desembarque: {dateTime(draft.landedAt)}</p><p>{draft.temperature} °C · ingreso: {money(lineAmount(draft,available))}</p></div></div>}
      {error&&<ActionFeedback error title="NO SE PUEDE PUBLICAR" text={error}/>}
      {!error&&step>=3&&(step===4?publishProblem:problem)&&<ActionFeedback error title="NO SE PUEDE PUBLICAR" text={step===4?publishProblem:problem}/>}
      <div className="wizard-actions"><button className="fisher-secondary" disabled={step===0} onClick={()=>{setStep(s=>s-1);setError('');}}><ArrowLeft/> Anterior</button>{step===4?<button className="fisher-primary" disabled={blocked} onClick={publish}><Rocket/> PUBLICAR EN LA TIENDA AHORA</button>:<button className="fisher-primary" disabled={blocked} onClick={()=>{setStep(s=>s+1);setError('');}}>Continuar<ArrowRight/></button>}</div>
    </section>
  </main>;
}
