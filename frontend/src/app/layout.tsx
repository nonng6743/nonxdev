import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nonxdev - รับเขียนโปรแกรม หาโปรแกรมเมอร์ มืออาชีพ",
  description: "รับเขียนโปรแกรม เว็บ แอป บอท และ AI Automation โดยทีมงานโปรแกรมเมอร์มืออาชีพ หาโปรแกรมเมอร์ ต้องที่ nonxdev",
  keywords: ["โปรแกรมเมอร์", "หาโปรแกรมเมอร์", "รับเขียนโปรแกรม", "รับทำเว็บ", "รับทำแอป", "AI Automation"],
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
