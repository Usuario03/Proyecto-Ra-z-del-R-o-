import { useState, type FormEvent } from 'react';
import { Fish, Mail } from 'lucide-react';
import { useStore } from '../StoreContext';
import { assignedFisherEmail, registerFisher, REGISTRATION_PORTS, type FisherRegistration as Registration } from './authDomain';
import { VoiceButton } from '../fisher/InclusiveControls';

export default function FisherRegistration({onSuccess}:{onSuccess:()=>void}) {
  const {store,setStore}=useStore();
  const [data,setData]=useState<Registration>({name:'',document:'',port:REGISTRATION_PORTS[0]});const [error,setError]=useState('');
  const email=assignedFisherEmail(store,data.name);
  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError('');try{setStore(s=>registerFisher(s,data));onSuccess();}catch(err){setError((err as Error).message);}}
  return <section className="space-y-5 auth-fisher">
    <div><h2 className="font-display text-3xl">Tu espacio en la comunidad.</h2><p className="text-lg mt-2">Solicitud para pescadores formalizados de FEDEPESAN. Te asignamos un correo y un PIN para entrar fácilmente.</p></div>
    <VoiceButton text="Para solicitar tu registro, escribe tu nombre, tu cédula sin puntos y elige tu puerto. Al terminar, recibirás un correo preparado y un PIN. No necesitas crear una contraseña."/>
    <form className="space-y-5" onSubmit={submit}>
      <label className="text-lg">Nombre completo del pescador<input required autoComplete="name" maxLength={100} value={data.name} onChange={e=>setData(d=>({...d,name:e.target.value}))} placeholder="Ej. César Martínez"/></label>
      <label className="text-lg">Cédula<input required inputMode="numeric" pattern="[0-9]{6,12}" maxLength={12} value={data.document} onChange={e=>setData(d=>({...d,document:e.target.value.replace(/\D/g,'')}))} placeholder="Sin puntos ni espacios" title="Entre 6 y 12 números"/></label>
      <fieldset><legend className="text-xl font-bold mb-3">Puerto de desembarque</legend><div className="auth-port-options">{REGISTRATION_PORTS.map(port=><label key={port} className={data.port===port?'selected':''}><input type="radio" name="port" value={port} checked={data.port===port} onChange={()=>setData(d=>({...d,port}))}/>{port}</label>)}</div></fieldset>
      <div className="notice"><Mail className="shrink-0"/><div><p>Tu correo asignado al registrar:</p><strong className="break-all">{email}</strong><p className="text-sm mt-2">Es un identificador de acceso local; no crea un buzón de correo.</p></div></div>
      {error&&<p role="alert" className="alert">{error}</p>}
      <button type="submit" className="fisher-primary w-full"><Fish/> Guardar solicitud y entrar al portal</button>
    </form>
    <p>La solicitud se guarda en este dispositivo y permite probar el portal de inmediato. La afiliación real a FEDEPESAN no se verifica en este prototipo.</p>
  </section>;
}
