import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Artefactos dentro del directorio ya ignorado por Git.
  distDir: 'dist/next',
};

export default nextConfig;
