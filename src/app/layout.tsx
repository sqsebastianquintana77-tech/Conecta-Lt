import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = 'https://conecta-lt.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Conecta-Lt | Directorio de Licores, Tascas y Bodegones en Los Teques',
    template: '%s | Conecta-Lt',
  },
  description:
    'Descubre las mejores licorerías, tascas y bodegones de Los Teques, Estado Miranda. Directorio hiperlocal con promociones, reseñas y más.',
  keywords: [
    'Conecta-Lt', 'Los Teques', 'licorerías', 'tascas', 'bodegones',
    'directorio', 'Venezuela', 'Estado Miranda', 'vinos', 'rones', 'cerveza artesanal',
  ],
  authors: [{ name: 'Conecta-Lt' }],
  openGraph: {
    title: 'Conecta-Lt | Directorio de Licores, Tascas y Bodegones en Los Teques',
    description: 'Encuentra las mejores licorerías, tascas y bodegones de Los Teques',
    type: 'website',
    url: SITE_URL,
    siteName: 'Conecta-Lt',
    locale: 'es_VE',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Conecta-Lt' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conecta-Lt | Directorio en Los Teques',
    description: 'Las mejores licorerías, tascas y bodegones de Los Teques',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}