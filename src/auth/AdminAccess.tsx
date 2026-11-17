import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ADMIN_ACCOUNT } from '../domain';
import { useStore } from '../StoreContext';
import { loginWithApi } from '../client/session';

export default function AdminAccess({onSuccess}:{onSuccess:()=>void}) {
  const {applyAuthSession}=useStore();const [email,setEmail]=useState('');const [password,setPassword]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy)return;setBusy(true);setError('');
    try{
      const authRes=await loginWithApi({email,password});
      if(authRes.profile.role!=='admin')throw new Error('Esta cuenta no tiene permisos administrativos.');
      await applyAuthSession(authRes);
      if(active.current)onSuccess();
    }catch(err){if(active.current)setError((err as Error).message);}
    finally{if(active.current)setBusy(false);}
  }
  return <section className="space-y-5"><div><ShieldCheck size={32}/><h2 className="font-display text-3xl mt-3">Acceso administrativo</h2><p className="mt-3">Gestiona las vedas, tallas mínimas y pruebas ambientales desde un panel exclusivo.</p></div>
    <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
      <label>Correo de administración<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder={ADMIN_ACCOUNT.email}/></label>
      <label>Contraseña de administración<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} maxLength={128}/></label>
    </fieldset>{error&&<p role="alert" className="alert">{error}</p>}<button className="btn-primary w-full justify-center" disabled={busy}>{busy?'Verificando acceso…':'Entrar a administración'}</button></form>
    <p className="auth-demo-note">Cuenta de evaluación: <strong>{ADMIN_ACCOUNT.email}</strong><br/>Contraseña de prueba: <strong>Admin1234</strong>. No hay registro público de administradores.</p>
  </section>;
}
