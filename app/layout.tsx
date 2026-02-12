import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecondMe App",
  description: "集成 SecondMe API 的智能应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
