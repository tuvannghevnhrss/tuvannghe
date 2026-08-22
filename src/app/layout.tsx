import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import Header from "@/components/HeaderSafe";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tư vấn nghề | Hướng nghiệp và phỏng vấn với AI",
  description:
    "Nền tảng giúp bạn hiểu bản thân, chọn hướng nghề nghiệp và luyện phỏng vấn với AI.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body className="bg-gray-50 antialiased">
        <Header />
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
