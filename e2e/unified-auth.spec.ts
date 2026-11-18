import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { UserProfileDto } from '../server/contracts/profile';

// Contrato de interfaz aislado: no conecta ni escribe en PostgreSQL.
async function setup(page:Page,role:'client'|'fisher'|'admin'='client') {
  const profile:UserProfileDto={
    userId:'00000000-0000-4000-8000-000000000777',role,name:'Cuenta de prueba',
    email:'cuenta@example.test',phone:'3000000000',address:'Dirección de prueba',
    textSize:'normal',readInstructions:true,
    fisherDetail:role==='fisher'?{nickname:'Pescador',document:'123456789',port:'Muelle de Barrancabermeja',memberCode:'FP-777',photoId:null}:null,
  };
  let loggedIn=false;
  let fisherCount=0;
  await page.route('**/api/**',async route=>{
    const req=route.request();const path=new URL(req.url()).pathname;
    const ok=(data:unknown,status=200)=>route.fulfill({status,json:{data}});
    const error=(message:string,status:number)=>route.fulfill({status,json:{error:{code:'TEST_ERROR',message,requestId:'test'}}});
    if(path==='/api/auth/login'){
      const data=req.postDataJSON();
      expect(Object.keys(data).sort()).toEqual(['email','password']);
      if(data.password!=='ClavePrueba2026')return error('El correo o la contraseña no coinciden.',401);
      loggedIn=true;return ok({token:'test-memory-token',profile});
    }
    if(path==='/api/me/onboarding'){
      const data=req.postDataJSON();expect(data.role).toBe('client');
      if(data.email==='duplicado@example.test')return error('Ese correo ya tiene una cuenta registrada.',409);
      loggedIn=true;return ok({token:'test-memory-token',profile:{...profile,role:'client',name:data.name,email:data.email}},201);
    }
    if(path==='/api/me')return loggedIn?ok(profile):error('Inicia sesión.',401);
    if(path==='/api/auth/logout'){loggedIn=false;return ok({loggedOut:true});}
    if(path==='/api/admin/fishers'){
      expect(loggedIn&&role==='admin').toBe(true);
      const data=req.postDataJSON();expect(data).not.toHaveProperty('role');expect(data.password).toBe('ClavePrueba2026');
      fisherCount++;
      if(fisherCount===1)return error('El correo o el documento ya está registrado.',409);
      return ok({...profile,role:'fisher',userId:'new-fisher',name:data.name,email:data.email},201);
    }
    if(path==='/api/catalog')return ok({items:[],fishermen:role==='fisher'?[profile]:[]});
    if(path==='/api/cart')return ok({version:1,lines:[]});
    return ok({items:[],transactions:[]});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
  return profile;
}
async function login(page:Page){
  await page.getByLabel('Correo electrónico',{exact:true}).fill('cuenta@example.test');
  await page.getByLabel('Contraseña',{exact:true}).fill('ClavePrueba2026');
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
}
async function contained(page:Page){
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}

test('formulario único sin demo ni ayuda; visibilidad, errores y registro cliente',async({page},info)=>{
  await setup(page);
  await expect(page.getByText(/¿Cómo quieres entrar|o prueba la experiencia|Tus datos se guardan/)).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Pescador Artesanal|Administración|Ingreso Rápido|Te ayudamos/})).toHaveCount(0);
  await page.getByLabel('Correo electrónico',{exact:true}).fill('cuenta@example.test');
  await page.getByLabel('Contraseña',{exact:true}).fill('incorrecta');
  await page.getByRole('button',{name:'Mostrar contraseña'}).click();
  await expect(page.getByLabel('Contraseña',{exact:true})).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
  await expect(page.locator('main [role="alert"]')).toContainText('no coinciden');
  await page.getByRole('link',{name:'¿No tienes una cuenta? Crear cuenta'}).click();
  await expect(page.getByText('Regístrate para realizar tus compras',{exact:true})).toBeVisible();
  await page.getByLabel('Nombre completo').fill('Cliente Nuevo');
  await page.getByLabel('Correo electrónico',{exact:true}).fill('duplicado@example.test');
  await page.getByLabel('Teléfono móvil').fill('3000000000');
  await page.getByLabel('Dirección de entrega en Barrancabermeja').fill('Dirección de prueba');
  await page.getByLabel('Crea tu contraseña',{exact:true}).fill('ClavePrueba2026');
  await page.getByLabel('Confirma tu contraseña').fill('ClavePrueba2026');
  await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();
  await expect(page.locator('main [role="alert"]')).toContainText('ya tiene una cuenta');
  await contained(page);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:info.outputPath('registro.png'),fullPage:true});
  await page.getByLabel('Correo electrónico',{exact:true}).fill('nuevo@example.test');
  await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();
  await expect(page.getByRole('heading',{name:'¡Tu cuenta está lista!'})).toBeVisible();
});
for(const role of ['client','fisher','admin'] as const){
  test(`inicio único dirige al rol ${role} y no confía en localStorage`,async({page},info)=>{
    await page.addInitScript(()=>localStorage.setItem('raiz-rio-demo-v4',JSON.stringify({role:'admin',adminSession:'forged'})));
    await setup(page,role);
    await login(page);
    if(role==='admin'){
      await expect(page.getByRole('heading',{name:'Gestión de pescadores'})).toBeVisible();
      await page.getByRole('button',{name:'Crear cuenta de pescador',exact:true}).click();
      await page.getByLabel('Nombre completo').fill('Pescador Nuevo');
      await page.getByLabel('Correo electrónico',{exact:true}).fill('pescador@example.test');
      await page.getByLabel('Apodo o nombre tradicional').fill('Pescador');
      await page.getByLabel('Documento',{exact:true}).fill('123456789');
      await page.getByLabel('Puerto o zona de pesca').selectOption({label:'Muelle de Barrancabermeja'});
      await page.getByLabel('Contraseña inicial',{exact:true}).fill('ClavePrueba2026');
      await page.getByLabel('Confirmar contraseña',{exact:true}).fill('diferente');
      await page.getByRole('button',{name:'Crear cuenta de pescador',exact:true}).click();
      await expect(page.locator('main [role="alert"]')).toContainText('no coinciden');
      await page.getByLabel('Confirmar contraseña',{exact:true}).fill('ClavePrueba2026');
      await page.getByRole('button',{name:'Crear cuenta de pescador',exact:true}).click();
      await expect(page.locator('main [role="alert"]')).toContainText('ya está registrado');
      await contained(page);
      await page.screenshot({path:info.outputPath('gestion-pescadores.png'),fullPage:true});
      await page.getByRole('button',{name:'Crear cuenta de pescador',exact:true}).click();
      await expect(page.getByText(/Cuenta de Pescador Nuevo creada/)).toBeVisible();
      await expect(page.getByRole('heading',{name:'Gestión de pescadores'})).toBeVisible();
      await expect(page.getByLabel('Contraseña inicial')).toHaveCount(0);
    }else if(role==='fisher'){
      await expect(page.getByRole('heading',{name:'¡Hola, Pescador!'})).toBeVisible();
      await expect(page.getByRole('heading',{name:'Gestión de pescadores'})).toHaveCount(0);
    }else{
      await expect(page.locator('summary[aria-label="Mi cuenta"]')).toBeVisible();
      await expect(page.getByRole('heading',{name:'Gestión de pescadores'})).toHaveCount(0);
    }
    await expect(page.locator('.chat-shell')).toHaveCount(0);
    await contained(page);
  });
}
