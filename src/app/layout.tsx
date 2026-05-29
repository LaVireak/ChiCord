import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aura UI | Liquid Glass Workspace",
  description: "A premium, context-aware collaboration workspace with a sophisticated liquid glass aesthetic, designed for real-time video calls and developer chat threads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
