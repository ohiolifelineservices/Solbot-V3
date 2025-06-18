/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Ignore pino-pretty to avoid build issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };
    
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://work-2-uxwtyonxjkkirrey.prod-runtime.all-hands.dev'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://work-2-uxwtyonxjkkirrey.prod-runtime.all-hands.dev/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
}

module.exports = nextConfig