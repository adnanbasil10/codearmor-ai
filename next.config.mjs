/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"]
          }
        : false
  },
  eslint: {
    ignoreDuringBuilds: false
  }
};

export default nextConfig;

