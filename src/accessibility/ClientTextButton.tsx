import { Type } from 'lucide-react';
import { useStore } from '../StoreContext';

export default function ClientTextButton(){
  const {store,setStore}=useStore();
  return <button type="button" className="icon-btn" aria-label="Texto grande" title="Ampliar o restablecer el texto" aria-pressed={store.large} onClick={()=>setStore(s=>({...s,large:!s.large}))}><Type size={22}/></button>;
}
