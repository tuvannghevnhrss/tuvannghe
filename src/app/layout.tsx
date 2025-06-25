import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "Hướng nghiệp AI",
  description: "Trang tư vấn nghề nghiệp bằng AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 antialiased">
        <Header />
        <main className="pt-header">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
