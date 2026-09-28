import { ArrowUpRight, Leaf } from 'lucide-react';

export default function RiverHero() {
  return <section className="hero">
    <div className="hero-copy"><div className="eyebrow flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#638657]"/> DE NUESTRAS MANOS A TU HOGAR</div>
      <h1>Del río Magdalena<br/>a tu mesa, <em>con frescura<br className="hidden lg:block"/> y tradición.</em></h1>
      <p className="hero-description">Pesca fresca, historias reales y un precio justo. Conecta con las familias pescadoras de FEDEPESAN y lleva lo mejor de nuestra tierra a tu mesa.</p>
      <a className="btn-primary w-fit" href="#catalogo">Ver pesca del día <ArrowUpRight size={20}/></a>
      <div className="hero-proof"><div className="avatar-stack"><span>JR</span><span>MD</span><span>RE</span></div><div><strong>1.200 familias, un mismo río.</strong><p>Población objetivo del proyecto · datos ilustrativos.</p></div></div>
    </div>
    <figure className="hero-visual hero-photograph">
      {/* Archivo local: evita depender de un servidor de imágenes al abrir la tienda.
          srcSet entrega HD en pantallas de alta densidad y una versión menor en móvil. */}
      <img className="hero-river-photo" src="/images/magdalena-barrancabermeja-1920.webp"
        srcSet="/images/magdalena-barrancabermeja-960.webp 960w, /images/magdalena-barrancabermeja-1920.webp 1920w"
        sizes="(min-width: 1536px) 750px, (min-width: 1024px) 49vw, 100vw"
        width={1920} height={1440} fetchPriority="high" loading="eager" decoding="async"
        alt="Atardecer sobre el río Magdalena desde el muelle de Barrancabermeja, con una embarcación navegando hacia la orilla"/>
      <div className="hero-photo-shade" aria-hidden="true"/>
      <div className="scene-label"><span className="h-2 w-2 rounded-full bg-leaf"/> EL MAGDALENA · NUESTRA RAÍZ</div>
      <div className="hero-stamp"><Leaf size={24}/><span>De origen<br/><strong>responsable</strong></span></div>
      <figcaption className="hero-photo-caption">
        <div className="hero-photo-story"><span>Tradición que alimenta.<br/><strong>Un río que nos une.</strong></span><span>Muelle de Barrancabermeja<br/>Santander, Colombia</span></div>
        <p className="hero-photo-credit">Foto: <a href="https://commons.wikimedia.org/wiki/File:Atardecer_en_el_Muelle_de_Barrancabermeja.jpg" target="_blank" rel="noreferrer">Renato Revueltas</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> · Recorte adaptado</p>
      </figcaption>
    </figure>
  </section>;
}
