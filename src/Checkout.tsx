import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BellRing, CreditCard, Landmark, LoaderCircle, ShieldCheck, Smartphone } from 'lucide-react';
import {
  confirmCheckoutAttemptInApi,
  createCheckoutAttemptInApi,
  fetchCartFromApi,
  setCartLineInApi,
} from './client/cart';
import { createOrder, money, PAYMENT_METHODS, recordFailedAttempt, total, validateCart, type Delivery, type Order, type PaymentMethod } from './domain';
import { Modal } from './components';
import { ReceiptView } from './Orders';
import { useStore } from './StoreContext';

export default function Checkout({onClose}:{onClose:()=>void}) {
  const {store,setStore,getStore,refreshFromBackend}=useStore();
  const [method,setMethod]=useState<PaymentMethod>('PSE');
  const [stage,setStage]=useState<'form'|'authorize'|'processing'|'success'>('form');
  const [reject,setReject]=useState(false);const [error,setError]=useState('');
  const [bank,setBank]=useState('Bancolombia');const [customerType,setCustomerType]=useState('Persona Natural');
  const [walletPhone,setWalletPhone]=useState('');const [number,setNumber]=useState('');const [expiry,setExpiry]=useState('');const [cvv,setCvv]=useState('');const [flip,setFlip]=useState(false);
  const [delivery,setDelivery]=useState<Delivery>(()=>{
    const date=new Date();date.setDate(date.getDate()+1);
    const customer=store.customers.find(c=>c.id===store.clientSession);
    return {name:customer?.name||'',phone:customer?.phone||'',address:customer?.address||'',slot:'8:00 a. m. – 11:00 a. m.',date:date.toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})};
  });
  const [seconds,setSeconds]=useState(60);const deadline=useRef(0);
  const pending=useRef<Order|null>(null);const processing=useRef(false);
  const [receiptId,setReceiptId]=useState<string|null>(null);
  const receipt=store.orders.find(o=>o.id===receiptId);
  const field=(key:keyof Delivery,value:string)=>setDelivery(d=>({...d,[key]:value}));

  // Los campos controlados sobreviven al desmontaje visual del formulario durante
  // autorización y procesamiento. Un rechazo no obliga a volver a escribir la dirección.
  // Solo el pedido confirmado persiste datos ficticios de entrega; CVV, PAN y celular
  // de billetera permanecen en memoria y se descartan al cerrar el checkout.
  useEffect(()=>{
    if(stage!=='authorize'||method==='PSE')return;
    const timer=window.setInterval(()=>{
      const remaining=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));setSeconds(remaining);
      if(!remaining){window.clearInterval(timer);setStore(s=>recordFailedAttempt(s,method,'vencido'));setStage('form');setError('La autorización venció. Conservamos tus datos y tu canasta; vuelve a intentarlo.');}
    },250);
    return()=>window.clearInterval(timer);
  },[stage,method,setStore]);

  // La confirmación es atómica en PostgreSQL: primero valida la fotografía del pedido frente al
  // catálogo actual; después guarda pedido/transacción, descuenta stock y vacía carrito.
  useEffect(()=>{
    if(stage!=='processing')return;
    const timer=window.setTimeout(()=>{
      void (async ()=>{
        processing.current=false;
        try{
          const order=pending.current!;
          let cartDto=await fetchCartFromApi();
          const localEntries=Object.entries(getStore().cart).filter(([,q])=>q>0);
          if(cartDto.lines.length===0&&localEntries.length>0){
            for(const [lotId,qty] of localEntries){
              cartDto=await setCartLineInApi(lotId,{quantity:qty});
            }
          }
          const reqKey=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`chk-${Date.now()}-${Math.random()}`;
          const attempt=await createCheckoutAttemptInApi({
            requestKey:reqKey,
            cartVersion:cartDto.version,
            method,
            bank:method==='PSE'?bank:'',
            customerType:method==='PSE'?customerType:'natural',
            delivery:order.delivery,
          });
          const confirmRes=await confirmCheckoutAttemptInApi(attempt.id,{
            outcome:reject?'rechazado':'exitoso',
          });
          await refreshFromBackend();
          if(reject){
            setStage('form');
            setError('El pago de prueba fue rechazado por fondos insuficientes o un error de red. Selecciona “Pago exitoso” para reintentar. Conservamos tus datos y productos.');
            return;
          }
          setReceiptId(confirmRes.order!.id);
          setNumber('');
          setCvv('');
          setStage('success');
        }catch(err){
          setStage('form');
          setError((err as Error).message);
        }
      })();
    },1800);
    return()=>window.clearTimeout(timer);
  },[stage,reject,method,bank,customerType,getStore,refreshFromBackend]);

  function pay(){
    if(processing.current)return;
    if(stage==='authorize'&&method!=='PSE'&&Date.now()>=deadline.current){
      setStore(s=>recordFailedAttempt(s,method,'vencido'));setStage('form');setError('El tiempo terminó. Puedes intentarlo de nuevo sin perder tus datos.');return;
    }
    processing.current=true;setStage('processing');
  }
  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');
    const invalid=validateCart(getStore());if(invalid){setError(invalid);return;}
    if(delivery.name.trim().length<2||delivery.address.trim().length<8){setError('Escribe tu nombre y una dirección completa para la entrega.');return;}
    if(method==='Tarjeta'){
      const digits=number.replace(/\D/g,'');let sum=0;
      for(let i=digits.length-1,j=0;i>=0;i--,j++){let n=Number(digits[i]);if(j%2){n*=2;if(n>9)n-=9;}sum+=n;}
      const [month,year]=expiry.split('/').map(Number);
      if(digits.length!==16||sum%10!==0){setError('Revisa el número de prueba. Puedes usar 4242 4242 4242 4242.');return;}
      if(!month||month>12||!year||new Date(2000+year,month,1)<=new Date()){setError('Revisa el vencimiento. Usa una fecha futura, por ejemplo 12/30.');return;}
    }
    const date=new Date();date.setDate(date.getDate()+1);
    const shipping={...delivery,name:delivery.name.trim(),address:delivery.address.trim(),date:date.toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})};
    try{pending.current=createOrder(getStore(),shipping,method,method==='PSE'?bank:'',method==='PSE'?customerType:'');}catch(err){setError((err as Error).message);return;}
    if(method==='Tarjeta')pay();else{deadline.current=Date.now()+60000;setSeconds(60);setStage('authorize');}
  }

  return <Modal title={stage==='success'?'¡Gracias por apoyar al río!':'Finaliza tu compra'} onClose={onClose} wide>
    {stage==='success'&&receipt?<><ReceiptView order={receipt}/><button className="btn-secondary mt-4 print:hidden" onClick={onClose}>Seguir explorando</button></>:
      stage==='processing'?<div className="py-14 text-center space-y-5" role="status"><LoaderCircle className="mx-auto animate-spin" size={48}/><h3 className="font-display text-3xl">Estamos preparando algo bueno.</h3><p>Validando el pago local y verificando inventario, tallas y vedas…</p><p>Si cierras esta ventana, se cancela la operación pendiente.</p></div>:
      stage==='authorize'?<div className="space-y-6 py-5 text-center"><p className="eyebrow">ENTORNO LOCAL · SIN CONEXIÓN BANCARIA</p>
        {method==='PSE'?<><Landmark className="mx-auto" size={48}/><h3 className="font-display text-3xl">Autorización PSE de prueba</h3><p>{bank} · {customerType}</p><p>No necesitas contraseñas bancarias. Autoriza el pago ficticio aquí.</p></>:
          <div className="phone-mockup"><div className="phone-notch"/><Smartphone size={35}/><div className="push-notification"><BellRing className="push-bell"/><div><strong>{method} · solicitud de pago</strong><p>Celular terminado en {walletPhone.slice(-4)}</p><p>Raíz del Río solicita {money(pending.current!.total)}.</p></div></div><p role="timer" className="text-2xl font-bold">{seconds} segundos</p><p>Notificación simulada en este navegador.</p></div>}
        <p className="text-3xl font-bold">{money(pending.current!.total)}</p><div className="flex gap-3 flex-wrap justify-center"><button className="btn-primary" onClick={pay}>Autorizar pago ficticio</button><button className="btn-secondary" onClick={()=>setStage('form')}>Volver sin pagar</button></div>
      </div>:
      <form onSubmit={submit} className="space-y-6">
        <div className="notice"><ShieldCheck/><p>Usa datos ficticios. No hay cobros reales. Los pedidos confirmados guardan la entrega en este navegador; nunca guardamos tarjeta ni CVV.</p></div>
        {error&&<div className="alert" role="alert">{error}</div>}
        <section><h3 className="section-label">1. ¿Dónde recibirás tu pesca?</h3><div className="grid sm:grid-cols-2 gap-4">
          <label>Nombre completo<input required value={delivery.name} onChange={e=>field('name',e.target.value)} maxLength={80} placeholder="Ej. Ana Pérez" autoComplete="off"/></label>
          <label>Celular<input required type="tel" inputMode="numeric" pattern="3[0-9]{9}" value={delivery.phone} onChange={e=>field('phone',e.target.value)} placeholder="3001234567" title="10 dígitos, comienza por 3"/></label>
          <label className="sm:col-span-2">Dirección en Barrancabermeja<input required minLength={8} maxLength={180} value={delivery.address} onChange={e=>field('address',e.target.value)} placeholder="Barrio, calle y número de casa"/></label>
          <label className="sm:col-span-2">Entrega mañana · {delivery.date}<select value={delivery.slot} onChange={e=>field('slot',e.target.value)}><option>8:00 a. m. – 11:00 a. m.</option><option>11:00 a. m. – 2:00 p. m.</option><option>2:00 p. m. – 5:00 p. m.</option></select></label>
        </div></section>
        <fieldset><legend className="section-label">2. Elige cómo pagar</legend><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">{PAYMENT_METHODS.map(m=><button key={m} type="button" className={`payment-tab ${method===m?'selected':''}`} aria-pressed={method===m} onClick={()=>{setMethod(m);setError('');}}>{m==='PSE'?<Landmark/>:m==='Tarjeta'?<CreditCard/>:<Smartphone/>}{m}</button>)}</div>
          {method==='PSE'?<div className="grid sm:grid-cols-2 gap-4"><label>Tu banco<select value={bank} onChange={e=>setBank(e.target.value)}>{['Bancolombia','Banco de Bogotá','Davivienda','Nequi','BBVA Colombia'].map(b=><option key={b}>{b}</option>)}</select></label><label>Tipo de cliente<select value={customerType} onChange={e=>setCustomerType(e.target.value)}><option>Persona Natural</option><option>Persona Jurídica</option></select></label></div>:
            method==='Tarjeta'?<div className="space-y-4">
              <div className={`card-preview ${flip?'flipped':''}`} aria-hidden="true"><div className="card-front"><span>RAÍZ DEL RÍO · TARJETA DE PRUEBA</span><CreditCard/><strong>{number||'•••• •••• •••• ••••'}</strong><span>{expiry||'MM/AA'} <span className="float-right">VISA / Mastercard</span></span></div><div className="card-back"><div className="h-10 bg-black/70 -mx-6 mb-6"/><p className="bg-white text-river p-2 text-right">CVV · •••</p><small>Solo demostración</small></div></div>
              <p>Prueba: 4242 4242 4242 4242 · 12/30 · CVV 123.</p>
              <label>Número de tarjeta<input required inputMode="numeric" value={number} onChange={e=>setNumber(e.target.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim())} placeholder="4242 4242 4242 4242" autoComplete="off"/></label>
              <div className="grid grid-cols-2 gap-4"><label>Vencimiento<input required pattern="[0-9]{2}/[0-9]{2}" inputMode="numeric" value={expiry} onChange={e=>{const v=e.target.value.replace(/\D/g,'').slice(0,4);setExpiry(v.length>2?v.slice(0,2)+'/'+v.slice(2):v);}} placeholder="12/30"/></label><label>CVV<input required type="password" pattern="[0-9]{3}" maxLength={3} inputMode="numeric" autoComplete="off" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,''))} onFocus={()=>setFlip(true)} onBlur={()=>setFlip(false)} placeholder="123"/></label></div>
            </div>:<label>Celular de {method}<input required type="tel" inputMode="numeric" pattern="3[0-9]{9}" value={walletPhone} onChange={e=>setWalletPhone(e.target.value)} title="10 dígitos, comienza por 3" placeholder="3001234567"/><span className="font-normal">Simularemos una notificación con 60 segundos para autorizar.</span></label>}
        </fieldset>
        <label className="rounded-xl bg-paper p-4">Resultado de la simulación<select value={reject?'reject':'success'} onChange={e=>setReject(e.target.value==='reject')}><option value="success">Pago exitoso</option><option value="reject">Pago rechazado · fondos insuficientes / error de red</option></select></label>
        <div className="flex justify-between text-xl font-bold"><span>Total · envío incluido</span><span>{money(total(store.cart,store.products))}</span></div>
        <button type="submit" className="btn-primary w-full justify-center"><ShieldCheck/> Simular pago · {money(total(store.cart,store.products))}</button>
      </form>}
  </Modal>;
}
