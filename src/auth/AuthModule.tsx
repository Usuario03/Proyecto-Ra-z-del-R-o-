import { useState } from 'react';
import { ArrowLeft, Fish, Leaf, Waves } from 'lucide-react';
import ClientAccess from './ClientAccess';
import ClientTextButton from '../accessibility/ClientTextButton';

export default function AuthModule({onAuthenticated,onBack}:{onAuthenticated:()=>void;onBack:()=>void}) {
  const [register,setRegister]=useState(false);
  const [forcePasswordChange,setForcePasswordChange]=useState(false);
  return <main className="auth-page">
    <header className="auth-header"><a href="#inicio" onClick={e=>{e.preventDefault();onBack();}} className="brand"><Waves size={34}/><span>Raíz del Río<small>PESCA ARTESANAL · BARRANCABERMEJA</small></span></a><ClientTextButton/></header>
    <div className="auth-back"><button className="btn-secondary" onClick={onBack}><ArrowLeft size={19}/> Volver al inicio</button></div>
    <div className="auth-layout" id="auth">
      <aside className="auth-story"><span className="eyebrow">UNA COMUNIDAD, DOS ORILLAS</span><h1>Nos une el río.<br/><em>Nos acerca tu confianza.</em></h1><p>Compra directamente a las familias pescadoras y conoce el trabajo que nos acerca al Magdalena.</p><div className="auth-story-fish" aria-hidden="true"><Fish size={90}/><Waves size={110}/></div><div className="auth-story-promise"><Leaf/><span>Comercio justo, origen transparente y respeto por la vida del Magdalena.</span></div></aside>
      <section className="auth-card" aria-label="Acceso a Raíz del Río">
        <div className="auth-card-body">
          <ClientAccess key={String(register)} register={register} forcePasswordChange={forcePasswordChange}
            onPasswordChangeRequired={()=>setForcePasswordChange(true)}
            onPasswordChangeComplete={()=>setForcePasswordChange(false)} onSuccess={onAuthenticated}/>
          {!forcePasswordChange&&<a className="inline-block mt-6 underline" href={register?'#iniciar-sesion':'#crear-cuenta'} onClick={e=>{e.preventDefault();setRegister(!register);}}>{register?'¿Ya tienes una cuenta? Inicia sesión':'¿No tienes una cuenta? Crear cuenta'}</a>}
        </div>
      </section>
    </div>
    <footer className="auth-footer">Investigación aplicada · Ingeniería de Sistemas · Universidad de Investigación y Desarrollo — UDI</footer>
  </main>;
}
