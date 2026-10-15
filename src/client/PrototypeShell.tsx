'use client';

import dynamic from 'next/dynamic';

// Transición exclusivamente local: Store y acceso demo siguen en el navegador.
// No importar ni renderizar el prototipo durante SSR; no es todavía un backend.
const Prototype = dynamic(() => import('../PlataformaPescaDual'), {
  ssr: false,
  loading: () => <p role="status">Cargando prototipo local…</p>,
});

export default function PrototypeShell() {
  return <Prototype />;
}
