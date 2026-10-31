import { Type } from 'lucide-react';
import { updateMyProfileInApi } from '../client/session';
import { isClient } from '../domain';
import { useStore } from '../StoreContext';

export default function ClientTextButton(){
  const {store,setStore}=useStore();
  function toggle(){
    const nextLarge=!store.large;
    setStore(s=>({...s,large:nextLarge}));
    if(isClient(store)){
      void updateMyProfileInApi({textSize:nextLarge?'large':'normal'}).catch(()=>{});
    }
  }
  return <button type="button" className="icon-btn" aria-label="Texto grande" title="Ampliar o restablecer el texto" aria-pressed={store.large} onClick={toggle}><Type size={22}/></button>;
}
