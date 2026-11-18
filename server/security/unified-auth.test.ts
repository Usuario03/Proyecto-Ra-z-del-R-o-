import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { parseCreateFisherInput, parseLoginInput, parseOnboardingInput } from '../contracts/profile';
import { handleFisherCreatePost } from '../api/fishers.controller';
import { handleMeOnboardingPost } from '../api/profile.controller';
import { authenticateWithPassword, hashPasswordScrypt } from '../services/profiles';
import { signSessionJwt } from './auth';
import type { QueryExecutor } from '../db/db';

const previous = process.env.JWT_SECRET;
const previousBetter = process.env.BETTER_AUTH_SECRET;
before(() => {
  delete process.env.BETTER_AUTH_SECRET;
  process.env.JWT_SECRET = 'isolated-test-key-at-least-32-characters';
});
after(() => {
  if(previous===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=previous;
  if(previousBetter===undefined)delete process.env.BETTER_AUTH_SECRET;else process.env.BETTER_AUTH_SECRET=previousBetter;
});
const account={name:'Cuenta Prueba',email:'USER@example.test',password:'NuevaClave2026',phone:'3000000000',address:'Dirección de prueba'};
const fisher={name:account.name,email:account.email,password:account.password,nickname:'Pescador',document:'123456789',port:'Muelle de Barrancabermeja'};
const request=(path:string,body:unknown,token?:string)=>new Request(`http://localhost:3000${path}`,{
  method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3000',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),
});

test('registro público fija cliente y rechaza roles privilegiados y campos pescador',()=>{
  assert.equal(parseOnboardingInput(account).role,'client');
  assert.equal(parseOnboardingInput(account).email,'user@example.test');
  for(const role of ['admin','fisher'])assert.throws(()=>parseOnboardingInput({...account,role}),/solo permite/);
  assert.throws(()=>parseOnboardingInput({...account,document:'123456789'}),/Campos no permitidos/);
});
test('contratos eliminan un toque, rol en login y PIN nuevo; validan datos de pescador',()=>{
  assert.throws(()=>parseLoginInput({email:account.email,oneTouch:true}),/Campos no permitidos/);
  assert.throws(()=>parseLoginInput({email:account.email,password:account.password,role:'admin'}),/Campos no permitidos/);
  assert.equal(parseCreateFisherInput(fisher).role,'fisher');
  for(const invalid of [{password:'1234'},{email:'invalido'},{name:'x'},{document:'a'},{port:'desconocido'},{role:'admin'}]){
    assert.throws(()=>parseCreateFisherInput({...fisher,...invalid}));
  }
});
test('API rechaza alta pública privilegiada sin acceder a DB',async()=>{
  for(const role of ['fisher','admin']){
    const response=await handleMeOnboardingPost(request('/api/me/onboarding',{...account,role}));
    assert.equal(response.status,403);
  }
});
test('alta administrativa rechaza invitado, cliente, pescador y firma manipulada antes de DB',async()=>{
  assert.equal((await handleFisherCreatePost(request('/api/admin/fishers',fisher))).status,401);
  for(const role of ['client','fisher'] as const){
    const token=signSessionJwt({sub:'test-user',role,name:'Cuenta'});
    assert.equal((await handleFisherCreatePost(request('/api/admin/fishers',fisher,token))).status,403);
  }
  const forged=signSessionJwt({sub:'test-user',role:'admin',name:'Cuenta'},'attacker-secret');
  assert.equal((await handleFisherCreatePost(request('/api/admin/fishers',fisher,forged))).status,401);
});
test('los tres roles autentican con scrypt; contraseña incorrecta nunca permite ingreso',async()=>{
  const credential=hashPasswordScrypt(account.password);
  for(const role of ['client','fisher','admin']){
    const db={query:async(sql:string)=>({rows:sql.includes('SELECT user_id, email')?
      [{user_id:'persisted-user',email:account.email,password_salt:credential.salt,password_hash:credential.hash}]:
      [{user_id:'persisted-user',role,name:account.name,email:account.email,text_size:'normal',read_instructions:true}],
    })} as QueryExecutor;
    const result=await authenticateWithPassword({email:account.email,password:account.password},db);
    assert.equal(result.profile.role,role);
    assert.equal('password_hash' in result.profile,false);
    await assert.rejects(authenticateWithPassword({email:account.email,password:'incorrecta'},db),/no coinciden/);
  }
});
test('sin secreto configurado no se emiten sesiones',()=>{
  const secret=process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try{assert.throws(()=>signSessionJwt({sub:'test',role:'admin',name:'Test'}),/secreto/);}
  finally{process.env.JWT_SECRET=secret;}
});
