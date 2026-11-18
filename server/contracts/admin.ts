import { ZONES } from '../../src/domain';
import { httpErrors } from '../security/errors';
import { isValidEmailAddress, normalizeEmailInput } from './profile';

export const ACCOUNT_STATUSES = ['active','inactive','suspended','deleted'] as const;
export type AccountStatus = typeof ACCOUNT_STATUSES[number];

export interface AdminFisherDto {
  userId:string;name:string;email:string;document:string;nickname:string;port:string;
  createdAt:string;lastLoginAt:string|null;status:AccountStatus;
  deletedAt:string|null;deletedBy:string|null;deletedByName:string|null;
}
export interface AdminAuditDto {
  id:string;actorId:string;actorName:string;targetUserId:string;targetName:string;
  action:string;before:Record<string,unknown>|null;after:Record<string,unknown>|null;occurredAt:string;
}
export interface AdminPage<T> {items:T[];page:number;pageSize:number;total:number;pages:number}
export interface AdminFisherFilters {query:string;name:string;email:string;document:string;status:AccountStatus|null;port:string|null;createdFrom:string|null;createdTo:string|null;page:number;pageSize:number}
export interface AdminFisherPatch {name?:string;email?:string;document?:string;nickname?:string;port?:string}

export function parseAdminFisherFilters(params:URLSearchParams):AdminFisherFilters {
  const allowed=['q','name','email','document','status','port','createdFrom','createdTo','page','pageSize'];
  for(const key of params.keys())if(!allowed.includes(key))throw httpErrors.validation(`Filtro no permitido: ${key}.`);
  const query=params.get('q')?.trim()??'';
  if(query.length>120)throw httpErrors.validation('La búsqueda debe tener máximo 120 caracteres.');
  const name=params.get('name')?.trim()??'';
  const email=params.get('email')?.trim()??'';
  const document=params.get('document')?.trim()??'';
  if(name.length>120||email.length>150||document.length>12)throw httpErrors.validation('Uno de los filtros supera la longitud permitida.');
  const rawStatus=params.get('status');
  if(rawStatus&&!ACCOUNT_STATUSES.includes(rawStatus as AccountStatus))throw httpErrors.validation('Estado de cuenta no válido.');
  const port=params.get('port')||null;
  if(port&&!ZONES.includes(port))throw httpErrors.validation('Zona de pesca no válida.');
  const createdFrom=parseDateFilter(params.get('createdFrom'),'fecha inicial');
  const createdTo=parseDateFilter(params.get('createdTo'),'fecha final');
  if(createdFrom&&createdTo&&createdFrom>createdTo)throw httpErrors.validation('La fecha inicial debe ser anterior a la final.');
  const page=parseBoundedInt(params.get('page'),1,1,10000,'página');
  const pageSize=parseBoundedInt(params.get('pageSize'),25,1,100,'tamaño de página');
  return {query,name,email,document,status:rawStatus as AccountStatus|null,port,createdFrom,createdTo,page,pageSize};
}
function parseBoundedInt(raw:string|null,fallback:number,min:number,max:number,label:string){
  if(raw===null)return fallback;
  const n=Number(raw);if(!Number.isSafeInteger(n)||n<min||n>max)throw httpErrors.validation(`La ${label} debe estar entre ${min} y ${max}.`);
  return n;
}
function parseDateFilter(raw:string|null,label:string):string|null{
  if(!raw)return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))throw httpErrors.validation(`La ${label} no es válida.`);
  const parsed=new Date(`${raw}T00:00:00.000Z`);
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==raw)throw httpErrors.validation(`La ${label} no es válida.`);
  return raw;
}
export function parseAdminFisherPatch(raw:Record<string,unknown>):AdminFisherPatch {
  const allowed=['name','email','document','nickname','port'];
  for(const key of Object.keys(raw))if(!allowed.includes(key))throw httpErrors.validation(`Campo no permitido: ${key}.`);
  if(!Object.keys(raw).length)throw httpErrors.validation('Indica al menos un dato para actualizar.');
  const out:AdminFisherPatch={};
  if(raw.name!==undefined){if(typeof raw.name!=='string'||raw.name.trim().length<2||raw.name.trim().length>100)throw httpErrors.validation('El nombre debe tener entre 2 y 100 caracteres.');out.name=raw.name.trim();}
  if(raw.email!==undefined){const email=normalizeEmailInput(raw.email);if(!isValidEmailAddress(email))throw httpErrors.validation('Ingresa un correo electrónico válido.');out.email=email;}
  if(raw.document!==undefined){if(typeof raw.document!=='string'||!/^\d{6,12}$/.test(raw.document.trim()))throw httpErrors.validation('El documento debe tener entre 6 y 12 dígitos.');out.document=raw.document.trim();}
  if(raw.nickname!==undefined){if(typeof raw.nickname!=='string'||raw.nickname.trim().length<2||raw.nickname.trim().length>80)throw httpErrors.validation('El apodo debe tener entre 2 y 80 caracteres.');out.nickname=raw.nickname.trim();}
  if(raw.port!==undefined){if(typeof raw.port!=='string'||!ZONES.includes(raw.port.trim()))throw httpErrors.validation('Selecciona un puerto o zona válida.');out.port=raw.port.trim();}
  return out;
}
export function parseAdminPage(params:URLSearchParams):{page:number;pageSize:number}{
  for(const key of params.keys())if(key!=='page'&&key!=='pageSize')throw httpErrors.validation(`Parámetro no permitido: ${key}.`);
  return {page:parseBoundedInt(params.get('page'),1,1,10000,'página'),pageSize:parseBoundedInt(params.get('pageSize'),25,1,100,'tamaño de página')};
}
export function parseTemporaryPassword(raw:Record<string,unknown>):string{
  for(const key of Object.keys(raw))if(key!=='password')throw httpErrors.validation(`Campo no permitido: ${key}.`);
  if(typeof raw.password!=='string'||raw.password.length<8||raw.password.length>128)throw httpErrors.validation('La contraseña temporal debe tener entre 8 y 128 caracteres.');
  return raw.password;
}
