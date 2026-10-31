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
  title: "The Monday Club Scholarship | Application Portal & Committee Review",
  description:
    "Official scholarship application and AI-assisted committee review platform for The Monday Club (Delaware State University & local Delaware high schools).",
  icons: {
    icon: [
      { url: '/Logo.png', type: 'image/png' },
      { url: '/Logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/Logo.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/Logo.png',
    apple: '/Logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/Logo.png" type="image/png" />
        <link rel="shortcut icon" href="/Logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
      </head>
      <body
        className="w-full bg-[#090d16] text-slate-100 selection:bg-blue-600 selection:text-white"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
