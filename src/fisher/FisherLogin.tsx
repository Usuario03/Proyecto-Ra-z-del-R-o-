import { useState } from 'react';
import { ArrowLeft, Delete, Fingerprint, MapPin } from 'lucide-react';
import { useStore } from '../StoreContext';
import { loginWithApi } from '../client/session';
import { VoiceButton } from './InclusiveControls';

export default function FisherLogin({onSuccess}:{onSuccess:()=>void}) {
  const {store,applyAuthSession}=useStore();
  const [chosen,setChosen]=useState('');const [pin,setPin]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const fisher=store.fishermen.find(f=>f.id===chosen);
  function select(id:string){setChosen(id);setPin('');setError('');}
  async function enter(oneTouch=false) {
    if(!fisher||busy)return;
    setBusy(true);setError('');
    try{
      const authRes=await loginWithApi({email:fisher.email,password:oneTouch?'':pin,oneTouch});
      await applyAuthSession(authRes);
      onSuccess();
    }catch(err){setError((err as Error).message);setPin('');}
    finally{setBusy(false);}
  }
  return <section className="auth-fisher space-y-5" aria-label="Ingreso inclusivo de pescadores">
    <div><h2 className="font-display text-3xl">Tu correo ya está listo.</h2><p className="text-lg mt-2">Elige tu nombre o correo. Entra con cuatro números o con un solo toque.</p></div>
    <VoiceButton text={fisher?`Hola ${fisher.nickname}. Escribe tu PIN de cuatro números en el teclado grande o toca Entrar con un toque.`:'Selecciona tu correo en la lista o toca la tarjeta con tu nombre. No necesitas escribir un correo ni una contraseña.'}/>
    <label className="text-lg">Correo o perfil de pescador<select value={chosen} onChange={e=>select(e.target.value)}><option value="">Selecciona tu perfil…</option>{store.fishermen.map(f=><option key={f.id} value={f.id}>{f.nickname} · {f.email} · {f.port}</option>)}</select></label>
    {!fisher?<div className="auth-profile-grid">{store.fishermen.map(f=><button key={f.id} type="button" className="auth-profile" onClick={()=>select(f.id)}><img src={f.photo} alt=""/><strong>{f.nickname}</strong><span className="profile-email">{f.email}</span><span className="flex items-center justify-center gap-1"><MapPin size={16}/>{f.port}</span></button>)}</div>:
      <div className="space-y-5">
        <div className="auth-selected-profile"><img src={fisher.photo} alt={`Retrato de ${fisher.nickname}`}/><div><h3 className="text-2xl font-bold">{fisher.name}</h3><p className="break-all">{fisher.email}</p><p>{fisher.port}</p></div></div>
        <button className="fisher-primary w-full" disabled={busy} onClick={()=>{void enter(true);}}><Fingerprint size={30}/> Entrar con un toque · simulación</button>
        <p className="text-base">Acceso de un toque de demostración, sin lectura de huellas. {fisher.registration==='demo'?'PIN del perfil de prueba: 1234.':'Usa el PIN que recibiste al registrar tu solicitud.'}</p>
        <form onSubmit={e=>{e.preventDefault();void enter();}} className="space-y-4">
          <label className="text-xl">PIN de cuatro dígitos<input className="pin-display" type="password" inputMode="numeric" autoComplete="off" maxLength={4} pattern="[0-9]{4}" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="••••"/></label>
          <div className="pin-keypad">{['1','2','3','4','5','6','7','8','9'].map(n=><button type="button" key={n} onClick={()=>setPin(p=>(p+n).slice(0,4))}>{n}</button>)}<button type="button" onClick={()=>setPin('')}>Borrar</button><button type="button" onClick={()=>setPin(p=>(p+'0').slice(0,4))}>0</button><button type="button" aria-label="Borrar último número" onClick={()=>setPin(p=>p.slice(0,-1))}><Delete/></button></div>
          {error&&<p role="alert" className="alert">{error}</p>}
          <button type="submit" className="fisher-primary w-full" disabled={busy||pin.length!==4}>Entrar con mi PIN</button>
        </form>
        <button className="fisher-secondary" onClick={()=>select('')}><ArrowLeft/> Elegir otro perfil</button>
      </div>}
  </section>;
}
