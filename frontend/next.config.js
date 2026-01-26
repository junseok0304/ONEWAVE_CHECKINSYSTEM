/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        const isDevelopment = process.env.NODE_ENV === 'development';

        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: isDevelopment
                            ? "default-src 'self' http://localhost:8080 https: data: 'unsafe-inline' 'unsafe-eval';"
                            : "upgrade-insecure-requests; default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';"
                    }
                ],
            },
        ];
    },
};

export default nextConfig;
