import { useEffect, useLayoutEffect, useState } from 'react';
import { StoreProvider, useStore } from './StoreContext';
import PlataformaPescaFrontend from './PlataformaPescaFrontend';
import FisherPortal from './fisher/FisherPortal';
import CustomerDashboard from './buyer/CustomerDashboard';
import CustomerProfile from './buyer/CustomerProfile';
import AdminDashboard from './admin/AdminDashboard';
import AuthModule from './auth/AuthModule';
import { signOut } from './auth/authDomain';
import SiteHeader from './SiteHeader';
import { CartDialog } from './buyer/BuyerDialogs';
import Checkout from './Checkout';
import { removeCartLineInApi, setCartLineInApi } from './client/cart';
import { logoutFromApi } from './client/session';
import { canShop, changeCartQuantity, isAdmin, isClient, isFisher, quantityLabel, type Product, type UserRole } from './domain';

function DualViews() {
  const {store,setStore,getStore,setCartVersion}=useStore();
  // La navegación es independiente de la sesión: cualquier visita empieza en
  // el inicio público, aunque haya un perfil recordado en el navegador.
  const [screen,setScreen]=useState<'home'|'auth'|'fisher'|'admin'|'customer'|'profile'>('home');
  const [pending,setPending]=useState<'checkout'|'orders'|null>(null);
  const [overlay,setOverlay]=useState<'cart'|'checkout'|null>(null);
  const [anchor,setAnchor]=useState('inicio');const [toast,setToast]=useState('');
  const fisher=store.fishermen.find(f=>f.id===store.session);
  useLayoutEffect(()=>{if(screen==='home')document.getElementById(anchor)?.scrollIntoView({behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});},[screen,anchor]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(timer);},[toast]);

  function home(target='inicio'){setOverlay(null);setScreen('home');setAnchor(target);if(screen==='home')document.getElementById(target)?.scrollIntoView({behavior:'smooth'});}
  function auth(_role:UserRole='client',next:'checkout'|'orders'|null=null){setOverlay(null);setPending(next);setScreen('auth');}
  function authenticated(){
    const s=getStore();
    if(isAdmin(s)){setScreen('admin');setOverlay(null);}
    else if(isFisher(s)){setScreen('fisher');setOverlay(null);}
    else {setScreen(pending==='orders'?'customer':'home');setAnchor('inicio');setOverlay(pending==='checkout'?'checkout':null);}
    setPending(null);
  }
  function changeQty(product:Product,delta:number){
    try{
      const next=changeCartQuantity(getStore(),product.id,delta);
      setStore(next);
      const nextQty=next.cart[product.id]||0;
      if(delta>0)setToast(`${product.name}: ${quantityLabel(product,nextQty)} en tu canasta.`);
      if(isClient(next)){
        const syncPromise=nextQty>0?setCartLineInApi(product.id,{quantity:nextQty}):removeCartLineInApi(product.id);
        void syncPromise.then(dto=>setCartVersion(dto.version)).catch(err=>setToast((err as Error).message));
      }
    }
    catch(err){setToast((err as Error).message);}
  }
  function checkout(){if(isClient(store))setOverlay('checkout');else if(canShop(store))auth('client','checkout');}
  function orders(){if(isClient(store)){setScreen('customer');setOverlay(null);}}
  const registration=store.registrationNotice;
  const registeredCustomer=registration?.role==='client'&&screen==='home'?store.customers.find(c=>c.id===registration.id):undefined;
  return <>
    {screen==='auth'?<AuthModule onAuthenticated={authenticated} onBack={()=>{setPending(null);home();}}/>:<>
      <SiteHeader activeSection={screen==='home'?anchor:null} onHome={home} onAuth={auth} onFisher={()=>{if(isFisher(store)){setScreen('fisher');setOverlay(null);}}} onOrders={orders} onProfile={()=>{if(isClient(store)){setScreen('profile');setOverlay(null);}}} onAdmin={()=>{if(isAdmin(store)){setScreen('admin');setOverlay(null);}}} onCart={()=>{if(canShop(store))setOverlay('cart');}} onSignOut={()=>{void logoutFromApi().catch(()=>{});setStore(signOut);setPending(null);home();}}/>
      {registeredCustomer&&<section className="registration-success print:hidden" role="status"><div><h2 className="text-2xl font-bold">¡Tu cuenta está lista!</h2><p>Usaremos tus datos registrados para completar la entrega de tu próxima compra.</p></div><button className="btn-secondary" onClick={()=>setStore(s=>({...s,registrationNotice:null}))}>Entendido</button></section>}
      {screen==='profile'&&isClient(store)?<CustomerProfile onHome={()=>home()} onOrders={orders}/>:screen==='customer'&&isClient(store)?<CustomerDashboard onBrowse={()=>home('catalogo')}/>:screen==='admin'&&isAdmin(store)?<AdminDashboard/>:screen==='fisher'&&fisher&&isFisher(store)?<FisherPortal onShop={()=>home('catalogo')}/>:<PlataformaPescaFrontend onQuantity={changeQty}/>}
    </>}
    {overlay==='cart'&&canShop(store)&&<CartDialog onClose={()=>setOverlay(null)} onQuantity={changeQty} onCheckout={checkout}/>}
    {overlay==='checkout'&&isClient(store)&&<Checkout onClose={()=>setOverlay(null)}/>}
    <div aria-live="polite" role="status" className={toast?'toast':'sr-only'}>{toast}</div>
  </>;
}

export default function PlataformaPescaDual() {
  return <StoreProvider><DualViews/></StoreProvider>;
}
