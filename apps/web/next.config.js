/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/supercalifragilisticoespiralidoso',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    return config;
  },
  async rewrites() {
    return [
      { source: '/acceso', destination: '/login' },
      { source: '/acceso/:slug', destination: '/login/:slug' },
      { source: '/inicio', destination: '/landing' },
      { source: '/gestion', destination: '/dashboard' },
      { source: '/gestion/:path*', destination: '/:path*' },
      { source: '/entidades', destination: '/clubs' },
      { source: '/entidades/:id', destination: '/clubs/:id' },
      { source: '/panel', destination: '/platform' },
      { source: '/panel/:path*', destination: '/platform/:path*' },
      { source: '/usuarios', destination: '/users' },
      { source: '/novedades', destination: '/news' },
      { source: '/eventos', destination: '/events' },
    ];
  },
};

module.exports = nextConfig;
