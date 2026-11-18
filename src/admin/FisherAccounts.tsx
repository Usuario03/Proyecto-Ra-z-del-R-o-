import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../client/api';
import { getClientJwtToken } from '../client/session';
import type { AccountStatus, AdminFisherDto, AdminPage } from '../../server/contracts/admin';

const empty:AdminPage<AdminFisherDto>={items:[],page:1,pageSize:25,total:0,pages:0};
const statusName:Record<AccountStatus,string>={active:'Activo',inactive:'Inactivo',suspended:'Suspendido',deleted:'Eliminado'};
type Mode='active'|'trash';

export default function FisherAccounts({mode='active'}:{mode?:Mode}){
  const [pageData,setPageData]=useState(empty);const [page,setPage]=useState(1);
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [document,setDocument]=useState('');
  const [query,setQuery]=useState('');const [status,setStatus]=useState('');
  const [port,setPort]=useState('');const [createdFrom,setCreatedFrom]=useState('');const [createdTo,setCreatedTo]=useState('');
  const [selected,setSelected]=useState<AdminFisherDto|null>(null);const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({name:'',email:'',document:'',nickname:'',port:''});
  const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const load=useCallback(async()=>{
    const params=new URLSearchParams({page:String(page),pageSize:'25'});
    if(name.trim())params.set('name',name.trim());if(email.trim())params.set('email',email.trim());if(document.trim())params.set('document',document.trim());
    if(query.trim())params.set('q',query.trim());if(mode==='active'&&status)params.set('status',status);
    if(port)params.set('port',port);if(createdFrom)params.set('createdFrom',createdFrom);if(createdTo)params.set('createdTo',createdTo);
    const endpoint=mode==='trash'?'/api/admin/trash':'/api/admin/fishers';
    const result=await apiRequest<AdminPage<AdminFisherDto>>(`${endpoint}?${params}`,{token:getClientJwtToken()});
    setPageData(result);
  },[page,name,email,document,query,status,port,createdFrom,createdTo,mode]);
  const refresh=useCallback(()=>{setError('');void load().catch(err=>setError((err as Error).message));},[load]);
  useEffect(()=>{refresh();},[refresh]);
  function choose(item:AdminFisherDto){setSelected(item);setEditing(false);setForm({name:item.name,email:item.email,document:item.document,nickname:item.nickname,port:item.port});setPassword('');setNotice('');}
  async function mutate(action:()=>Promise<unknown>,message:string){
    setBusy(true);setError('');setNotice('');
    try{await action();setNotice(message);setSelected(null);setPassword('');refresh();}
    catch(err){setError((err as Error).message);}
    finally{setBusy(false);}
  }
  async function saveEdit(event:FormEvent){
    event.preventDefault();if(!selected)return;
    await mutate(()=>apiRequest(`/api/admin/fishers/${selected.userId}`,{method:'PATCH',token:getClientJwtToken(),body:form}),'Los datos del pescador fueron actualizados.');
  }
  async function savePassword(event:FormEvent){
    event.preventDefault();if(!selected)return;
    if(password.length<8){setError('La contraseña temporal debe tener al menos 8 caracteres.');return;}
    await mutate(()=>apiRequest(`/api/admin/fishers/${selected.userId}/password-reset`,{method:'POST',token:getClientJwtToken(),body:{password}}),'Contraseña restablecida. Entrégala al pescador por un canal privado; deberá cambiarla al ingresar.');
  }
  const actionStatus=async(item:AdminFisherDto,next:'active'|'inactive'|'suspended')=>{
    if(!window.confirm(`${next==='suspended'?'Suspender':next==='inactive'?'Desactivar':'Reactivar'} la cuenta de ${item.name}?`))return;
    await mutate(()=>apiRequest(`/api/admin/fishers/${item.userId}/status`,{method:'POST',token:getClientJwtToken(),body:{status:next}}),`Cuenta ${statusName[next].toLowerCase()}.`);
  };
  async function softDelete(item:AdminFisherDto){
    if(!window.confirm(`Enviar a la papelera la cuenta de ${item.name}? Se conservarán sus pedidos, publicaciones e historial.`))return;
    await mutate(()=>apiRequest(`/api/admin/fishers/${item.userId}/delete`,{method:'POST',token:getClientJwtToken(),body:{confirm:true}}),'La cuenta fue enviada a la papelera; su historial se conserva.');
  }
  async function restore(item:AdminFisherDto){
    if(password.length<8){setError('Establece una contraseña temporal de al menos 8 caracteres para restaurar.');return;}
    await mutate(()=>apiRequest(`/api/admin/fishers/${item.userId}/restore`,{method:'POST',token:getClientJwtToken(),body:{password}}),'Cuenta restaurada. Entrégale la contraseña temporal por un canal privado.');
  }
  return <section className="admin-user-management">
    <div className="admin-fisher-filters">
      <label>Nombre<input type="search" value={name} maxLength={120} onChange={e=>{setName(e.target.value);setPage(1);}} placeholder="Buscar nombre"/></label>
      <label>Correo electrónico<input type="search" value={email} maxLength={150} onChange={e=>{setEmail(e.target.value);setPage(1);}} placeholder="Buscar correo"/></label>
      <label>Documento<input type="search" inputMode="numeric" value={document} maxLength={12} onChange={e=>{setDocument(e.target.value.replace(/\D/g,''));setPage(1);}} placeholder="Buscar documento"/></label>
      {mode==='active'&&<label>Estado<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">Todos los activos</option>{(['active','inactive','suspended'] as const).map(s=><option key={s} value={s}>{statusName[s]}</option>)}</select></label>}
      <label>Zona<select value={port} onChange={e=>{setPort(e.target.value);setPage(1);}}><option value="">Todas las zonas</option>{['Muelle de Barrancabermeja','La Rampa','Corregimiento El Llanito'].map(p=><option key={p}>{p}</option>)}</select></label>
      <label>Registro desde<input type="date" value={createdFrom} onChange={e=>{setCreatedFrom(e.target.value);setPage(1);}}/></label>
      <label>Registro hasta<input type="date" value={createdTo} onChange={e=>{setCreatedTo(e.target.value);setPage(1);}}/></label>
    </div>
    {error&&<p role="alert" className="alert">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
    <div className="admin-table-wrap"><table className="admin-fisher-table">
      <thead><tr><th>Nombre</th><th>Correo</th><th>Documento</th><th>Apodo</th><th>Zona</th><th>Creación</th><th>Último acceso</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>{pageData.items.map(item=><tr key={item.userId}>
        <td data-label="Nombre">{item.name}</td><td data-label="Correo">{item.email}</td><td data-label="Documento">{item.document||'—'}</td>
        <td data-label="Apodo">{item.nickname||'—'}</td><td data-label="Zona">{item.port}</td>
        <td data-label="Creación">{new Date(item.createdAt).toLocaleDateString('es-CO')}</td>
        <td data-label="Último acceso">{item.lastLoginAt?new Date(item.lastLoginAt).toLocaleString('es-CO'):'No disponible'}</td>
        <td data-label="Estado"><span className={`admin-status status-${item.status}`}>{statusName[item.status]}</span>{item.deletedAt&&<small className="block">Baja: {new Date(item.deletedAt).toLocaleString('es-CO')} · {item.deletedByName||'—'}</small>}</td>
        <td data-label="Acciones"><div className="admin-fisher-actions">
          <button className="btn-secondary" onClick={()=>choose(item)}>Ver perfil</button>
          {mode==='active'?<><button className="btn-secondary" onClick={()=>{choose(item);setEditing(true);}}>Editar</button>
            {item.status==='suspended'||item.status==='inactive'?<button className="btn-secondary" onClick={()=>void actionStatus(item,'active')}>Reactivar</button>:<><button className="btn-secondary" onClick={()=>void actionStatus(item,'suspended')}>Suspender</button><button className="btn-secondary" onClick={()=>void actionStatus(item,'inactive')}>Desactivar</button></>}
            <button className="btn-secondary" onClick={()=>{choose(item);setNotice('');}}>Restablecer clave</button><button className="btn-secondary" onClick={()=>void softDelete(item)}>Eliminar</button></>
            :<button className="btn-primary" onClick={()=>choose(item)}>Restaurar</button>}
        </div></td>
      </tr>)}</tbody>
    </table></div>
    {!pageData.items.length&&<p className="py-6">No hay cuentas que coincidan con la búsqueda.</p>}
    <div className="flex items-center justify-between gap-3 py-4"><span>{pageData.total} cuentas · página {pageData.page} de {Math.max(1,pageData.pages)}</span><div className="flex gap-2"><button className="btn-secondary" disabled={page<=1||busy} onClick={()=>setPage(p=>p-1)}>Anterior</button><button className="btn-secondary" disabled={page>=pageData.pages||busy} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div></div>
    {selected&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget){setSelected(null);setEditing(false);}}}>
      <section className="modal admin-fisher-dialog" role="dialog" aria-modal="true" aria-labelledby="fisher-detail-title">
        <header className="flex items-start justify-between gap-4"><div><h2 id="fisher-detail-title" className="font-display text-2xl">{editing?'Editar pescador':mode==='trash'?'Restaurar pescador':'Perfil de pescador'}</h2><p>{selected.name} · {statusName[selected.status]}</p></div><button className="btn-secondary" onClick={()=>{setSelected(null);setEditing(false);}}>Cerrar</button></header>
        {editing?<form className="grid gap-4 mt-5 sm:grid-cols-2" onSubmit={saveEdit}>
          <label>Nombre completo<input required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>Correo<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>Documento<input required pattern="[0-9]{6,12}" value={form.document} onChange={e=>setForm({...form,document:e.target.value})}/></label>
          <label>Apodo<input required minLength={2} maxLength={80} value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})}/></label>
          <label>Puerto/zona<select value={form.port} onChange={e=>setForm({...form,port:e.target.value})}>{['Muelle de Barrancabermeja','La Rampa','Corregimiento El Llanito'].map(p=><option key={p}>{p}</option>)}</select></label>
          <button className="btn-primary sm:col-span-2" disabled={busy}>Guardar cambios</button>
        </form>:<dl className="admin-fisher-profile mt-5">
          <dt>Correo</dt><dd>{selected.email}</dd><dt>Documento</dt><dd>{selected.document||'—'}</dd><dt>Apodo</dt><dd>{selected.nickname||'—'}</dd><dt>Puerto/zona</dt><dd>{selected.port}</dd><dt>Creación</dt><dd>{new Date(selected.createdAt).toLocaleString('es-CO')}</dd><dt>Último acceso</dt><dd>{selected.lastLoginAt?new Date(selected.lastLoginAt).toLocaleString('es-CO'):'No disponible'}</dd>
          {selected.deletedAt&&<><dt>Eliminación lógica</dt><dd>{new Date(selected.deletedAt).toLocaleString('es-CO')}</dd><dt>Administrador</dt><dd>{selected.deletedByName||'No disponible'}</dd></>}
        </dl>}
        {(mode==='trash'||(!editing&&mode==='active'))&&<form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={mode==='trash'?e=>{e.preventDefault();void restore(selected);}:savePassword}>
          <label>Contraseña temporal<input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>
          <button className="btn-primary" disabled={busy}>{mode==='trash'?'Restaurar y establecer clave':'Restablecer contraseña'}</button>
        </form>}
      </section>
    </div>}
  </section>;
}
