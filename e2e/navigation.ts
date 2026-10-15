import { expect, type Page } from '@playwright/test';

export async function accountAction(page:Page,name:string|RegExp) {
  if(!await page.locator('.account-panel').isVisible())await page.locator('summary[aria-label="Mi cuenta"]').click();
  await page.locator('.account-panel').getByRole('button',{name,exact:typeof name==='string'}).click();
}
export async function openAuth(page:Page,role:'client'|'fisher'|'admin'='client') {
  // El shell Next monta el prototipo solo en cliente: ausencia durante carga no es sesión.
  await expect(page.getByRole('button',{name:'Iniciar sesión',exact:true}).or(page.locator('summary[aria-label="Mi cuenta"]'))).toBeVisible();
  if(!await page.getByRole('button',{name:'Iniciar sesión',exact:true}).isVisible())await accountAction(page,'Cerrar sesión');
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
  if(role==='fisher')await page.getByRole('button',{name:/Pescador Artesanal/}).click();
  if(role==='admin')await page.getByRole('button',{name:'Administración',exact:true}).click();
}
export async function openFisher(page:Page) {
  await page.locator('summary[aria-label="Mi cuenta"]').click();
  if(await page.getByRole('button',{name:'Mi panel de pesca',exact:true}).isVisible())await page.getByRole('button',{name:'Mi panel de pesca',exact:true}).click();
  else await openAuth(page,'fisher');
}
export async function loginDemo(page:Page) {
  await openAuth(page);await page.getByRole('button',{name:'Ingreso Rápido Cliente Demo'}).click();
}
export async function enterAdmin(page:Page) {
  await openAuth(page,'admin');await page.getByLabel('Correo de administración').fill('jairoleal@admin.com');
  await page.getByLabel('Contraseña de administración').fill('Admin1234');await page.getByRole('button',{name:'Entrar a administración'}).click();
  await expect(page.getByRole('heading',{name:'Gestión ambiental AUNAP'})).toBeVisible();
}
export async function home(page:Page) {
  await page.getByRole('link',{name:'Raíz del Río, inicio'}).click();
}
export async function expectAccount(page:Page,text:string) {
  await page.locator('summary[aria-label="Mi cuenta"]').click();
  await expect(page.locator('.account-identity')).toContainText(text);
  await page.keyboard.press('Escape');
}
