/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/api/admin/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/admin/:path*`,
        },
        {
          source: '/api/bookings/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/bookings/:path*`,
        },
        {
          source: '/api/bookings',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/bookings`,
        },
        {
          source: '/api/packages/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/packages/:path*`,
        },
        {
          source: '/api/packages',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/packages`,
        },
        {
          source: '/api/tests/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/tests/:path*`,
        },
        {
          source: '/api/tests',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/tests`,
        },
        {
          source: '/api/coupons/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/coupons/:path*`,
        },
        {
          source: '/api/coupons',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/coupons`,
        },
        {
          source: '/api/prescriptions/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/prescriptions/:path*`,
        },
        {
          source: '/api/prescriptions',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/prescriptions`,
        },
        {
          source: '/api/settings',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/settings`,
        },
        {
          source: '/api/stats',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25'}/api/stats`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
