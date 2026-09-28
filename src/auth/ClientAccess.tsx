import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, ShoppingBasket } from 'lucide-react';
import { useStore } from '../StoreContext';
import { DEMO_CUSTOMER_ID } from '../domain';
import { createCredential, customerRegistrationError, enterDemoCustomer, loginCustomer, normalizeEmail, passwordDigest, registerCustomer, type CustomerRegistration } from './authDomain';

export default function ClientAccess({register=false,onSuccess}:{register?:boolean;onSuccess:()=>void}) {
  const {store,setStore,getStore}=useStore();
  const demoEmail=store.customers.find(customer=>customer.id===DEMO_CUSTOMER_ID)?.email||'comprador@gmail.com';
  const [data,setData]=useState<CustomerRegistration>({name:'',email:'',phone:'',address:''});
  const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
  const [visible,setVisible]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const active=useRef(true);const submitting=useRef(false);const errorRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
  function field(key:keyof CustomerRegistration,value:string){setData(d=>({...d,[key]:value}));}
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(submitting.current)return;setError('');submitting.current=true;setBusy(true);
    try{
      if(register){
        const invalid=customerRegistrationError(data,getStore());if(invalid)throw new Error(invalid);
        if(password!==confirm)throw new Error('Las contraseñas no coinciden. Escribe la misma en ambos campos.');
        const credential=await createCredential(password);
        if(active.current){setStore(s=>registerCustomer(s,data,credential));onSuccess();}
      }else{
        const customer=getStore().customers.find(c=>c.email===normalizeEmail(data.email));
        if(!customer)throw new Error('El correo o la contraseña no coinciden. Revisa tus datos e inténtalo otra vez.');
        const digest=await passwordDigest(password,customer.passwordSalt);
        if(active.current){setStore(s=>loginCustomer(s,data.email,digest));onSuccess();}
      }
    }catch(err){if(active.current)setError((err as Error).message);}
    finally{submitting.current=false;if(active.current)setBusy(false);}
  }
  return <section className="space-y-5">
    <div><h2 className="font-display text-3xl">{register?'Tu próxima compra empieza aquí.':'Qué bueno tenerte de vuelta.'}</h2><p className="mt-2">{register?'Registra tus datos para agilizar las entregas en Barrancabermeja.':'Entra con tu correo personal y tu contraseña.'}</p></div>
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={busy} className="space-y-4">
        {register&&<label>Nombre completo<input required autoComplete="name" maxLength={100} value={data.name} onChange={e=>field('name',e.target.value)} placeholder="Ej. Ana María Pérez"/></label>}
        <label>Correo personal<input type="email" required autoComplete="username" maxLength={150} value={data.email} onChange={e=>field('email',e.target.value)} placeholder="comprador@gmail.com"/></label>
        {register&&<><label>Teléfono móvil<input required type="tel" inputMode="numeric" autoComplete="tel" pattern="3[0-9]{9}" maxLength={10} value={data.phone} onChange={e=>field('phone',e.target.value.replace(/\D/g,''))} placeholder="3001234567" title="10 números, comenzando por 3"/></label><label>Dirección de entrega en Barrancabermeja<input required autoComplete="street-address" minLength={8} maxLength={180} value={data.address} onChange={e=>field('address',e.target.value)} placeholder="Barrio, calle y número de casa"/></label></>}
        <div><label htmlFor="auth-password">{register?'Crea tu contraseña':'Contraseña'}</label><div className="auth-password"><input id="auth-password" type={visible?'text':'password'} required minLength={register?8:undefined} maxLength={128} autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={register?'Mínimo 8 caracteres':'Tu contraseña'}/><button type="button" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={21}/>:<Eye size={21}/>}</button></div></div>
        {register&&<label>Confirma tu contraseña<input required type="password" autoComplete="new-password" maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repite la contraseña"/></label>}
      </fieldset>
      {error&&<div ref={errorRef} tabIndex={-1} role="alert" className="alert">{error}</div>}
      <button className="btn-primary w-full justify-center min-h-14" type="submit" disabled={busy}>{busy?'Preparando tu acceso…':register?'Crear cuenta de cliente':'Iniciar sesión como cliente'}<ArrowRight size={20}/></button>
    </form>
    {!register&&<><div className="auth-divider"><span>o prueba la experiencia</span></div><button className="btn-secondary w-full min-h-14" disabled={busy} onClick={()=>{setStore(enterDemoCustomer);onSuccess();}}><ShoppingBasket/> Ingreso Rápido Cliente Demo</button><p className="auth-demo-note">Cuenta de prueba: <strong className="break-all">{demoEmail}</strong><br/>Contraseña: <strong>Demo1234</strong></p></>}
  </section>;
}
