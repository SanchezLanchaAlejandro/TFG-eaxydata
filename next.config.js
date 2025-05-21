/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['zrdwatcwdrbicvdgqoxj.supabase.co'],
  },
  // Configuración para ignorar errores de ESLint durante la compilación
  eslint: {
    // Ignorar los errores durante la compilación de producción
    ignoreDuringBuilds: true,
  },
  // Configuración para ignorar errores de TypeScript durante la compilación
  typescript: {
    // Ignorar los errores de tipo durante la compilación
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 