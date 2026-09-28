import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { accountAction, enterAdmin, expectAccount, home, loginDemo, openAuth, openFisher } from './navigation';

test.beforeEach(async({page})=>{
  await page.goto('/');
  await openAuth(page);
  await page.getByRole('button',{name:'Ingreso Rápido Cliente Demo'}).click();
  await expectAccount(page,'Cliente de demostración');
});

async function enterFisher(page:Page,name='Don Pedro') {
  await openFisher(page);
  await page.getByRole('button',{name:new RegExp(name)}).click();
  await page.getByRole('button',{name:/Entrar con un toque/}).click();
}
async function checkout(page:Page) {
  await page.getByRole('button',{name:/Mi canasta/}).click();
  await page.getByRole('button',{name:'Continuar con mi compra'}).click();
  await page.getByLabel('Nombre completo').fill('Ana Demo');
  await page.getByLabel('Celular',{exact:true}).fill('3001234567');
  await page.getByLabel('Dirección en Barrancabermeja').fill('Calle 10 # 20-30, Centro');
}
async function addBocachico(page:Page) {
  await page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Bocachico',exact:true})}).getByRole('button',{name:/Añadir a mi canasta/}).click();
}

test('publicar, comprar con reintento y entregar conserva estado e historial',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const external:string[]=[];page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:4173'))external.push(r.url());});
  await page.goto('/');await enterFisher(page);
  await page.getByRole('button',{name:/REGISTRAR Y SUBIR/}).click();
  await page.getByRole('button',{name:/Nicuro Mínimo/}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Kilos para vender kg',exact:true}).fill('6');
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('button',{name:'La Rampa',exact:true}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByLabel('Elegir foto del producto').setInputFiles('public/images/magdalena-barrancabermeja-960.webp');
  await page.getByRole('button',{name:'PUBLICAR EN LA TIENDA AHORA'}).click();
  await expect(page.getByRole('heading',{name:'¡Tu pesca ya está en la tienda!'})).toBeVisible();
  await page.getByRole('button',{name:'Ver en la tienda'}).click();
  const lot=page.locator('.product-card').filter({hasText:'Pedro Enrique Salom'}).filter({has:page.getByRole('heading',{name:'Nicuro',exact:true})});
  await expect(lot).toBeVisible();await expect(lot.locator('img')).toBeVisible();
  await loginDemo(page);
  await lot.getByRole('button',{name:/Añadir a mi canasta/}).click();
  await checkout(page);
  await page.getByLabel('Tu banco').selectOption('Banco de Bogotá');
  await page.getByLabel('Tipo de cliente').selectOption('Persona Jurídica');
  await page.getByLabel('Resultado de la simulación').selectOption('reject');
  await page.getByRole('button',{name:/Simular pago/}).click();
  await expect(page.getByText('Banco de Bogotá · Persona Jurídica')).toBeVisible();
  await page.getByRole('button',{name:'Autorizar pago ficticio'}).click();
  await expect(page.getByRole('alert')).toContainText('rechazado');
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Ana Demo');
  await expect(page.getByLabel('Dirección en Barrancabermeja')).toHaveValue('Calle 10 # 20-30, Centro');
  await page.getByLabel('Resultado de la simulación').selectOption('success');
  await page.getByRole('button',{name:/Simular pago/}).click();await page.getByRole('button',{name:'Autorizar pago ficticio'}).click();
  await expect(page.getByRole('heading',{name:'Tu pedido tiene una historia.'})).toBeVisible();
  await expect(page.locator('.receipt')).toContainText('Pedro Enrique Salom');
  await page.emulateMedia({media:'print'});await expect(page.locator('.receipt')).toBeVisible();await page.emulateMedia({media:'screen'});
  await page.getByRole('button',{name:'Seguir explorando'}).click();
  await enterFisher(page);
  await page.getByRole('button',{name:/Mis pedidos/}).click();
  await page.getByRole('button',{name:'Pedido preparado en puerto'}).click();
  await page.getByRole('button',{name:'Enviado con domiciliario'}).click();
  await expect(page.getByText('Tu pescado ya va en camino.')).toBeVisible();
  await page.reload();await expect(page.locator('.product-grid')).toBeVisible();await openFisher(page);await expect(page.getByRole('heading',{name:'¡Hola, Don Pedro!'})).toBeVisible();
  await loginDemo(page);await accountAction(page,/Mis compras/);
  await page.getByRole('button',{name:'Ver recibo y entrega'}).click();
  await expect(page.locator('.receipt')).toContainText('enviado');
  await expect(page.locator('.receipt')).toContainText('Banco de Bogotá');
  expect(errors).toEqual([]);expect(external).toEqual([]);
});

test('veda bloquea publicación y talla se valida antes de continuar',async({page})=>{
  await page.goto('/');await enterFisher(page,'Don José');
  await page.getByRole('button',{name:/REGISTRAR Y SUBIR/}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Talla del pescado cm',exact:true}).fill('22');
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeDisabled();
  await page.getByRole('spinbutton',{name:'Talla del pescado cm',exact:true}).fill('28');
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeEnabled();
  await enterAdmin(page);
  await page.getByRole('checkbox',{name:'Veda de Bocachico',exact:true}).check();
  await enterFisher(page,'Don José');
  await page.getByRole('button',{name:/REGISTRAR Y SUBIR/}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('veda');
});

test('pausa y reducción de inventario bloquean una canasta anterior',async({page})=>{
  await page.goto('/');await addBocachico(page);await enterFisher(page,'Don José');
  await page.getByRole('checkbox',{name:'Pausar venta'}).check();
  await loginDemo(page);await page.getByRole('button',{name:/Mi canasta/}).click();
  await expect(page.getByRole('button',{name:'Continuar con mi compra'})).toBeDisabled();await expect(page.getByRole('alert')).toContainText('pausada');
  await page.getByRole('button',{name:'Cerrar ventana'}).click();await enterFisher(page,'Don José');
  await page.getByRole('checkbox',{name:'Pausar venta'}).uncheck();await page.getByRole('spinbutton',{name:'Stock de Bocachico kg',exact:true}).fill('0');
  await loginDemo(page);await page.getByRole('button',{name:/Mi canasta/}).click();
  await expect(page.getByRole('button',{name:'Continuar con mi compra'})).toBeDisabled();await expect(page.getByRole('alert')).toContainText('Agotado');
});

test('Nequi vence sin perder datos y Daviplata autoriza un pago',async({page})=>{
  await page.clock.install();await page.goto('/');await addBocachico(page);await checkout(page);
  await page.getByRole('button',{name:'Nequi',exact:true}).click();await page.getByLabel('Celular de Nequi').fill('3001234567');
  await page.getByRole('button',{name:/Simular pago/}).click();await expect(page.locator('.push-notification')).toBeVisible();
  await page.clock.fastForward(61000);await expect(page.getByRole('alert')).toContainText('venció');
  await expect(page.getByLabel('Nombre completo')).toHaveValue('Ana Demo');
  await page.getByRole('button',{name:'Daviplata',exact:true}).click();
  await expect(page.getByLabel('Celular de Daviplata')).toHaveValue('3001234567');
  await page.getByRole('button',{name:/Simular pago/}).click();await page.getByRole('button',{name:'Autorizar pago ficticio'}).click();
  await page.clock.fastForward(2000);await expect(page.getByRole('heading',{name:'Tu pedido tiene una historia.'})).toBeVisible();
});

test('tarjeta valida número, conserva datos y aplica flip al CVV',async({page})=>{
  await page.goto('/');await addBocachico(page);await checkout(page);
  await page.getByRole('button',{name:'Tarjeta',exact:true}).click();
  await page.getByLabel('Número de tarjeta').fill('4242424242424241');await page.getByLabel('Vencimiento',{exact:true}).fill('1230');
  await page.getByLabel('CVV',{exact:true}).fill('123');await expect(page.locator('.card-preview')).toHaveClass(/flipped/);
  await page.getByRole('button',{name:/Simular pago/}).click();await expect(page.getByRole('alert')).toContainText('Revisa el número');
  await page.getByLabel('Número de tarjeta').fill('4242424242424242');await page.getByRole('button',{name:/Simular pago/}).click();
  await expect(page.getByRole('heading',{name:'Tu pedido tiene una historia.'})).toBeVisible();
  const persisted=await page.evaluate(()=>localStorage.getItem('raiz-rio-demo-v4'));
  expect(persisted).not.toContain('4242 4242');expect(persisted).not.toContain('"cvv"');
});

test('PIN, accesibilidad automática, texto grande y diseño sin desbordamiento',async({page},testInfo)=>{
  await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const buyer=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(buyer.violations).toEqual([]);
  await page.screenshot({path:testInfo.outputPath('cliente.png'),fullPage:true});
  await openFisher(page);await page.getByRole('button',{name:/Don Pedro/}).click();
  await page.getByLabel('PIN de cuatro dígitos').fill('0000');await page.getByRole('button',{name:'Entrar con mi PIN'}).click();await expect(page.getByRole('alert')).toContainText('no coincide');
  for(const n of ['1','2','3','4'])await page.getByRole('button',{name:n,exact:true}).click();await page.getByRole('button',{name:'Entrar con mi PIN'}).click();
  await page.getByRole('radio',{name:'Grande',exact:true}).check();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const fisher=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(fisher.violations).toEqual([]);
  await page.screenshot({path:testInfo.outputPath('pescador.png'),fullPage:true});
  await home(page);const info=page.getByRole('button',{name:'Conoce el proyecto',exact:true});await info.click();
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Cerrar ventana'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(info).toBeFocused();
});
