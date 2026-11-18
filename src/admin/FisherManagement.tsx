import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ZONES } from '../domain';
import { apiRequest } from '../client/api';
import { getClientJwtToken } from '../client/session';
import type { UserProfileDto } from '../../server/contracts/profile';

const empty = {name:'',email:'',nickname:'',document:'',port:'',password:''};

export default function FisherManagement() {
  const [open,setOpen]=useState(false);
  const [data,setData]=useState(empty);
  const [confirm,setConfirm]=useState('');
  const [visible,setVisible]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [saved,setSaved]=useState('');
  function field(key:keyof typeof empty,value:string){setData(prev=>({...prev,[key]:value}));}
  function close(){setOpen(false);setData(empty);setConfirm('');setVisible(false);setError('');}
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy)return;setError('');setSaved('');
    if(data.password!==confirm){setError('Las contraseñas no coinciden.');return;}
    setBusy(true);
    try {
      const profile=await apiRequest<UserProfileDto>('/api/admin/fishers',{
        method:'POST',token:getClientJwtToken(),body:data,
      });
      close();setSaved(`Cuenta de ${profile.name} creada. Ya puede iniciar sesión con su correo y contraseña.`);
    } catch(err){setError((err as Error).message);}
    finally{setBusy(false);}
  }
  return <section className="admin-test" aria-labelledby="fisher-management">
    <h2 id="fisher-management" className="font-display text-3xl mb-4">Gestión de pescadores</h2>
    {!open?<button className="btn-primary" onClick={()=>{setOpen(true);setSaved('');}}>Crear cuenta de pescador</button>:
      <form onSubmit={submit} className="space-y-4 max-w-2xl">
        <p>Registra sus datos y establece una contraseña inicial. Entrégala al titular por un canal privado.</p>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 min-w-0">
          <label>Nombre completo<input required minLength={2} maxLength={100} value={data.name} onChange={e=>field('name',e.target.value)}/></label>
          <label>Correo electrónico<input required type="email" maxLength={150} autoComplete="off" value={data.email} onChange={e=>field('email',e.target.value)}/></label>
          <label>Apodo o nombre tradicional<input required maxLength={80} value={data.nickname} onChange={e=>field('nickname',e.target.value)}/></label>
          <label>Documento<input required inputMode="numeric" pattern="[0-9]{6,12}" maxLength={12} value={data.document} onChange={e=>field('document',e.target.value)}/></label>
          <label className="sm:col-span-2">Puerto o zona de pesca<select required value={data.port} onChange={e=>field('port',e.target.value)}><option value="">Selecciona una zona</option>{ZONES.map(zone=><option key={zone}>{zone}</option>)}</select></label>
          <div><label htmlFor="fisher-password">Contraseña inicial</label><div className="auth-password"><input id="fisher-password" required type={visible?'text':'password'} minLength={8} maxLength={128} autoComplete="new-password" value={data.password} onChange={e=>field('password',e.target.value)}/><button type="button" aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={20}/>:<Eye size={20}/>}</button></div></div>
          <label>Confirmar contraseña<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
        </fieldset>
        {error&&<p role="alert" className="alert">{error}</p>}
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="btn-primary">{busy?'Creando cuenta…':'Crear cuenta de pescador'}</button><button type="button" disabled={busy} className="btn-secondary" onClick={close}>Cancelar</button></div>
      </form>}
    {saved&&<p role="status" className="mt-4">{saved}</p>}
  </section>;
}
