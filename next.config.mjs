/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Desactivar la generación estática para resolver problemas de despliegue
  staticPageGenerationTimeout: 120, // Aumentar el tiempo de espera a 120 segundos
};

export default nextConfig;
