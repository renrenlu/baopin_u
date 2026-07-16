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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "每日爆品讯息｜每天练一双爆品眼睛",
  description: "每日爆品案例、导读摘要与 PDF 原刊归档。按日期检索，随时在线阅读或下载。",
  openGraph: {
    title: "每日爆品讯息",
    description: "每天看一组案例，练一双爆品眼睛。",
    type: "website",
    images: [{
      url: `${siteUrl}/og-daily-intel.jpg`,
      width: 1536,
      height: 1024,
      alt: "每日爆品讯息：每天看一组案例，练一双爆品眼睛。",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "每日爆品讯息",
    description: "每天看一组案例，练一双爆品眼睛。",
    images: [`${siteUrl}/og-daily-intel.jpg`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
