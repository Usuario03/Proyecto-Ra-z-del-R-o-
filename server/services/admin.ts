import type {SessionClaims} from '../security/auth';
import {getDbPool,type QueryExecutor,withTransaction} from '../db/db';
import {httpErrors} from '../security/errors';
import type {AdminAuditDto,AdminFisherDto,AdminFisherFilters,AdminFisherPatch,AdminPage,AccountStatus} from '../contracts/admin';
import {hashPasswordScrypt} from './profiles';

interface FisherRow {user_id:string;name:string;email:string;document:string|null;nickname:string|null;port:string;created_at:Date|string;last_login_at:Date|string|null;account_status:AccountStatus;deleted_at:Date|string|null;deleted_by:string|null;deleted_by_name?:string|null}
function mapFisher(row:FisherRow):AdminFisherDto{return{
  userId:row.user_id,name:row.name,email:row.email,document:row.document??'',nickname:row.nickname??'',port:row.port,
  createdAt:new Date(row.created_at).toISOString(),lastLoginAt:row.last_login_at?new Date(row.last_login_at).toISOString():null,
  status:row.account_status,deletedAt:row.deleted_at?new Date(row.deleted_at).toISOString():null,deletedBy:row.deleted_by,deletedByName:row.deleted_by_name??null,
};}
export async function requirePersistedAdmin(session:SessionClaims,db:QueryExecutor=getDbPool()):Promise<void>{
  const result=await db.query<{role:string;account_status:string}>(
    `SELECT role, account_status FROM public.profiles WHERE user_id=$1`,[session.sub]);
  if(session.role!=='admin'||result.rows[0]?.role!=='admin'||result.rows[0]?.account_status!=='active')
    throw httpErrors.forbidden('Tu cuenta no tiene permisos administrativos activos.');
}
export async function listAdminFishers(filters:AdminFisherFilters,session:SessionClaims,db:QueryExecutor=getDbPool()):Promise<AdminPage<AdminFisherDto>>{
  await requirePersistedAdmin(session,db);
  const values:unknown[]=[];const where:string[]=["p.role='fisher'"];
  const add=(sql:string,value:unknown)=>{values.push(value);where.push(sql.replace('?',`$${values.length}`));};
  if(filters.status)add('p.account_status=?',filters.status);else where.push("p.account_status<>'deleted'");
  if(filters.port)add('fd.port=?',filters.port);
  if(filters.createdFrom)add('p.created_at >= ?::date',filters.createdFrom);
  if(filters.createdTo)add("p.created_at < (?::date + interval '1 day')",filters.createdTo);
  const escapeLike=(value:string)=>value.replace(/[\\%_]/g,'\\$&');
  if(filters.query){values.push(`%${escapeLike(filters.query)}%`);const n=values.length;where.push(`(p.name ILIKE $${n} ESCAPE '\\' OR ac.email ILIKE $${n} ESCAPE '\\' OR fd.document ILIKE $${n} ESCAPE '\\')`);}
  if(filters.name){values.push(`%${escapeLike(filters.name)}%`);where.push(`p.name ILIKE $${values.length} ESCAPE '\\'`);}
  if(filters.email){values.push(`%${escapeLike(filters.email)}%`);where.push(`ac.email ILIKE $${values.length} ESCAPE '\\'`);}
  if(filters.document){values.push(`%${escapeLike(filters.document)}%`);where.push(`fd.document ILIKE $${values.length} ESCAPE '\\'`);}
  const predicate=where.join(' AND ');
  const count=await db.query<{total:string|number}>(`SELECT count(*)::int AS total FROM public.profiles p JOIN public.auth_credentials ac ON ac.user_id=p.user_id JOIN public.fisher_details fd ON fd.user_id=p.user_id WHERE ${predicate}`,values);
  const total=Number(count.rows[0]?.total??0);const offset=(filters.page-1)*filters.pageSize;
  const rows=await db.query<FisherRow>(
     `SELECT p.user_id,p.name,ac.email,fd.document,fd.nickname,fd.port,p.created_at,p.last_login_at,p.account_status, p.deleted_at,p.deleted_by,deleter.name AS deleted_by_name
     FROM public.profiles p JOIN public.auth_credentials ac ON ac.user_id=p.user_id JOIN public.fisher_details fd ON fd.user_id=p.user_id
     LEFT JOIN public.profiles deleter ON deleter.user_id=p.deleted_by
     WHERE ${predicate} ORDER BY p.created_at DESC,p.user_id DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,
    [...values,filters.pageSize,offset]);
  return {items:rows.rows.map(mapFisher),page:filters.page,pageSize:filters.pageSize,total,pages:Math.ceil(total/filters.pageSize)};
}
export async function getAdminFisher(id:string,session:SessionClaims,db:QueryExecutor=getDbPool()){
  await requirePersistedAdmin(session,db);
  const result=await db.query<FisherRow>(`SELECT p.user_id,p.name,ac.email,fd.document,fd.nickname,fd.port,p.created_at,p.last_login_at,p.account_status,p.deleted_at,p.deleted_by,deleter.name AS deleted_by_name FROM public.profiles p JOIN public.auth_credentials ac ON ac.user_id=p.user_id JOIN public.fisher_details fd ON fd.user_id=p.user_id LEFT JOIN public.profiles deleter ON deleter.user_id=p.deleted_by WHERE p.role='fisher' AND p.user_id=$1`,[id]);
  if(!result.rows[0])throw httpErrors.notFound('No encontramos esa cuenta de pescador.');
  return mapFisher(result.rows[0]);
}
export async function listAdminAudit(session:SessionClaims,page:number,pageSize:number,db:QueryExecutor=getDbPool()):Promise<AdminPage<AdminAuditDto>>{
  await requirePersistedAdmin(session,db);
  const count=await db.query<{total:number}>('SELECT count(*)::int total FROM public.admin_account_audit');
  const rows=await db.query<{id:string;actor_id:string;actor_name:string;target_user_id:string;target_name:string;action:string;occurred_at:Date|string;before_state:Record<string,unknown>|null;after_state:Record<string,unknown>|null}>(
    `SELECT a.id,a.actor_id,a.target_user_id,a.action,a.before_state,a.after_state,a.occurred_at,
       actor.name AS actor_name,target.name AS target_name
     FROM public.admin_account_audit a
     JOIN public.profiles actor ON actor.user_id=a.actor_id
     JOIN public.profiles target ON target.user_id=a.target_user_id
     ORDER BY a.occurred_at DESC,a.id DESC LIMIT $1 OFFSET $2`,[pageSize,(page-1)*pageSize]);
  return {items:rows.rows.map(r=>({id:r.id,actorId:r.actor_id,actorName:r.actor_name,targetUserId:r.target_user_id,targetName:r.target_name,action:r.action,before:r.before_state,after:r.after_state,occurredAt:new Date(r.occurred_at).toISOString()})),page,pageSize,total:Number(count.rows[0]?.total??0),pages:Math.ceil(Number(count.rows[0]?.total??0)/pageSize)};
}
export async function getAdminSummary(session:SessionClaims,db:QueryExecutor=getDbPool()){
  await requirePersistedAdmin(session,db);
  const counts=await db.query<{role:string;account_status:string;total:number}>(
    `SELECT role,account_status,count(*)::int AS total FROM public.profiles GROUP BY role,account_status`);
  const activity=await db.query<{id:string;actor_name:string;target_name:string;action:string;occurred_at:Date|string}>(
    `SELECT a.id,actor.name actor_name,target.name target_name,a.action,a.occurred_at
     FROM public.admin_account_audit a JOIN public.profiles actor ON actor.user_id=a.actor_id
     JOIN public.profiles target ON target.user_id=a.target_user_id
     ORDER BY a.occurred_at DESC,a.id DESC LIMIT 10`);
  const map=new Map(counts.rows.map(row=>[`${row.role}:${row.account_status}`,Number(row.total)]));
  return {
    fishers:{
      total:[...map].filter(([key])=>key.startsWith('fisher:')).reduce((sum,[,value])=>sum+value,0),
      active:map.get('fisher:active')??0,inactive:map.get('fisher:inactive')??0,
      suspended:map.get('fisher:suspended')??0,deleted:map.get('fisher:deleted')??0,
      newLast30Days:await countCreatedSince('fisher',db),
    },
    clients:[...map].filter(([key])=>key.startsWith('client:')).reduce((sum,[,value])=>sum+value,0),
    recentActivity:activity.rows.map(row=>({id:row.id,actor:row.actor_name,target:row.target_name,action:row.action,occurredAt:new Date(row.occurred_at).toISOString()})),
  };
}
async function countCreatedSince(role:string,db:QueryExecutor){
  const result=await db.query<{total:number}>(
    `SELECT count(*)::int AS total FROM public.profiles WHERE role=$1 AND created_at >= now() - interval '30 days'`,[role]);
  return Number(result.rows[0]?.total??0);
}
export async function listDeletedFishers(filters:Omit<AdminFisherFilters,'status'>,session:SessionClaims,db:QueryExecutor=getDbPool()){
  return listAdminFishers({...filters,status:'deleted'},session,db);
}
export async function updateAdminFisher(id:string,patch:AdminFisherPatch,session:SessionClaims,db:QueryExecutor=getDbPool()){
  return withTransaction(async tx=>{
    await requirePersistedAdmin(session,tx);
    const current=await getAdminFisher(id,session,tx);
    const before={name:current.name,email:current.email,document:current.document,nickname:current.nickname,port:current.port};
    if(patch.email){const existing=await tx.query<{user_id:string}>('SELECT user_id FROM public.auth_credentials WHERE email=$1 AND user_id<>$2',[patch.email,id]);if(existing.rows.length)throw httpErrors.conflict('Ese correo ya está registrado.');}
    if(patch.document){const existing=await tx.query<{user_id:string}>('SELECT user_id FROM public.fisher_details WHERE document=$1 AND user_id<>$2',[patch.document,id]);if(existing.rows.length)throw httpErrors.conflict('Ese documento ya está registrado.');}
    if(patch.name!==undefined)await tx.query('UPDATE public.profiles SET name=$2,updated_at=now() WHERE user_id=$1',[id,patch.name]);
    if(patch.email!==undefined)await tx.query('UPDATE public.auth_credentials SET email=$2,updated_at=now() WHERE user_id=$1',[id,patch.email]);
    const detail:{key:string;column:string;value:string}[]=[
      ...(patch.document!==undefined?[{key:'document',column:'document',value:patch.document}]:[]),
      ...(patch.nickname!==undefined?[{key:'nickname',column:'nickname',value:patch.nickname}]:[]),
      ...(patch.port!==undefined?[{key:'port',column:'port',value:patch.port}]:[]),
    ];
    for(const item of detail)await tx.query(`UPDATE public.fisher_details SET ${item.column}=$2,updated_at=now() WHERE user_id=$1`,[id,item.value]);
    const after={...before,...patch};
    await writeAudit(tx,session.sub,id,'updated',before,after);
    return getAdminFisher(id,session,tx);
  });
}
export async function transitionAdminFisher(id:string,to:AccountStatus,session:SessionClaims,db:QueryExecutor=getDbPool()){
  return withTransaction(async tx=>{
    await requirePersistedAdmin(session,tx);const current=await getAdminFisher(id,session,tx);
    if(current.status==='deleted')throw httpErrors.conflict('Restaura la cuenta antes de cambiar su estado.');
    if(to==='deleted')throw httpErrors.validation('Usa la operación de baja lógica con confirmación.');
    if(current.status===to)return current;
    await tx.query('UPDATE public.profiles SET account_status=$2,updated_at=now() WHERE user_id=$1',[id,to]);
    await writeAudit(tx,session.sub,id,to==='suspended'?'suspended':to==='inactive'?'deactivated':'reactivated',{status:current.status},{status:to});
    return getAdminFisher(id,session,tx);
  });
}
export async function softDeleteAdminFisher(id:string,session:SessionClaims,db:QueryExecutor=getDbPool()){
  return withTransaction(async tx=>{
    await requirePersistedAdmin(session,tx);const current=await getAdminFisher(id,session,tx);
    if(current.status==='deleted')return current;
    await tx.query("UPDATE public.profiles SET account_status='deleted',deleted_at=now(),deleted_by=$2,updated_at=now() WHERE user_id=$1",[id,session.sub]);
    await writeAudit(tx,session.sub,id,'soft_deleted',{status:current.status},{status:'deleted'});
    return getAdminFisher(id,session,tx);
  });
}
export async function restoreAdminFisher(id:string,temporaryPassword:string,session:SessionClaims,db:QueryExecutor=getDbPool()){
  const {salt,hash}=hashPasswordScrypt(temporaryPassword);
  return withTransaction(async tx=>{
    await requirePersistedAdmin(session,tx);const current=await getAdminFisher(id,session,tx);
    if(current.status!=='deleted')throw httpErrors.conflict('La cuenta no está en la papelera.');
    await tx.query("UPDATE public.profiles SET account_status='active',deleted_at=NULL,deleted_by=NULL,first_login_required=true,updated_at=now() WHERE user_id=$1",[id]);
    await tx.query('UPDATE public.auth_credentials SET password_salt=$2,password_hash=$3,updated_at=now() WHERE user_id=$1',[id,salt,hash]);
    await writeAudit(tx,session.sub,id,'restored',{status:'deleted'},{status:'active',firstLoginRequired:true});
    return getAdminFisher(id,session,tx);
  });
}
export async function resetAdminFisherPassword(id:string,password:string,session:SessionClaims,db:QueryExecutor=getDbPool()){
  const {salt,hash}=hashPasswordScrypt(password);
  return withTransaction(async tx=>{
    await requirePersistedAdmin(session,tx);const current=await getAdminFisher(id,session,tx);
    if(current.status==='deleted')throw httpErrors.conflict('Restaura la cuenta antes de restablecer su contraseña.');
    await tx.query('UPDATE public.auth_credentials SET password_salt=$2,password_hash=$3,updated_at=now() WHERE user_id=$1',[id,salt,hash]);
    await tx.query('UPDATE public.profiles SET first_login_required=true,updated_at=now() WHERE user_id=$1',[id]);
    await writeAudit(tx,session.sub,id,'password_reset',null,{firstLoginRequired:true});
    return getAdminFisher(id,session,tx);
  });
}
async function writeAudit(db:QueryExecutor,actorId:string,targetId:string,action:string,before:unknown,after:unknown){
  await db.query('INSERT INTO public.admin_account_audit(actor_id,target_user_id,action,before_state,after_state) VALUES($1,$2,$3,$4::jsonb,$5::jsonb)',
    [actorId,targetId,action,before===null?null:JSON.stringify(before),after===null?null:JSON.stringify(after)]);
}
