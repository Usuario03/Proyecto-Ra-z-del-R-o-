import { useState } from 'react';
import { Leaf, LockKeyhole, Ruler, ShieldCheck } from 'lucide-react';
import { updateEnvironmentalRuleInApi } from '../client/catalog';
import { blockReason, dateTime, isAdmin, minimumFor, MOCK_PRODUCTS, setSmallSizeSimulation, updateEnvironmentalRule, type Product } from '../domain';
import { useStore } from '../StoreContext';

function SpeciesControl({species}:{species:Product}) {
  const {store,setStore,getStore,ruleVersions,refreshFromBackend}=useStore();const [minimum,setMinimum]=useState(String(minimumFor(species,store)));
  const [error,setError]=useState('');const [saved,setSaved]=useState('');
  const lots=store.products.filter(p=>p.speciesId===species.speciesId);
  async function update(changes:{minimum?:number;banned?:boolean}){
    try{
      setStore(updateEnvironmentalRule(getStore(),species.speciesId,changes));
      await updateEnvironmentalRuleInApi(species.speciesId,{
        ...(changes.banned!==undefined?{banned:changes.banned}:{}),
        ...(changes.minimum!==undefined?{minimumLengthCm:changes.minimum}:{}),
        expectedVersion:ruleVersions[species.speciesId]??1,
      });
      await refreshFromBackend();
      setError('');
      setSaved('Cambios aplicados al catálogo, registro de capturas y checkout.');
    }
    catch(err){setError((err as Error).message);setSaved('');}
  }
  return <article className="admin-species"><h3>{species.name}</h3><p className="italic text-sm">{species.scientific}</p>
    <label className="toggle-row"><span><strong>Veda de {species.name}</strong><small>{store.bans[species.speciesId]?'Venta y publicación bloqueadas':'Sin veda activa en la simulación'}</small></span><input aria-label={`Veda de ${species.name}`} type="checkbox" checked={!!store.bans[species.speciesId]} onChange={e=>update({banned:e.target.checked})}/></label>
    <form onSubmit={e=>{e.preventDefault();void update({minimum:Number(minimum)});}} className="space-y-3"><label>Talla mínima de {species.name} (cm)<input required type="number" inputMode="numeric" min={1} max={250} step={1} value={minimum} onChange={e=>{setMinimum(e.target.value);setSaved('');}}/></label><button className="btn-secondary" disabled={Number(minimum)===minimumFor(species,store)}>Guardar talla de {species.name}</button></form>
    <p>{lots.length} lotes · {lots.filter(p=>!!blockReason(p,store)).length} bloqueados por algún control.</p>
    {error&&<p role="alert" className="alert">{error}</p>}{saved&&<p role="status" className="text-sm">{saved}</p>}
  </article>;
}

export default function AdminDashboard() {
  const {store,setStore,ruleVersions,refreshFromBackend}=useStore();const [error,setError]=useState('');
  // Además de proteger las funciones del dominio, esta vista no renderiza
  // controles si se monta por error sin la sesión administrativa correspondiente.
  if(!isAdmin(store))return <main className="site-width py-12"><p role="alert">Este apartado requiere una cuenta administradora.</p></main>;
  const banned=MOCK_PRODUCTS.filter(p=>store.bans[p.speciesId]).length;
  const blocked=store.products.filter(p=>blockReason(p,store)).length;
  async function toggleSmallSize(enabled:boolean){
    try{
      setStore(s=>setSmallSizeSimulation(s,enabled));
      await updateEnvironmentalRuleInApi('bocachico',{
        simulatedLengthCm:enabled?22:28,
        expectedVersion:ruleVersions.bocachico??1,
      });
      await refreshFromBackend();
      setError('');
    }catch(err){setError((err as Error).message);}
  }
  return <main className="admin-page site-width">
    <p className="eyebrow">ADMINISTRACIÓN · CONTROL AMBIENTAL</p><h1>Gestión ambiental AUNAP</h1>
    <p className="text-lg mt-4">Configura las restricciones de demostración. Clientes y pescadores reciben la información y los bloqueos; únicamente esta cuenta puede modificar los controles.</p>
    <div className="notice mt-6"><ShieldCheck/><p>Los valores de esta aplicación son ilustrativos. En una operación real deben corresponder a las resoluciones vigentes por especie, cuenca y temporada; este panel no emite autorizaciones ni certificaciones AUNAP.</p></div>
    <div className="admin-metrics"><div><Leaf/><strong>{banned}</strong><span>Especies con veda simulada</span></div><div><LockKeyhole/><strong>{blocked}</strong><span>Lotes bloqueados actualmente</span></div><div><Ruler/><strong>{MOCK_PRODUCTS.length}</strong><span>Especies con control de talla</span></div></div>
    <section aria-labelledby="environment-rules"><h2 id="environment-rules" className="font-display text-3xl mb-5">Vedas y tallas por especie</h2><div className="admin-grid">{MOCK_PRODUCTS.map(p=><SpeciesControl key={p.id} species={p}/>)}</div></section>
    <section className="admin-test"><h2 className="font-display text-2xl">Prueba de talla insuficiente</h2><label className="toggle-row mt-4"><span><strong>Simular Bocachico de 22 cm</strong><small>Compara todos sus lotes con la talla mínima configurada. Desactívalo para usar la talla registrada en cada captura.</small></span><input type="checkbox" checked={store.smallSize} onChange={e=>void toggleSmallSize(e.target.checked)}/></label>{error&&<p role="alert" className="alert">{error}</p>}</section>
    <section className="mt-8"><h2 className="font-display text-3xl mb-4">Cambios recientes</h2>{!store.environmentalChanges.length?<p>Aún no se han modificado los controles desde este panel.</p>:<ol className="admin-history">{store.environmentalChanges.map(change=><li key={change.id}><strong>{change.description}</strong><p>{dateTime(change.date)} · {change.actor}</p></li>)}</ol>}</section>
  </main>;
}
