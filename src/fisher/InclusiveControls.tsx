import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Minus, Plus } from 'lucide-react';
export { default as VoiceButton } from '../accessibility/VoiceButton';

export function Stepper({label,value,onChange,min=0,max=500,unit='kg',step=1}:{label:string;value:number;onChange:(v:number)=>void;min?:number;max?:number;unit?:string;step?:number}) {
  // El borrador del campo permite borrar y escribir varios dígitos sin que el
  // mínimo reemplace el texto a mitad de la escritura. +/- y teclado se sincronizan.
  const [text,setText]=useState(String(value));
  useEffect(()=>setText(String(value)),[value]);
  function commit(next:number){const bounded=Math.max(min,Math.min(max,Math.floor(next)));setText(String(bounded));onChange(bounded);}
  return <div className="inclusive-stepper"><p className="font-bold text-xl">{label}</p><div className="stepper-controls flex items-center justify-center gap-3 mt-3">
    <button type="button" aria-label={`Disminuir ${label}`} disabled={value<=min} onClick={()=>commit(value-step)}><Minus size={28}/></button>
    <label className="text-center"><span className="sr-only">{label}</span><input type="number" inputMode="numeric" min={min} max={max} step={1} value={text} onChange={e=>{const raw=e.target.value;setText(raw);const n=Number(raw);if(raw!==''&&Number.isInteger(n)&&n>=min&&n<=max)onChange(n);}} onBlur={()=>commit(text===''?value:Number(text))}/><span>{unit}</span></label>
    <button type="button" aria-label={`Aumentar ${label}`} disabled={value>=max} onClick={()=>commit(value+step)}><Plus size={28}/></button>
  </div><p className="stepper-hint">Escribe la cantidad en el recuadro o usa − y +.</p></div>;
}

// FileReader + canvas funcionan localmente. Reducimos las fotografías antes de
// persistir para no llenar localStorage con imágenes originales de varios MB.
async function compressPhoto(file:File,profile:boolean):Promise<string> {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024) throw new Error('Elige una foto JPG, PNG o WebP de menos de 8 MB.');
  const source=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No pudimos leer esa foto. Intenta con otra.'));reader.readAsDataURL(file);});
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('La foto no se pudo abrir. Elige otra imagen.'));img.src=source;});
  if(image.width<120||image.height<90)throw new Error('Esa imagen es muy pequeña. Usa una foto donde se vea el pescado con claridad.');
  const canvas=document.createElement('canvas');canvas.width=profile?640:960;canvas.height=profile?640:720;
  const scale=Math.min(canvas.width/image.width,canvas.height/image.height);
  const width=image.width*scale,height=image.height*scale;
  const context=canvas.getContext('2d');if(!context)throw new Error('No pudimos preparar la foto en este equipo.');
  // Ajuste proporcional, centrado y sin recortar el pescado. La vista previa y
  // el catálogo comparten un marco 4:3, sin estirar la imagen ni ocultar extremos.
  context.fillStyle='#f8f7f2';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
  let result=canvas.toDataURL('image/jpeg',.78);
  if(result.length>=200000)result=canvas.toDataURL('image/jpeg',.45);
  if(result.length>=220000)throw new Error('La foto sigue siendo muy grande. Prueba con otra más sencilla.');
  return result;
}
export function PhotoPicker({value,onChange,profile=false,onBusyChange}:{value:string;onChange:(photo:string)=>void;profile?:boolean;onBusyChange?:(busy:boolean)=>void}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const active=useRef(true);const busyCallback=useRef(onBusyChange);busyCallback.current=onBusyChange;
  useEffect(()=>{active.current=true;return()=>{active.current=false;busyCallback.current?.(false);};},[]);
  async function select(file:File|undefined){
    if(!file)return;setBusy(true);onBusyChange?.(true);setError('');
    try{const photo=await compressPhoto(file,profile);if(active.current)onChange(photo);}
    catch(err){if(active.current)setError((err as Error).message);}
    finally{if(active.current){setBusy(false);onBusyChange?.(false);}}
  }
  return <div className="space-y-4 photo-picker">
    {value?<img src={value} alt={profile?'Retrato del perfil':'Vista previa de la foto del producto'} className="capture-photo-preview"/>:<div className="photo-placeholder"><Camera size={48}/><p>{profile?'Agrega tu foto':'Foto del pescado · obligatoria'}</p></div>}
    <div className="photo-actions">
      <label className="fisher-secondary cursor-pointer"><Camera/> Tomar foto<input className="sr-only" aria-label={profile?'Tomar foto del perfil':'Tomar foto del producto'} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={e=>{void select(e.target.files?.[0]);e.target.value='';}}/></label>
      <label className="fisher-secondary cursor-pointer"><ImagePlus/> {profile?'Cambiar mi foto':'Elegir foto'}<input className="sr-only" aria-label={profile?'Elegir foto del perfil':'Elegir foto del producto'} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void select(e.target.files?.[0]);e.target.value='';}}/></label>
    </div>
    {!profile&&value&&<button type="button" className="btn-secondary" disabled={busy} onClick={()=>onChange('')}>Quitar foto</button>}
    {busy&&<p role="status">Espera mientras preparamos tu imagen.</p>}{error&&<p className="alert" role="alert">{error}</p>}
    <p className="text-base">{profile?'La imagen permanece en este navegador.':'Muestra el pescado completo y con buena luz. La foto se ajusta sin estirarse. Necesitas una foto para publicar.'}</p>
  </div>;
}
