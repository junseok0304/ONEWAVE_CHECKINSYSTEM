/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: '/api/:path*',
                    destination: 'http://localhost:8081/api/:path*',
                },
            ],
        };
    },
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
                            ? "default-src 'self' http://localhost:8080 http://localhost:8081 https: data: blob: 'unsafe-inline' 'unsafe-eval'; media-src 'self' data: blob: https:;"
                            : "upgrade-insecure-requests; default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; media-src 'self' data: blob: https:;"
                    }
                ],
            },
        ];
    },
};

export default nextConfig;
