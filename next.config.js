/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
      type: 'asset/resource',
      include: [/node_modules\/@arcana/, /public/],
    },
    {
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource'
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      '@arcana/ca-wagmi': require.resolve('@arcana/ca-wagmi'),
    };

    return config;
  },
  transpilePackages: ['@arcana/ca-wagmi']
}

module.exports = nextConfig 