import { Fish, Heart, Leaf, Ruler, ShieldCheck, Waves } from 'lucide-react';
import { minimumFor, MOCK_PRODUCTS } from '../domain';
import { useStore } from '../StoreContext';

export default function EnvironmentalEducation() {
  const {store}=useStore();
  return <section id="pesca-responsable" className="environment-education site-width" aria-labelledby="environment-heading">
    <p className="eyebrow">NUESTRA COMUNIDAD CUIDA SU FUTURO</p><h2 id="environment-heading">Un río sano nos alimenta a todos.</h2>
    <p className="environment-intro">La pesca artesanal es alimento, trabajo y tradición para las familias ribereñas. Cuidar el Magdalena significa permitir que los peces crezcan y se reproduzcan, y que las próximas generaciones también puedan vivir de él.</p>
    <div className="education-grid">
      <article><Leaf/><h3>¿Qué es una veda?</h3><p>Es una restricción que la autoridad establece para proteger una especie en determinados períodos o zonas. Puede coincidir con su reproducción: dar esa pausa ayuda a que haya nuevas generaciones de peces.</p><p>En esta plataforma, una veda activa bloquea la publicación y la compra de los lotes de esa especie. Puedes elegir otra especie habilitada.</p></article>
      <article><Ruler/><h3>¿Por qué hay tallas mínimas?</h3><p>Los peces jóvenes necesitan tiempo para crecer y reproducirse. La talla mínima es una medida de manejo para evitar que se capturen y comercialicen ejemplares demasiado pequeños.</p><p>La talla registrada se compara con el mínimo configurado. Un lote que no cumple queda bloqueado, aunque haya kilos disponibles.</p></article>
      <article><Heart/><h3>¿Por qué lo aplicamos aquí?</h3><p>Una tienda responsable no solo conecta compradores y pescadores: también evita promover capturas que afectan el recurso del que depende la comunidad.</p><p>Los controles se revisan al publicar, añadir a la canasta y confirmar el pago. La trazabilidad permite conocer quién pescó, dónde, cómo y cuándo.</p></article>
    </div>
    <div className="environment-law"><div><ShieldCheck/><h3>Las normas y su propósito</h3></div>
      <dl>
        <div><dt>AUNAP y resoluciones aplicables</dt><dd>La Autoridad Nacional de Acuicultura y Pesca ejerce funciones de manejo y control pesquero. Las medidas concretas, como vedas, tallas y condiciones de pesca, deben consultarse por especie, lugar y período; no son iguales para todos los peces. <a href="https://www.aunap.gov.co/" target="_blank" rel="noreferrer">Consultar la AUNAP</a>.</dd></div>
        <div><dt>Decreto 2811 de 1974</dt><dd>El Código Nacional de Recursos Naturales Renovables y de Protección al Medio Ambiente proporciona el marco general para conservar y aprovechar responsablemente los recursos naturales, incluidos los hidrobiológicos. Proteger el río es parte del uso responsable de esos recursos.</dd></div>
        <div><dt>Ley 2268 de 2022</dt><dd>Forma parte del marco de reconocimiento y beneficios sociales para pescadores artesanales comerciales y de subsistencia. Vincula el proyecto con el bienestar de las familias pescadoras; no sustituye las resoluciones que fijan vedas o tallas.</dd></div>
      </dl>
      <p className="notice"><Waves/><span>ODS 12: consumo y producción responsables. ODS 14: conservación de recursos acuáticos. La plataforma los usa como referentes educativos para promover decisiones de compra y pesca responsables.</span></p>
    </div>
    <section className="environment-status" aria-label="Información ambiental de las especies"><h3><Fish/> ¿Qué indican los controles de esta demostración?</h3><p>Consulta el estado por especie. Una especie sin veda puede tener lotes bloqueados por talla, pausa de venta o inventario.</p><ul>{MOCK_PRODUCTS.map(p=><li key={p.id}><strong>{p.name}</strong><span>{store.bans[p.speciesId]?'Veda activa en la simulación':'Sin veda activa en la simulación'}</span><span>Talla mínima de prueba: {minimumFor(p,store)} cm</span></li>)}</ul></section>
    <p className="environment-note">Información educativa: las fechas y tallas de esta demostración no representan un calendario oficial ni certifican cumplimiento legal. Antes de una actividad comercial real, se deben verificar las resoluciones vigentes y la identificación de cada especie. El administrador gestiona los parámetros; la comunidad consulta su significado y sus efectos.</p>
  </section>;
}
