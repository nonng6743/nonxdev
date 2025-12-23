import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nonxdev.com'),
  title: {
    default: 'NONXDEV STUDIO | รับเขียนโปรแกรม รับทำเว็บไซต์ ระบบ AI ครบวงจร',
    template: '%s | NONXDEV STUDIO'
  },
  description: 'nonxdev ให้บริการรับทำเว็บไซต์ แอปพลิเคชัน และระบบ AI Automation ระดับองค์กร ด้วยเทคโนโลยีล้ำสมัย Next.js, WebGL และ Cloud Architecture ปรึกษาฟรี',
  keywords: [
    'รับเขียนโปรแกรม', 'รับทำเว็บไซต์', 'รับทำเว็บ', 'จ้างเขียนโปรแกรม', 'จ้างทำเว็บไซต์', 
    'Software House Thailand', 'Web Development Agency', 'AI Integration', 
    'Next.js Developer', 'React Developer', 'รับทำแอปมือถือ', 'ระบบหลังบ้าน'
  ],
  authors: [{ name: 'NONXDEV STUDIO' }],
  creator: 'NONXDEV STUDIO',
  publisher: 'NONXDEV STUDIO',
  openGraph: {
    title: 'NONXDEV STUDIO | Enterprise Software & Web Development',
    description: 'พาร์ทเนอร์ด้านเทคโนโลยีของคุณ รับทำเว็บไซต์และระบบซอฟต์แวร์มาตรฐานสากล',
    url: 'https://nonxdev.com',
    siteName: 'NONXDEV STUDIO',
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NONXDEV STUDIO - Premium Digital Solutions',
    description: 'Custom Software, Web Apps, and AI Automation services.',
    creator: '@nonxdev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import JsonLd from "@/components/layout/JsonLd";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} antialiased bg-black text-white`}
      >
        <JsonLd />
        <LanguageProvider>
          <Navbar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
