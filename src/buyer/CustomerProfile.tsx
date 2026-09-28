import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Mail, MapPin, Save, UserRound } from 'lucide-react';
import { isClient } from '../domain';
import { useStore } from '../StoreContext';
import { updateCustomerProfile, type CustomerRegistration } from '../auth/authDomain';

export default function CustomerProfile({onHome,onOrders}:{onHome:()=>void;onOrders:()=>void}) {
  const {store,setStore}=useStore();const customer=store.customers.find(c=>c.id===store.clientSession);
  const [form,setForm]=useState<CustomerRegistration>(()=>({name:customer?.name||'',email:customer?.email||'',phone:customer?.phone||'',address:customer?.address||''}));
  const [error,setError]=useState('');const [saved,setSaved]=useState(false);
  if(!isClient(store)||!customer)return null;
  const dirty=(Object.keys(form) as (keyof CustomerRegistration)[]).some(key=>form[key]!==customer[key]);
  function field(key:keyof CustomerRegistration,value:string){setForm(f=>({...f,[key]:value}));setSaved(false);setError('');}
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    try{setStore(s=>updateCustomerProfile(s,form));setForm(f=>({...f,name:f.name.trim(),email:f.email.trim().toLowerCase(),address:f.address.trim()}));setSaved(true);setError('');}
    catch(err){setError((err as Error).message);setSaved(false);}
  }
  function reset(){setForm({name:customer!.name,email:customer!.email,phone:customer!.phone,address:customer!.address});setError('');setSaved(false);}
  return <main className="customer-profile site-width">
    <button className="btn-secondary" onClick={onHome}><ArrowLeft size={18}/> Volver al inicio</button>
    <p className="eyebrow mt-7">TU CUENTA · TUS DATOS</p><h1>Mi perfil</h1><p className="profile-intro">Mantén tus datos actualizados para que tu próxima compra llegue a donde necesitas.</p>
    <div className="customer-profile-grid">
      <aside className="customer-profile-summary" aria-label="Datos guardados"><div className="profile-avatar"><UserRound size={34}/></div><h2>{customer.name}</h2><p><Mail size={18}/><span>{customer.email}</span></p><p><MapPin size={18}/><span>{customer.address||'Añade tu dirección de entrega.'}</span></p><button className="btn-secondary" onClick={onOrders}>Ver mis compras</button></aside>
      <form className="customer-profile-form" onSubmit={submit}>
        <h2>Información personal</h2><div className="profile-fields">
          <label>Nombre completo<input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={e=>field('name',e.target.value)}/></label>
          <label>Correo personal<input required type="email" maxLength={150} autoComplete="email" value={form.email} onChange={e=>field('email',e.target.value)}/></label>
          <label>Teléfono móvil<input required type="tel" inputMode="numeric" pattern="3[0-9]{9}" maxLength={10} autoComplete="tel" value={form.phone} onChange={e=>field('phone',e.target.value.replace(/\D/g,''))} placeholder="3001234567" title="10 números, comenzando por 3"/></label>
          <label className="profile-address">Dirección de entrega en Barrancabermeja<textarea required minLength={8} maxLength={180} rows={3} autoComplete="street-address" value={form.address} onChange={e=>field('address',e.target.value)} placeholder="Barrio, calle y número de casa"/></label>
        </div>
        <p className="profile-hint">Si cambias el correo, úsalo en tu próximo inicio de sesión. Tu contraseña sigue siendo la misma. Los pedidos anteriores conservan sus datos de entrega.</p>
        {error&&<p className="alert" role="alert">{error}</p>}{saved&&<p className="notice" role="status"><CheckCircle2 size={21}/> Tus datos se guardaron correctamente.</p>}
        <div className="profile-actions"><button className="btn-primary" disabled={!dirty} type="submit"><Save size={19}/> Guardar cambios</button><button className="btn-secondary" disabled={!dirty} type="button" onClick={reset}>Descartar cambios</button></div>
      </form>
    </div>
  </main>;
}
