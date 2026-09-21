import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sikasep — Sistem Kasir Suara Enterpreneur Purwakarta",
  description:
    "Catat transaksi warung Purwakarta cukup bicara. Kasir digital berbasis AI untuk UMKM lokal.",
  keywords: ["kasir", "POS", "UMKM", "suara", "voice", "AI", "warung", "toko", "purwakarta", "sunda"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sikasep",
  },
};

export const viewport: Viewport = {
  themeColor: "#1aad7c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <head>
        <meta name="dicoding:email" content="ahmadrizki11@wastukancana.ac.id" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
