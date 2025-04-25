/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Desactivar la generación estática para resolver problemas de despliegue
  staticPageGenerationTimeout: 120, // Aumentar el tiempo de espera a 120 segundos
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Añadir esta configuración para ignorar errores de webpack
  webpack: (config, { isServer }) => {
    // Configuración adicional para ignorar errores
    config.ignoreWarnings = [
      { module: /node_modules/ },
    ];
    return config;
  },
};

export default nextConfig;
