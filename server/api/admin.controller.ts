import {ACCOUNT_STATUSES,parseAdminFisherFilters,parseAdminFisherPatch,parseAdminPage,parseTemporaryPassword} from '../contracts/admin';
import {isUuid} from '../contracts/common';
import {requireRole} from '../security/authorization';
import {httpErrors,jsonSuccess,readValidatedJsonBody,toErrorResponse} from '../security/errors';
import {verifyRequestOrigin} from '../security/origin';
import {getAdminSummary,getAdminFisher,listAdminAudit,listAdminFishers,listDeletedFishers,resetAdminFisherPassword,restoreAdminFisher,softDeleteAdminFisher,transitionAdminFisher,updateAdminFisher} from '../services/admin';

function admin(request:Request){return requireRole(request,['admin']);}
function assertId(id:string){if(!isUuid(id))throw httpErrors.validation('El identificador de la cuenta no es válido.');}
export async function handleAdminSummaryGet(request:Request){try{return jsonSuccess(await getAdminSummary(admin(request)));}catch(error){return toErrorResponse(error);}}
export async function handleAdminFishersGet(request:Request){try{
  const filters=parseAdminFisherFilters(new URL(request.url).searchParams);
  return jsonSuccess(await listAdminFishers(filters,admin(request)));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminTrashGet(request:Request){try{
  const params=new URL(request.url).searchParams;const page=parseAdminPage(params);
  const filters={...parseAdminFisherFilters(new URLSearchParams([...params].filter(([key])=>key!=='status'))),...page};
  return jsonSuccess(await listDeletedFishers(filters,admin(request)));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminAuditGet(request:Request){try{
  const {page,pageSize}=parseAdminPage(new URL(request.url).searchParams);
  return jsonSuccess(await listAdminAudit(admin(request),page,pageSize));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminFisherGet(request:Request,context:{params:Promise<{id:string}>}){try{
  const {id}=await context.params;assertId(id);
  return jsonSuccess(await getAdminFisher(id,admin(request)));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminFisherPatch(request:Request,context:{params:Promise<{id:string}>}){try{
  verifyRequestOrigin(request);const {id}=await context.params;assertId(id);
  const patch=parseAdminFisherPatch(await readValidatedJsonBody(request));
  return jsonSuccess(await updateAdminFisher(id,patch,admin(request)));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminFisherStatusPost(request:Request,context:{params:Promise<{id:string}>}){try{
  verifyRequestOrigin(request);const {id}=await context.params;assertId(id);const body=await readValidatedJsonBody(request);
  if(Object.keys(body).some(k=>k!=='status')||!ACCOUNT_STATUSES.includes(body.status as typeof ACCOUNT_STATUSES[number])||body.status==='deleted')
    throw httpErrors.validation('Indica un estado válido: active, inactive o suspended.');
  return jsonSuccess(await transitionAdminFisher(id,body.status as 'active'|'inactive'|'suspended',admin(request)));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminFisherDeletePost(request:Request,context:{params:Promise<{id:string}>}){try{
  verifyRequestOrigin(request);const {id}=await context.params;assertId(id);const body=await readValidatedJsonBody(request);
  if(Object.keys(body).length!==1||body.confirm!==true)throw httpErrors.validation('Confirma explícitamente la baja lógica.');
  return jsonSuccess(await softDeleteAdminFisher(id,admin(request)));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminFisherPasswordResetPost(request:Request,context:{params:Promise<{id:string}>}){try{
  verifyRequestOrigin(request);const {id}=await context.params;assertId(id);
  const password=parseTemporaryPassword(await readValidatedJsonBody(request));
  return jsonSuccess(await resetAdminFisherPassword(id,password,admin(request)));
}catch(error){return toErrorResponse(error);}}
export async function handleAdminFisherRestorePost(request:Request,context:{params:Promise<{id:string}>}){try{
  verifyRequestOrigin(request);const {id}=await context.params;assertId(id);
  const password=parseTemporaryPassword(await readValidatedJsonBody(request));
  return jsonSuccess(await restoreAdminFisher(id,password,admin(request)));
}catch(error){return toErrorResponse(error);}}
