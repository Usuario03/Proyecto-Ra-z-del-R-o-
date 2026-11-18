import { useCallback, useEffect, useState } from 'react';
import { Leaf, LockKeyhole, Ruler, ShieldCheck } from 'lucide-react';
import { updateEnvironmentalRuleInApi } from '../client/catalog';
import { apiRequest } from '../client/api';
import { getClientJwtToken } from '../client/session';
import type { Product } from '../domain';
import { blockReason,dateTime,isAdmin,minimumFor,MOCK_PRODUCTS,setSmallSizeSimulation,updateEnvironmentalRule } from '../domain';
import { useStore } from '../StoreContext';
import type {AdminAuditDto,AdminPage} from '../../server/contracts/admin';
import FisherManagement from './FisherManagement';
import FisherAccounts from './FisherAccounts';

type AdminTab='overview'|'fishers'|'create'|'trash'|'environment'|'audit'|'settings';
interface AdminSummary {
  fishers:{total:number;active:number;inactive:number;suspended:number;deleted:number;newLast30Days:number};
  clients:number;recentActivity:{id:string;actor:string;target:string;action:string;occurredAt:string}[];
}
const tabList:{id:AdminTab;label:string}[]=[
  {id:'overview',label:'Resumen general'},{id:'fishers',label:'Gestión de pescadores'},
  {id:'create',label:'Crear pescador'},{id:'trash',label:'Papelera de usuarios'},
  {id:'environment',label:'Gestión ambiental'},{id:'audit',label:'Actividad y auditoría'},
  {id:'settings',label:'Configuración'},
];
function SpeciesControl({species}:{species:Product}) {
  const {store,setStore,getStore,ruleVersions,refreshFromBackend}=useStore();const [minimum,setMinimum]=useState(String(minimumFor(species,store)));
  const [error,setError]=useState('');const [saved,setSaved]=useState('');
  const lots=store.products.filter(p=>p.speciesId===species.speciesId);
  async function update(changes:{minimum?:number;banned?:boolean}){
    try{
      setStore(updateEnvironmentalRule(getStore(),species.speciesId,changes));
      await updateEnvironmentalRuleInApi(species.speciesId,{...(changes.banned!==undefined?{banned:changes.banned}:{}),...(changes.minimum!==undefined?{minimumLengthCm:changes.minimum}:{}),expectedVersion:ruleVersions[species.speciesId]??1});
      await refreshFromBackend();setError('');setSaved('Cambios aplicados al catálogo, registro de capturas y checkout.');
    }catch(err){setError((err as Error).message);setSaved('');}
  }
  return <article className="admin-species"><h3>{species.name}</h3><p className="italic text-sm">{species.scientific}</p>
    <label className="toggle-row"><span><strong>Veda de {species.name}</strong><small>{store.bans[species.speciesId]?'Venta y publicación bloqueadas':'Sin veda activa en la simulación'}</small></span><input aria-label={`Veda de ${species.name}`} type="checkbox" checked={!!store.bans[species.speciesId]} onChange={e=>void update({banned:e.target.checked})}/></label>
    <form onSubmit={e=>{e.preventDefault();void update({minimum:Number(minimum)});}} className="space-y-3"><label>Talla mínima de {species.name} (cm)<input required type="number" inputMode="numeric" min={1} max={250} step={1} value={minimum} onChange={e=>{setMinimum(e.target.value);setSaved('');}}/></label><button className="btn-secondary" disabled={Number(minimum)===minimumFor(species,store)}>Guardar talla de {species.name}</button></form>
    <p>{lots.length} lotes · {lots.filter(p=>!!blockReason(p,store)).length} bloqueados por algún control.</p>
    {error&&<p role="alert" className="alert">{error}</p>}{saved&&<p role="status" className="text-sm">{saved}</p>}
  </article>;
}
function Overview(){
  const [summary,setSummary]=useState<AdminSummary|null>(null);const [error,setError]=useState('');
  const refresh=useCallback(()=>{void apiRequest<AdminSummary>('/api/admin/summary',{token:getClientJwtToken()}).then(setSummary).catch(e=>setError((e as Error).message));},[]);
  useEffect(()=>{refresh();},[refresh]);
  return <section aria-labelledby="admin-overview-title">
    <p className="eyebrow">ADMINISTRACIÓN · RESUMEN</p><h1 id="admin-overview-title">Panel de administración</h1>
    {error&&<p role="alert" className="alert">{error}</p>}
    {!summary&&!error&&<p role="status">Cargando indicadores desde la base de datos…</p>}
    {summary&&<><div className="admin-metrics admin-overview-metrics">
      <div><Leaf/><strong>{summary.fishers.total}</strong><span>Pescadores registrados</span></div>
      <div><ShieldCheck/><strong>{summary.fishers.active}</strong><span>Pescadores activos</span></div>
      <div><LockKeyhole/><strong>{summary.fishers.suspended}</strong><span>Pescadores suspendidos</span></div>
      <div><Ruler/><strong>{summary.fishers.deleted}</strong><span>Cuentas en papelera</span></div>
      <div><Leaf/><strong>{summary.fishers.newLast30Days}</strong><span>Nuevos · últimos 30 días</span></div>
      <div><ShieldCheck/><strong>{summary.clients}</strong><span>Clientes registrados</span></div>
    </div><section className="admin-test mt-8"><h2 className="font-display text-2xl">Actividad reciente</h2>
      {!summary.recentActivity.length?<p>No hay actividad administrativa registrada.</p>:<ol className="admin-history">{summary.recentActivity.map(item=><li key={item.id}><strong>{item.action}</strong><p>{item.actor} · {item.target} · {new Date(item.occurredAt).toLocaleString('es-CO')}</p></li>)}</ol>}
    </section></>}
  </section>;
}
function AuditView(){
  const [page,setPage]=useState<AdminPage<AdminAuditDto>|null>(null);const [error,setError]=useState('');
  useEffect(()=>{void apiRequest<AdminPage<AdminAuditDto>>('/api/admin/audit?page=1&pageSize=25',{token:getClientJwtToken()}).then(setPage).catch(e=>setError((e as Error).message));},[]);
  return <section><h1>Actividad y auditoría</h1><p>Registro administrativo de cuentas. No contiene contraseñas.</p>{error&&<p role="alert" className="alert">{error}</p>}
    <ol className="admin-history">{page?.items.map(entry=><li key={entry.id}><strong>{entry.action}</strong><p>{entry.actorName} · {entry.targetName} · {new Date(entry.occurredAt).toLocaleString('es-CO')}</p></li>)}</ol>
    {page&&!page.items.length&&<p>No hay acciones administrativas registradas.</p>}</section>;
}
function EnvironmentPanel(){
  const {store,setStore,ruleVersions,refreshFromBackend}=useStore();const [error,setError]=useState('');
  async function toggleSmallSize(enabled:boolean){
    try{setStore(s=>setSmallSizeSimulation(s,enabled));await updateEnvironmentalRuleInApi('bocachico',{simulatedLengthCm:enabled?22:null,expectedVersion:ruleVersions.bocachico??1});await refreshFromBackend();setError('');}
    catch(err){setError((err as Error).message);}
  }
  const banned=MOCK_PRODUCTS.filter(p=>store.bans[p.speciesId]).length;
  const blocked=store.products.filter(p=>blockReason(p,store)).length;
  return <section><p className="eyebrow">ADMINISTRACIÓN · CONTROL AMBIENTAL</p><h1>Gestión ambiental AUNAP</h1>
    <p className="text-lg mt-4">Configura los controles ambientales. Clientes y pescadores reciben la información y los bloqueos; únicamente una sesión administradora puede modificarlos.</p>
    <div className="notice mt-6"><ShieldCheck/><p>Los valores son ilustrativos. Deben verificarse contra las resoluciones vigentes; este panel no emite autorizaciones ni certificaciones AUNAP.</p></div>
    <div className="admin-metrics"><div><Leaf/><strong>{banned}</strong><span>Especies con veda</span></div><div><LockKeyhole/><strong>{blocked}</strong><span>Lotes bloqueados</span></div><div><Ruler/><strong>{MOCK_PRODUCTS.length}</strong><span>Especies con talla mínima</span></div></div>
    <section aria-labelledby="environment-rules"><h2 id="environment-rules" className="font-display text-3xl mb-5">Vedas y tallas por especie</h2><div className="admin-grid">{MOCK_PRODUCTS.map(p=><SpeciesControl key={p.id} species={p}/>)}</div></section>
    <section className="admin-test"><h2 className="font-display text-2xl">Prueba de talla insuficiente</h2><label className="toggle-row mt-4"><span><strong>Simular Bocachico de 22 cm</strong><small>Compara todos sus lotes con la talla mínima configurada.</small></span><input type="checkbox" checked={store.smallSize} onChange={e=>void toggleSmallSize(e.target.checked)}/></label>{error&&<p role="alert" className="alert">{error}</p>}</section>
    <section className="mt-8"><h2 className="font-display text-3xl mb-4">Cambios ambientales recientes</h2>{!store.environmentalChanges.length?<p>Aún no se han modificado los controles.</p>:<ol className="admin-history">{store.environmentalChanges.map(change=><li key={change.id}><strong>{change.description}</strong><p>{dateTime(change.date)} · {change.actor}</p></li>)}</ol>}</section>
  </section>;
}
export default function AdminDashboard(){
  const {store}=useStore();const [tab,setTab]=useState<AdminTab>('overview');
  if(!isAdmin(store))return <main className="site-width py-12"><p role="alert">Este apartado requiere una cuenta administradora.</p></main>;
  return <main className="admin-page site-width">
    <h1 className="sr-only">Panel de administración AUNAP</h1>
    <nav className="admin-dashboard-nav" aria-label="Secciones de administración">{tabList.map(item=><button key={item.id} type="button" aria-current={tab===item.id?'page':undefined} onClick={()=>setTab(item.id)}>{item.label}</button>)}</nav>
    {tab==='overview'&&<Overview/>}
    {tab==='fishers'&&<section><h1>Gestión de pescadores</h1><p>Las cuentas se consultan desde PostgreSQL; nunca se importan desde el navegador.</p><FisherAccounts/></section>}
    {tab==='create'&&<FisherManagement/>}
    {tab==='trash'&&<section><h1>Papelera de usuarios</h1><p>Las cuentas eliminadas lógicamente conservan pedidos, publicaciones y auditoría.</p><FisherAccounts mode="trash"/></section>}
    {tab==='environment'&&<EnvironmentPanel/>}
    {tab==='audit'&&<AuditView/>}
    {tab==='settings'&&<section><h1>Configuración de administración</h1><p>La configuración de infraestructura y secretos se gestiona en el entorno del servidor, no desde el navegador.</p><div className="notice"><ShieldCheck/><p>No se muestra ni se modifica aquí ninguna clave privada o credencial de base de datos.</p></div></section>}
  </main>;
}
