import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { accountAction, loginDemo, openAuth } from './navigation';

test('cliente edita perfil, lo recupera y usa los datos en próximas compras',async({page},testInfo)=>{
  await page.goto('/');await expect(page.getByRole('link',{name:'Inicio',exact:true})).toBeVisible();await loginDemo(page);
  await accountAction(page,'Mi perfil');await expect(page.getByRole('heading',{name:'Mi perfil',exact:true})).toBeVisible();
  await page.getByLabel('Nombre completo',{exact:true}).fill('Ana María Pérez Actualizada');
  await page.getByLabel('Correo personal').fill('jairoleal@admin.com');await page.getByLabel('Teléfono móvil').fill('3119876543');
  await page.getByLabel('Dirección de entrega en Barrancabermeja').fill('Barrio Centro, Calle 20 #30-40, apartamento 201');
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await expect(page.getByRole('alert')).toContainText('ya tiene una cuenta');
  await page.getByLabel('Correo personal').fill('ANA.PEREZ@example.com');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Tus datos se guardaron'})).toBeVisible();await expect(page.getByLabel('Correo personal')).toHaveValue('ana.perez@example.com');
  await expect(page.getByRole('button',{name:'Guardar cambios',exact:true})).toBeDisabled();
  await page.getByLabel('Nombre completo',{exact:true}).fill('No guardar');await page.getByRole('button',{name:'Descartar cambios'}).click();await expect(page.getByLabel('Nombre completo',{exact:true})).toHaveValue('Ana María Pérez Actualizada');
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:testInfo.outputPath('perfil-cliente.png'),fullPage:true});
  await page.getByRole('link',{name:'Inicio',exact:true}).click();await expect(page.locator('.hero')).toBeVisible();
  await page.reload();await accountAction(page,'Mi perfil');await expect(page.getByLabel('Correo personal')).toHaveValue('ana.perez@example.com');
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  await page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Bocachico',exact:true})}).getByRole('button',{name:'Añadir a mi canasta',exact:true}).click();
  await page.getByRole('button',{name:/Mi canasta/}).click();await page.getByRole('button',{name:'Continuar con mi compra'}).click();
  await expect(page.getByLabel('Nombre completo',{exact:true})).toHaveValue('Ana María Pérez Actualizada');await expect(page.getByLabel('Celular',{exact:true})).toHaveValue('3119876543');
  await expect(page.getByLabel('Dirección en Barrancabermeja')).toHaveValue('Barrio Centro, Calle 20 #30-40, apartamento 201');
  await page.getByRole('button',{name:'Cerrar ventana'}).click();await openAuth(page);
  await page.getByLabel('Correo personal').fill('ana.perez@example.com');await page.getByLabel('Contraseña',{exact:true}).fill('Demo1234');await page.getByRole('button',{name:'Iniciar sesión como cliente'}).click();
  await accountAction(page,'Mi perfil');await expect(page.getByLabel('Nombre completo',{exact:true})).toHaveValue('Ana María Pérez Actualizada');
});
