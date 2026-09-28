import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { accountAction, loginDemo, openAuth } from './navigation';

async function fisher(page:Page){await openAuth(page,'fisher');await page.getByRole('button',{name:/Don José/}).click();await page.getByRole('button',{name:/Entrar con un toque/}).click();}
const PHOTO='public/images/magdalena-barrancabermeja-960.webp';

test('ayuda repetida no mueve ningún paso y la foto real es obligatoria',async({page})=>{
  await page.goto('/');await fisher(page);await page.getByRole('button',{name:/REGISTRAR Y SUBIR/}).click();
  for(let step=1;step<=5;step++){
    const help=page.getByRole('button',{name:'Escuchar ayuda',exact:true});await help.scrollIntoViewIfNeeded();
    const before=await help.boundingBox();const scroll=await page.evaluate(()=>scrollY);
    await help.click();await help.dblclick();
    await expect(page.getByRole('complementary',{name:'Instrucción escrita'})).toBeVisible();
    const after=await help.boundingBox();expect(Math.abs(after!.x-before!.x)).toBeLessThan(1);expect(Math.abs(after!.y-before!.y)).toBeLessThan(1);
    expect(Math.abs(await page.evaluate(()=>scrollY)-scroll)).toBeLessThan(1);
    await page.getByRole('button',{name:'Cerrar instrucción'}).click();
    if(step<5)await page.getByRole('button',{name:'Continuar',exact:true}).click();
  }
  const publish=page.getByRole('button',{name:'PUBLICAR EN LA TIENDA AHORA'});
  await expect(publish).toBeDisabled();await expect(page.getByRole('button',{name:'Simular cámara del celular'})).toHaveCount(0);
  await page.getByLabel('Elegir foto del producto').setInputFiles({name:'no-es-foto.txt',mimeType:'text/plain',buffer:Buffer.from('texto')});
  await expect(page.locator('.photo-picker').getByRole('alert')).toContainText('JPG');await expect(publish).toBeDisabled();
  await page.getByLabel('Elegir foto del producto').setInputFiles(PHOTO);await expect(publish).toBeEnabled();
  const preview=page.getByRole('img',{name:'Vista previa de la foto del producto'});
  expect(await preview.evaluate(el=>{const img=el as HTMLImageElement;return img.naturalWidth/img.naturalHeight;})).toBeCloseTo(4/3);
  await page.getByRole('button',{name:'Quitar foto'}).click();await expect(publish).toBeDisabled();
  await page.getByLabel('Elegir foto del producto').setInputFiles(PHOTO);await publish.click();
  await expect(page.getByRole('heading',{name:'PESCA REGISTRADA',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Escuchar confirmación'})).toBeVisible();
});

test('paso 2 intuitivo, ayudas visibles y preferencias separadas del cliente',async({page},testInfo)=>{
  await page.goto('/');await expect(page.getByRole('button',{name:'Texto grande',exact:true})).toBeVisible();
  const navigation=page.getByRole('navigation',{name:'Navegación principal'});
  await expect(navigation.getByRole('link',{name:'Inicio',exact:true}).locator('svg')).toHaveCount(0);
  expect(await navigation.evaluate(nav=>{
    const home=getComputedStyle(nav.querySelector('a[href="#inicio"]')!);const other=getComputedStyle(nav.querySelector('a[href="#catalogo"]')!);
    return home.borderWidth===other.borderWidth&&home.backgroundColor===other.backgroundColor&&home.padding===other.padding;
  })).toBe(true);
  await fisher(page);
  await expect(page.getByRole('region',{name:'Ayudas para tu jornada'})).toBeVisible();
  await expect(page.getByRole('button',{name:'FACILITAR USO',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Texto grande',exact:true})).toHaveCount(0);
  await expect(page.getByRole('checkbox',{name:/Modo fácil/})).toHaveCount(0);
  await expect(page.getByRole('checkbox',{name:/Ver mejor|Dictar cantidades/})).toHaveCount(0);
  await expect(page.locator('.fisher-help-grid > *')).toHaveCount(2);
  await page.getByRole('button',{name:'REGISTRAR Y SUBIR NUEVA PESCA',exact:true}).click();
  const next=page.getByRole('button',{name:'Continuar',exact:true});await next.click();
  await expect(page.getByRole('heading',{name:'Paso 2. Cantidad y precio'})).toBeVisible();
  await expect(page.locator('.sale-form-grid')).toBeVisible();
  await expect(page.getByRole('radio',{name:'Por kilos',exact:true})).toBeChecked();
  for(const radio of await page.locator('.sale-method-options input').all()){
    const rect=await radio.boundingBox();expect(rect!.width).toBeLessThan(32);expect(rect!.height).toBeLessThan(32);
  }
  expect(await page.locator('.sale-method-options label').evaluateAll(labels=>labels.every(label=>{
    const box=label.getBoundingClientRect();const text=label.querySelector('strong')!.getBoundingClientRect();return text.right<=box.right&&text.left>=box.left;
  }))).toBe(true);
  await expect(page.getByRole('button',{name:/DECIR CANTIDAD/})).toHaveCount(0);
  await expect(page.getByRole('spinbutton',{name:'Kilos para vender kg',exact:true})).toHaveValue('5');
  await page.getByRole('spinbutton',{name:'Kilos para vender kg',exact:true}).fill('25');
  await expect(page.locator('.sale-total')).toContainText('450.000');
  await page.getByRole('spinbutton',{name:'Precio por kilo COP',exact:true}).fill('20000');await expect(page.locator('.sale-total')).toContainText('500.000');
  await page.getByRole('button',{name:'Aumentar Precio por kilo',exact:true}).click();await expect(page.getByRole('spinbutton',{name:'Precio por kilo COP',exact:true})).toHaveValue('21000');
  await page.locator('.price-shortcuts').getByRole('button').nth(1).click();await expect(page.locator('.sale-total')).toContainText('450.000');
  await page.getByRole('radio',{name:'Peces del mismo peso',exact:true}).check();await page.getByRole('button',{name:'500 g',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Cantidad de peces para vender peces',exact:true}).fill('4');
  await expect(page.locator('.quantity-summary')).toContainText('4 peces × 0,5 kg = 2 kg');await expect(page.locator('.sale-total')).toContainText('36.000');
  await expect(next).toBeDisabled();await page.getByRole('checkbox',{name:/Todos estos peces pesan lo mismo/}).check();await expect(next).toBeEnabled();
  await page.getByRole('button',{name:'1 kg',exact:true}).click();await expect(next).toBeDisabled();await page.getByRole('checkbox',{name:/Todos estos peces pesan lo mismo/}).check();
  await expect(page.locator('.sale-total')).toContainText('72.000');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:testInfo.outputPath('cantidad-precio.png'),fullPage:true});
  await page.getByRole('radio',{name:'Grande',exact:true}).check();
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await next.click();await next.click();await next.click();
  await page.getByLabel('Elegir foto del producto').setInputFiles(PHOTO);await page.getByRole('button',{name:'PUBLICAR EN LA TIENDA AHORA'}).click();await expect(page.getByRole('heading',{name:'PESCA REGISTRADA'})).toBeVisible();
  await page.reload();await expect(page.locator('html')).toHaveClass(/large-text/);await accountAction(page,'Mi panel de pesca');
  await expect(page.getByRole('radio',{name:'Grande',exact:true})).toBeChecked();
  await loginDemo(page);await expect(page.locator('html')).not.toHaveClass(/high-visibility/);await expect(page.locator('html')).not.toHaveClass(/large-text/);
  await expect(page.getByRole('region',{name:'Ayudas para tu jornada'})).toHaveCount(0);
  const text=page.getByRole('button',{name:'Texto grande',exact:true});await text.click();await expect(page.locator('html')).toHaveClass(/large-text/);
  await page.reload();await expect(text).toHaveAttribute('aria-pressed','true');
});

test('preferencias retiradas no se reactivan y la lectura sigue siendo opcional',async({page})=>{
  await page.goto('/');await fisher(page);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('raiz-rio-demo-v4')!);s.accessibility.highVisibility=true;s.accessibility.voiceInput=true;localStorage.setItem('raiz-rio-demo-v4',JSON.stringify(s));});
  await page.reload();await accountAction(page,'Mi panel de pesca');
  await expect(page.locator('html')).not.toHaveClass(/high-visibility/);
  await expect(page.getByRole('checkbox',{name:/Ver mejor|Dictar cantidades/})).toHaveCount(0);
  await page.getByRole('checkbox',{name:/Leer instrucciones/}).uncheck();await expect(page.getByRole('button',{name:'Escuchar ayuda',exact:true})).toHaveCount(0);
  await page.getByRole('checkbox',{name:/Leer instrucciones/}).check();await expect(page.getByRole('button',{name:'Escuchar ayuda',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/REGISTRAR Y SUBIR/}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByRole('button',{name:/DECIR CANTIDAD/})).toHaveCount(0);
  await page.getByRole('spinbutton',{name:'Kilos para vender kg',exact:true}).fill('12');
  await expect(page.getByRole('spinbutton',{name:'Kilos para vender kg',exact:true})).toHaveValue('12');
  expect(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('raiz-rio-demo-v4')!).accessibility).sort())).toEqual(['readInstructions','textSize']);
});

test('dashboard del cliente sigue pedido, historial y recepción sin exponer otra cuenta',async({page},testInfo)=>{
  await page.goto('/');await expect(page.locator('.impact-strip')).toHaveCount(0);await expect(page.getByRole('button',{name:'Ver origen y captura'})).toHaveCount(0);
  await loginDemo(page);await page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Bocachico',exact:true})}).getByRole('button',{name:'Añadir a mi canasta',exact:true}).click();
  await page.getByRole('button',{name:/Mi canasta/}).click();await page.getByRole('button',{name:'Continuar con mi compra'}).click();
  await page.getByLabel('Celular',{exact:true}).fill('3001234567');await page.getByLabel('Dirección en Barrancabermeja').fill('Calle 10 #20-30');
  await page.getByRole('button',{name:/Simular pago/}).click();await page.getByRole('button',{name:'Autorizar pago ficticio'}).click();
  await page.getByRole('button',{name:'Seguir explorando'}).click();await accountAction(page,/Mis compras/);
  await expect(page.getByRole('heading',{name:'Mis compras',exact:true})).toBeVisible();await expect(page.locator('.purchase-card')).toHaveCount(1);
  await page.getByLabel('Buscar en mis compras').fill('inexistente');await expect(page.locator('.purchase-card')).toHaveCount(0);await page.getByLabel('Buscar en mis compras').fill('');
  await fisher(page);await page.getByRole('button',{name:/Mis pedidos/}).click();await page.getByRole('button',{name:'Pedido preparado en puerto'}).click();await page.getByRole('button',{name:'Enviado con domiciliario'}).click();
  await loginDemo(page);await accountAction(page,/Mis compras/);await expect(page.locator('.purchase-status')).toContainText('En camino');
  await page.getByRole('button',{name:'Confirmar recepción',exact:true}).click();await expect(page.locator('.purchase-status')).toContainText('Recibido');
  await page.getByLabel('Mostrar compras',{exact:true}).selectOption('received');await expect(page.locator('.purchase-card')).toHaveCount(1);
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  await page.screenshot({path:testInfo.outputPath('dashboard-cliente.png'),fullPage:true});
  await page.reload();await accountAction(page,/Mis compras/);await expect(page.locator('.purchase-status')).toContainText('Recibido');
  await accountAction(page,'Cerrar sesión');await openAuth(page);await page.getByRole('tab',{name:'Registro de Usuario'}).click();
  await page.getByLabel('Nombre completo',{exact:true}).fill('Otra Persona');await page.getByLabel('Correo personal').fill('otra@example.com');await page.getByLabel('Teléfono móvil').fill('3001234567');await page.getByLabel('Dirección de entrega en Barrancabermeja').fill('Calle 20 #30-40');await page.getByLabel('Crea tu contraseña').fill('OtraClave123');await page.getByLabel('Confirma tu contraseña').fill('OtraClave123');await page.getByRole('button',{name:'Crear cuenta de cliente'}).click();
  await accountAction(page,/Mis compras/);await expect(page.locator('.purchase-card')).toHaveCount(0);
});
