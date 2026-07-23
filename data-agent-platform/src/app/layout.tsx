import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalShortcuts from "@/components/GlobalShortcuts";
import { auth } from "@/auth";
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
  title: "Data Agent Platform",
  description: "Data Agent Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <GlobalShortcuts />
        {children}
      </body>
    </html>
  );
}
