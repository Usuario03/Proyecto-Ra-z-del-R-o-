import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles.css';

export const metadata: Metadata = {
  title: 'Raíz del Río',
  description: 'Prototipo local de pesca artesanal de Barrancabermeja.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
