import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "A Monitor | A 股监控",
  description: "A 股竞价固定价与涨停压力位监控工具。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="min-h-dvh antialiased dark">
      <body className="min-h-dvh bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
