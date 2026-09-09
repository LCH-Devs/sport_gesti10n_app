function flagOn(name) {
  const v = (process.env[name] || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.localhost', 'localhost'],
  images: {
    unoptimized: true,
  },
};

// El hook vacío se deja en el default (Webpack). Con WEB_DEV_TURBO hay que
// omitirlo: si no, Next se queda en Webpack y ignora --turbopack.
if (!flagOn('WEB_DEV_TURBO')) {
  nextConfig.webpack = (config) => config;
}

module.exports = nextConfig;
