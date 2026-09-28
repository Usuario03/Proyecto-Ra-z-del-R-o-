import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../StoreContext';
import VoiceButton from './VoiceButton';
import { isFisher } from '../domain';

export default function ActionFeedback({title,text,error=false}:{title:string;text:string;error?:boolean}) {
  const {store}=useStore();const played=useRef('');
  useEffect(()=>{
    const key=title+text;if(!isFisher(store)||!store.accessibility.readInstructions||played.current===key)return;played.current=key;
    // Tono breve generado en el dispositivo, sin descargar archivos de audio.
    try{
      const audio=new AudioContext();const oscillator=audio.createOscillator();const gain=audio.createGain();
      oscillator.connect(gain);gain.connect(audio.destination);oscillator.frequency.value=error?260:660;gain.gain.value=.025;
      oscillator.onended=()=>{void audio.close();};oscillator.start();oscillator.stop(audio.currentTime+.12);
    }catch{/* La confirmación visual y el botón de lectura siguen disponibles. */}
  },[title,text,error,store.accessibility.readInstructions,store.role,store.session]);
  return <section className={`action-feedback ${error?'feedback-error':'feedback-success'}`}>
    <div role={error?'alert':'status'} className="flex gap-3 items-start">{error?<AlertTriangle size={28}/>:<CheckCircle2 size={28}/>}<div><h3>{title}</h3><p>{text}</p></div></div>
    {isFisher(store)&&<VoiceButton text={`${title}. ${text}`} label={error?'Escuchar explicación':'Escuchar confirmación'}/>}
  </section>;
}
