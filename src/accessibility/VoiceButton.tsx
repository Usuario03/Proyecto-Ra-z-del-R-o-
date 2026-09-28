import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, X } from 'lucide-react';
import { useStore } from '../StoreContext';

export default function VoiceButton({text,label='Escuchar ayuda'}:{text:string;label?:string}) {
  const {store}=useStore();const [open,setOpen]=useState(false);const [status,setStatus]=useState('');
  const id=useId();const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;setOpen(false);return()=>{mounted.current=false;if('speechSynthesis' in window)window.speechSynthesis.cancel();};},[text]);
  if(!store.accessibility.readInstructions)return null;
  function speak(){
    setOpen(true);
    if(!('speechSynthesis' in window)){setStatus('Puedes leer la instrucción aquí. Este navegador no tiene lectura de voz.');return;}
    const voice=window.speechSynthesis.getVoices().find(v=>v.localService&&v.lang.startsWith('es'));
    if(!voice){setStatus('No hay una voz local en español disponible. La instrucción está escrita debajo.');return;}
    const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.85;
    utterance.onerror=()=>{if(mounted.current)setStatus('La lectura se interrumpió. Puedes leer la instrucción aquí.');};
    window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);setStatus('Escuchando la instrucción.');
  }
  // El texto vive en una tarjeta fija, fuera del flujo. Repetir el clic no añade
  // alturas al encabezado ni mueve controles, foco o posición de desplazamiento.
  return <><button type="button" className="fisher-secondary voice-trigger" aria-expanded={open} aria-controls={open?id:undefined} onClick={speak}><Volume2/>{label}</button>
    {open&&createPortal(<aside id={id} className="voice-instruction" aria-label="Instrucción escrita"><div className="flex items-start justify-between gap-3"><strong>Ayuda para este paso</strong><button type="button" aria-label="Cerrar instrucción" className="icon-btn" onClick={()=>{setOpen(false);if('speechSynthesis' in window)window.speechSynthesis.cancel();}}><X/></button></div><p>{text}</p><p className="text-sm mt-3" role="status">{status}</p></aside>,document.body)}
  </>;
}
