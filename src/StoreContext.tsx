import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { isFisher, loadStore, STORAGE_KEY, type Store } from './domain';

interface SharedStore {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  getStore: () => Store;
  storageError: boolean;
}
const Context = createContext<SharedStore | null>(null);

export function StoreProvider({children}: {children: ReactNode}) {
  const [store, renderStore] = useState(loadStore);
  const current = useRef(store);
  const [storageError, setStorageError] = useState(false);

  // Ambas vistas consumen esta única fuente de verdad. La referencia se actualiza
  // sincrónicamente: dos acciones del mismo evento no trabajan con stock antiguo.
  // La mutación es local; no se simula un servidor ni autenticación real.
  const setStore = useCallback<Dispatch<SetStateAction<Store>>>(action => {
    const next = typeof action === 'function' ? action(current.current) : action;
    current.current = next;
    renderStore(next);
  }, []);
  const getStore = useCallback(() => current.current, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [store]);
  useEffect(() => {
    const root=document.documentElement;
    const fisher=isFisher(store);
    root.classList.toggle('large-text',fisher?store.accessibility.textSize!=='normal':store.role==='client'&&store.large);
    root.classList.toggle('extra-text',fisher&&store.accessibility.textSize==='extra');
    root.classList.remove('easy-mode','high-visibility');
  }, [store.accessibility,store.large,store.role,store.session]);

  return <Context.Provider value={{store,setStore,getStore,storageError}}>{children}</Context.Provider>;
}

export function useStore() {
  const context = useContext(Context);
  if (!context) throw new Error('El componente debe estar dentro de StoreProvider.');
  return context;
}
