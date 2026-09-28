import { useEffect, useRef } from 'react';
import { ChevronDown, Fish, LogOut, ReceiptText, ShieldCheck, ShoppingBasket, UserRound, Waves } from 'lucide-react';
import { useStore } from './StoreContext';
import { ADMIN_ACCOUNT, canShop, cartWeight, formatKg, isAdmin, isClient, isFisher } from './domain';
import ClientTextButton from './accessibility/ClientTextButton';

interface HeaderProps {
  onHome:(anchor?:string)=>void;
  onAuth:(role?:'client'|'fisher')=>void;
  onFisher:()=>void; onOrders:()=>void; onProfile:()=>void; onAdmin:()=>void; onCart:()=>void; onSignOut:()=>void;
  activeSection?:string|null;
}

export default function SiteHeader({onHome,onAuth,onFisher,onOrders,onProfile,onAdmin,onCart,onSignOut,activeSection}:HeaderProps) {
  const {store}=useStore();const menu=useRef<HTMLDetailsElement>(null);
  const customer=store.customers.find(c=>c.id===store.clientSession);
  const fisher=store.fishermen.find(f=>f.id===store.session);
  const account=isAdmin(store)?ADMIN_ACCOUNT:isFisher(store)?fisher:isClient(store)?customer:undefined;
  const count=formatKg(cartWeight(store));
  function closeMenu(){if(menu.current){menu.current.open=false;menu.current.querySelector('summary')?.focus();}}
  function action(callback:()=>void){closeMenu();callback();}
  useEffect(()=>{
    const outside=(e:PointerEvent)=>{if(menu.current?.open&&!menu.current.contains(e.target as Node))menu.current.open=false;};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&menu.current?.open)closeMenu();};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[]);
  return <header className="site-header print:hidden">
    <a href="#inicio" onClick={e=>{e.preventDefault();onHome();}} aria-label="Raíz del Río, inicio" className="brand"><span className="brand-mark"><Fish size={25}/><Waves size={23}/></span><span>Raíz del Río<small>PESCA ARTESANAL · BARRANCABERMEJA</small></span></a>
    <nav aria-label="Navegación principal" className="site-nav">
      <a href="#inicio" aria-current={activeSection==='inicio'?'page':undefined} onClick={e=>{e.preventDefault();onHome();}}>Inicio</a>
      {[['catalogo','Pesca del día'],['como-funciona','Cómo funciona'],['comunidad','Nuestra comunidad']].map(([id,label])=><a key={id} href={`#${id}`} onClick={e=>{e.preventDefault();onHome(id);}}>{label}</a>)}
    </nav>
    <div className="site-actions">
      {canShop(store)&&<ClientTextButton/>}
      {canShop(store)&&<button className="basket-btn" aria-label={`Mi canasta, ${count} kg`} onClick={onCart}><ShoppingBasket size={22}/><span className="hidden xl:inline">Mi canasta</span><span className="basket-count">{count}</span></button>}
      {account?<details ref={menu} className="account-menu"><summary aria-label="Mi cuenta"><UserRound size={21}/><span className="hidden md:inline">Mi cuenta</span><ChevronDown size={15}/></summary><div className="account-panel">
        <div className="account-identity"><strong>{account.name}</strong><span>{account.email}</span></div>
        {isClient(store)&&<button onClick={()=>action(onOrders)}><ReceiptText size={19}/> Mis compras ({store.orders.filter(o=>o.clientId===store.clientSession).length})</button>}
        {isClient(store)&&<button onClick={()=>action(onProfile)}><UserRound size={19}/> Mi perfil</button>}
        {isFisher(store)&&<button onClick={()=>action(onFisher)}><Fish size={19}/> Mi panel de pesca</button>}
        {isAdmin(store)&&<button onClick={()=>action(onAdmin)}><ShieldCheck size={19}/> Administración ambiental</button>}
        <button onClick={()=>action(onSignOut)}><LogOut size={19}/> Cerrar sesión</button>
      </div></details>:<button className="header-login" aria-label="Iniciar sesión" onClick={()=>onAuth('client')}><UserRound size={20}/><span className="hidden sm:inline">Iniciar sesión</span><span className="sm:hidden">Entrar</span></button>}
    </div>
  </header>;
}
