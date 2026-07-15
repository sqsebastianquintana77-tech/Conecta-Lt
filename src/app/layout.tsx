import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conecta-Lt | Directorio de Licores, Tascas y Bodegones en Los Teques",
  description:
    "Descubre las mejores licorerías, tascas y bodegones de Los Teques, Estado Miranda. Directorio hiperlocalizado con promociones, reseñas y más.",
  keywords: [
    "Conecta-Lt",
    "Los Teques",
    "licorerías",
    "tascas",
    "bodegones",
    "directorios",
    "Venezuela",
    "Estado Miranda",
    "vinos",
    "rones",
    "cerveza artesanal",
  ],
  authors: [{ name: "Conecta-Lt" }],
  openGraph: {
    title: "Conecta-Lt | Directorio de Licores en Los Teques",
    description:
      "Encuentra las mejores licorerías, tascas y bodegones de Los Teques",
    type: "website",
  },
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