/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_MODE === 'static' ? 'export' : undefined,
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  images: {
    unoptimized: true,
  },
  // Ensure we properly compile for Node.js environment when needed
  webpack: (config, { isServer }) => {
    if (isServer && process.env.BUILD_MODE === 'standalone') {
      config.optimization.moduleIds = 'named'
      config.output.library = { type: 'commonjs2' }
    }
    return config
  },
}

module.exports = nextConfig
