import "./globals.css";
import { Providers } from './providers';

export const metadata = {
    title: "QRCheckin",
    description: "QR Check-in System",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
