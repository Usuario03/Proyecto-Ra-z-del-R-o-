import { test, expect, type Page } from '@playwright/test';
import { completeSale, createOrder, initialStore } from '../src/domain';
import { enterDemoCustomer, loginFisher } from '../src/auth/authDomain';
import { accountAction } from './navigation';

async function assertContained(page:Page,label:string){
  const issues=await page.evaluate(()=>{
    const out:string[]=[];
    if(document.documentElement.scrollWidth>innerWidth+1)out.push(`Página: ${document.documentElement.scrollWidth}px > ${innerWidth}px`);
    const selector='.fisher-help-option,.fisher-help-text,.inventory-item,.wizard-card,.sale-field-card,.sale-summary,.fisher-order,.action-feedback,.fisher-metrics>section,.fisher-metrics>button,.fisher-page button';
    for(const card of document.querySelectorAll<HTMLElement>(selector)){
      if(!card.getClientRects().length)continue;
      const box=card.getBoundingClientRect();
      if(box.left< -2||box.right>innerWidth+2)out.push(`${card.className}: fuera de pantalla`);
      const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
      let node:Node|null;
      while((node=walker.nextNode())){
        const parent=node.parentElement;
        if(!node.textContent?.trim()||!parent||parent.closest('.sr-only,svg')||!parent.getClientRects().length)continue;
        const range=document.createRange();range.selectNodeContents(node);
        for(const rect of range.getClientRects())if(rect.width&& (rect.left<box.left-2||rect.right>box.right+2||rect.top<box.top-2||rect.bottom>box.bottom+2))out.push(`${card.className}: «${node.textContent.trim().slice(0,60)}» sale de su caja`);
      }
    }
    for(const option of document.querySelectorAll('.fisher-font-options label')){
      const walker=document.createTreeWalker(option,NodeFilter.SHOW_TEXT);let node:Node|null;
      while((node=walker.nextNode())){
        if(!node.textContent?.trim())continue;
        for(const word of node.textContent.matchAll(/\S+/g)){
          const range=document.createRange();range.setStart(node,word.index!);range.setEnd(node,word.index!+word[0].length);
          if(range.getClientRects().length>1)out.push(`Opción de letras: la palabra «${word[0]}» se parte`);
        }
      }
    }
    return [...new Set(out)];
  });
  expect(issues,`${label}: contenido dentro de las tarjetas`).toEqual([]);
}

for(const settings of [
  {width:320,text:'normal'},
  {width:320,text:'extra'},
  {width:360,text:'large'},
  {width:768,text:'extra'},
] as const){
  test(`portal completo a ${settings.width}px, letras ${settings.text}`,async({page},testInfo)=>{
    test.setTimeout(90000);
    await page.setViewportSize({width:settings.width,height:850});
    let seed=enterDemoCustomer(initialStore());seed.stock.dorada=500;seed.cart={dorada:375};
    seed=completeSale(seed,createOrder(seed,{name:'Cliente con nombre largo para revisar la entrega',phone:'3001234567',address:'Barrio El Centro, Calle 20 número 30-40, ConjuntoResidencialDeLasFamiliasDelRioMagdalena, apartamento 201',slot:'8:00 a. m. – 11:00 a. m.',date:'Mañana'},'PSE'));
    seed=loginFisher(seed,'FP-0113','1234');seed.accessibility={textSize:settings.text,readInstructions:true};
    await page.addInitScript(data=>localStorage.setItem('raiz-rio-demo-v4',JSON.stringify(data)),seed);
    await page.goto('/');await accountAction(page,'Mi panel de pesca');await assertContained(page,'Dashboard e inventario');
    await expect(page.getByRole('button',{name:/DECIR CANTIDAD/})).toHaveCount(0);
    await expect(page.locator('.fisher-help-grid > *')).toHaveCount(2);
    await page.getByRole('button',{name:'Mi perfil',exact:true}).click();await assertContained(page,'Perfil del pescador');
    await page.getByRole('button',{name:/Mis pedidos/}).click();await assertContained(page,'Pedidos y dirección larga');
    await page.getByRole('button',{name:/REGISTRAR Y SUBIR/}).click();await assertContained(page,'Paso 1');
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
    await page.getByRole('radio',{name:'Peces del mismo peso',exact:true}).check();
    await page.getByRole('spinbutton',{name:'Cantidad de peces para vender peces',exact:true}).fill('500');
    await page.getByRole('spinbutton',{name:'Precio por kilo COP',exact:true}).fill('100000');
    await page.getByRole('checkbox',{name:/Todos estos peces pesan lo mismo/}).check();
    await assertContained(page,'Paso 2 con cantidades máximas');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:testInfo.outputPath('panel-revisado.png'),fullPage:true});
    await page.getByRole('button',{name:'Continuar',exact:true}).click();await assertContained(page,'Paso 3');
    await page.getByRole('button',{name:'Continuar',exact:true}).click();await assertContained(page,'Paso 4');
    await page.getByRole('button',{name:'Continuar',exact:true}).click();await assertContained(page,'Paso 5 sin foto');
    await page.getByLabel('Elegir foto del producto').setInputFiles('public/images/magdalena-barrancabermeja-960.webp');
    await expect(page.getByRole('button',{name:'PUBLICAR EN LA TIENDA AHORA'})).toBeEnabled();await assertContained(page,'Paso 5 con foto');
  });
}
