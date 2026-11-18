import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../StoreContext';
import { type CustomerRegistration } from './authDomain';
import { changeMyCredentialsInApi, loginWithApi, registerWithApi } from '../client/session';

export default function ClientAccess({register=false,onSuccess,forcePasswordChange=false,onPasswordChangeRequired,onPasswordChangeComplete}:{register?:boolean;onSuccess:()=>void;forcePasswordChange?:boolean;onPasswordChangeRequired:()=>void;onPasswordChangeComplete:()=>void}) {
  const {applyAuthSession}=useStore();
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
      if(forcePasswordChange){
        if(password!==confirm)throw new Error('Las contraseñas nuevas no coinciden.');
        const authRes=await changeMyCredentialsInApi({currentPassword:currentPasswordRef.current,newPassword:password});
        currentPasswordRef.current='';
        await applyAuthSession(authRes);
        if(active.current){onPasswordChangeComplete();onSuccess();}
      }else if(register){
        if(password!==confirm)throw new Error('Las contraseñas no coinciden. Escribe la misma en ambos campos.');
        const authRes = await registerWithApi({
          role: 'client',
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          password,
        });
        await applyAuthSession(authRes, { isNewRegistration: true });
        if(active.current) onSuccess();
      }else{
        const authRes = await loginWithApi({
          email: data.email,
          password,
        });
        if(authRes.mustChangePassword){
          currentPasswordRef.current=password;setPassword('');setConfirm('');onPasswordChangeRequired();
        }else{
          await applyAuthSession(authRes);
          if(active.current) onSuccess();
        }
      }
    }catch(err){if(active.current)setError((err as Error).message);}
    finally{submitting.current=false;if(active.current)setBusy(false);}
  }
  const currentPasswordRef=useRef('');
  return <section className="space-y-5">
    <div><h2 className="font-display text-3xl">{forcePasswordChange?'Cambia tu contraseña temporal':register?'Crear cuenta':'Qué bueno tenerte de vuelta.'}</h2><p className="mt-2">{forcePasswordChange?'Para proteger tu cuenta, establece una contraseña personal antes de continuar.':register?'Regístrate para realizar tus compras':'Entra con tu correo electrónico y tu contraseña.'}</p></div>
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={busy} className="space-y-4">
        {!forcePasswordChange&&register&&<label>Nombre completo<input required autoComplete="name" maxLength={100} value={data.name} onChange={e=>field('name',e.target.value)} placeholder="Ej. Ana María Pérez"/></label>}
        {!forcePasswordChange&&<label>Correo electrónico<input type="email" required autoComplete="username" maxLength={150} value={data.email} onChange={e=>field('email',e.target.value)} placeholder="nombre@correo.com"/></label>}
        {!forcePasswordChange&&register&&<><label>Teléfono móvil<input required type="tel" inputMode="numeric" autoComplete="tel" pattern="3[0-9]{9}" maxLength={10} value={data.phone} onChange={e=>field('phone',e.target.value.replace(/\D/g,''))} placeholder="3001234567" title="10 números, comenzando por 3"/></label><label>Dirección de entrega en Barrancabermeja<input required autoComplete="street-address" minLength={8} maxLength={180} value={data.address} onChange={e=>field('address',e.target.value)} placeholder="Barrio, calle y número de casa"/></label></>}
        <div><label htmlFor="auth-password">{forcePasswordChange?'Nueva contraseña':register?'Crea tu contraseña':'Contraseña'}</label><div className="auth-password"><input id="auth-password" type={visible?'text':'password'} required minLength={register||forcePasswordChange?8:undefined} maxLength={128} autoComplete={register||forcePasswordChange?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={register||forcePasswordChange?'Mínimo 8 caracteres':'Tu contraseña'}/><button type="button" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={21}/>:<Eye size={21}/>}</button></div></div>
        {(register||forcePasswordChange)&&<label>{forcePasswordChange?'Confirma tu nueva contraseña':'Confirma tu contraseña'}<input required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repite la contraseña"/></label>}
      </fieldset>
      {error&&<div ref={errorRef} tabIndex={-1} role="alert" className="alert">{error}</div>}
      <button className="btn-primary w-full justify-center min-h-14" type="submit" disabled={busy}>{busy?'Preparando tu acceso…':forcePasswordChange?'Guardar contraseña':register?'Crear cuenta':'Iniciar sesión'}<ArrowRight size={20}/></button>
    </form>
  </section>;
}
