import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { accountAction, home, loginDemo, openAuth } from './navigation';

async function fisher(page:Page,name='Don Pedro') {
  await openAuth(page,'fisher');await page.getByRole('button',{name:new RegExp(name)}).click();
  await page.getByRole('button',{name:/Entrar con un toque/}).click();
}
async function publishPieces(page:Page) {
  await page.getByRole('button',{name:/REGISTRAR Y SUBIR/}).click();
  await page.getByRole('button',{name:/Nicuro Mínimo/}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('radio',{name:'Peces del mismo peso',exact:true}).check();
  await page.getByRole('spinbutton',{name:'Peso de cada pez g',exact:true}).fill('500');
  await page.getByRole('spinbutton',{name:'Cantidad de peces para vender peces',exact:true}).fill('4');
  await expect(page.locator('.quantity-summary')).toContainText('4 peces × 0,5 kg = 2 kg');
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeDisabled();
  await page.getByRole('checkbox',{name:/Todos estos peces pesan lo mismo/}).check();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByText('Nicuro · 4 peces · 2 kg',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'PUBLICAR EN LA TIENDA AHORA'})).toBeDisabled();
  await page.getByLabel('Elegir foto del producto').setInputFiles('public/images/magdalena-barrancabermeja-960.webp');
  await page.getByRole('button',{name:'PUBLICAR EN LA TIENDA AHORA'}).click();await page.getByRole('button',{name:'Volver a mi panel'}).click();
}

test('venta de peces por cantidad muestra peso, cobro, vendidos y conserva recibos al eliminar',async({page},testInfo)=>{
  await page.goto('/');await fisher(page);await publishPieces(page);
  const inventory=page.locator('.inventory-item').filter({has:page.getByRole('heading',{name:'Nicuro',exact:true})});
  await expect(inventory).toContainText('Disponible para vender: 4 peces · 2 kg');
  const count=inventory.getByRole('spinbutton',{name:'Cantidad de peces de Nicuro peces',exact:true});
  await count.fill('6');await expect(inventory).toContainText('Disponible para vender: 6 peces · 3 kg');
  await count.fill('4');
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await inventory.screenshot({path:testInfo.outputPath('inventario-por-peces.png')});
  await loginDemo(page);
  const card=page.locator('.product-card').filter({hasText:'Pedro Enrique Salom'}).filter({has:page.getByRole('heading',{name:'Nicuro',exact:true})});
  await expect(card).toContainText('4 peces disponibles');await expect(card).toContainText('0,5 kg por pez');
  await card.getByRole('button',{name:/Añadir 1 pez a mi canasta/}).click();
  await page.getByRole('button',{name:'Mi canasta, 0,5 kg'}).click();
  await page.getByRole('button',{name:'Añadir un pez de Nicuro',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Seleccionado: 2 peces · 1 kg');
  await page.getByRole('button',{name:'Continuar con mi compra'}).click();
  await page.getByLabel('Nombre completo').fill('Ana Demo');await page.getByLabel('Celular',{exact:true}).fill('3001234567');
  await page.getByLabel('Dirección en Barrancabermeja').fill('Calle 10 # 20-30, Centro');
  await page.getByRole('button',{name:/Simular pago/}).click();
  await expect(page.getByRole('dialog')).toContainText('16.000');
  await page.getByRole('button',{name:'Autorizar pago ficticio'}).click();
  await expect(page.locator('.receipt')).toContainText('Nicuro · 2 peces · 1 kg');
  await page.getByRole('button',{name:'Seguir explorando'}).click();
  await fisher(page);await expect(inventory).toContainText('Disponible para vender: 2 peces · 1 kg');
  await expect(inventory).toContainText('Cantidad vendida de este lote: 2 peces · 1 kg');
  await inventory.getByRole('button',{name:'Eliminar publicación de Nicuro'}).click();
  await expect(inventory).toHaveCount(0);await page.reload();await accountAction(page,'Mi panel de pesca');
  await expect(inventory).toHaveCount(0);await page.getByRole('button',{name:/Mis pedidos/}).click();
  await expect(page.locator('.fisher-order')).toContainText('2 peces · 1 kg');
  await page.getByRole('button',{name:'Pedido preparado en puerto'}).click();
  await loginDemo(page);await expect(card).toHaveCount(0);await accountAction(page,/Mis compras/);
  await page.getByRole('button',{name:'Ver recibo y entrega'}).click();
  await expect(page.locator('.receipt')).toContainText('Nicuro · 2 peces · 1 kg');
});

test('eliminar un lote inicial lo retira de canastas y no reaparece tras recargar',async({page})=>{
  await page.goto('/');await loginDemo(page);
  const card=page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Bocachico',exact:true})});
  await card.getByRole('button',{name:'Añadir a mi canasta',exact:true}).click();
  await fisher(page,'Don José');
  await page.getByRole('button',{name:'Eliminar publicación de Bocachico'}).click();
  await expect(page.getByRole('heading',{name:'Bocachico',exact:true})).toHaveCount(0);
  await page.reload();await expect(card).toHaveCount(0);await loginDemo(page);
  await page.getByRole('button',{name:'Mi canasta, 0 kg'}).click();
  await expect(page.getByRole('dialog')).toContainText('Tu próxima historia empieza aquí.');
});
