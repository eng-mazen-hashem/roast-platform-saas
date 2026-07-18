/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimizes the production bundle size and disables console logs in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Whitelist standard external assets domains if required (e.g. Supabase Storage urls)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
