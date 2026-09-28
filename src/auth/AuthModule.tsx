import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Fish, Leaf, ShieldCheck, ShoppingBasket, Waves } from 'lucide-react';
import FisherLogin from '../fisher/FisherLogin';
import ClientAccess from './ClientAccess';
import FisherRegistration from './FisherRegistration';
import AdminAccess from './AdminAccess';
import type { UserRole } from '../domain';
import ClientTextButton from '../accessibility/ClientTextButton';

export default function AuthModule({initialRole='client',onAuthenticated,onBack}:{initialRole?:UserRole;onAuthenticated:()=>void;onBack:()=>void}) {
  const [tab,setTab]=useState<'login'|'register'>('login');const [role,setRole]=useState(initialRole);
  const tabs=useRef<Array<HTMLButtonElement|null>>([]);
  function keyboard(e:KeyboardEvent<HTMLButtonElement>){
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:tab==='login'?1:0;
    setTab(next===0?'login':'register');if(next===1&&role==='admin')setRole('client');tabs.current[next]?.focus();
  }
  return <main className="auth-page">
    <header className="auth-header"><a href="#inicio" onClick={e=>{e.preventDefault();onBack();}} className="brand"><Waves size={34}/><span>Raíz del Río<small>PESCA ARTESANAL · BARRANCABERMEJA</small></span></a>{role==='client'&&<ClientTextButton/>}</header>
    <div className="auth-back"><button className="btn-secondary" onClick={onBack}><ArrowLeft size={19}/> Volver al inicio</button></div>
    <div className="auth-layout" id="auth">
      <aside className="auth-story"><span className="eyebrow">UNA COMUNIDAD, DOS ORILLAS</span><h1>Nos une el río.<br/><em>Nos acerca tu confianza.</em></h1><p>Compra directamente a las familias pescadoras o comparte tu captura con quienes valoran tu trabajo.</p><div className="auth-story-fish" aria-hidden="true"><Fish size={90}/><Waves size={110}/></div><div className="auth-story-promise"><Leaf/><span>Comercio justo, origen transparente y respeto por la vida del Magdalena.</span></div></aside>
      <section className="auth-card" aria-label="Acceso a Raíz del Río">
        <div className="auth-tabs" role="tablist" aria-label="Inicio de sesión o registro">
          {([{id:'login',label:'Inicio de Sesión'},{id:'register',label:'Registro de Usuario'}] as const).map((item,index)=><button key={item.id} ref={el=>{tabs.current[index]=el;}} type="button" id={`auth-tab-${item.id}`} role="tab" aria-selected={tab===item.id} aria-controls={`auth-panel-${item.id}`} tabIndex={tab===item.id?0:-1} onKeyDown={keyboard} onClick={()=>{setTab(item.id);if(item.id==='register'&&role==='admin')setRole('client');}}>{item.label}</button>)}
        </div>
        <div className="auth-card-body" role="tabpanel" id={`auth-panel-${tab}`} aria-labelledby={`auth-tab-${tab}`}>
          <p className="text-sm font-bold mb-3">{tab==='login'?'¿Cómo quieres entrar?':'¿Qué tipo de cuenta necesitas?'}</p>
          <div className="auth-role-options"><button type="button" aria-pressed={role==='client'} onClick={()=>setRole('client')}><ShoppingBasket/><span>Cliente / Comprador<small>Correo personal y contraseña</small></span></button><button type="button" aria-pressed={role==='fisher'} onClick={()=>setRole('fisher')}><Fish/><span>Pescador Artesanal<small>FEDEPESAN · acceso inclusivo</small></span></button></div>
          {tab==='login'&&<button className="admin-access-link" aria-pressed={role==='admin'} onClick={()=>setRole('admin')}><ShieldCheck size={19}/> Administración</button>}
          <div key={`${role}-${tab}`} className="mt-7">
            {role==='admin'?<AdminAccess onSuccess={onAuthenticated}/>:role==='client'?<ClientAccess register={tab==='register'} onSuccess={onAuthenticated}/>:tab==='login'?<FisherLogin onSuccess={onAuthenticated}/>:<FisherRegistration onSuccess={onAuthenticated}/>}
          </div>
          <p className="auth-local-note">Tus datos se guardan en este navegador. Usa información de prueba para la evaluación; no se envían correos ni se conecta con entidades externas.</p>
        </div>
      </section>
    </div>
    <footer className="auth-footer">Investigación aplicada · Ingeniería de Sistemas · Universidad de Investigación y Desarrollo — UDI</footer>
  </main>;
}
