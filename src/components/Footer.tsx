import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 bg-gray-100 py-8 text-sm text-gray-600">
      <div className="container mx-auto px-4">
        <nav className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/pricing" className="hover:text-gray-900">Bảng giá</Link>
          <Link href="/blog" className="hover:text-gray-900">Blog</Link>
          <Link href="/phongtran" className="hover:text-gray-900">Liên hệ</Link>
          <Link href="/terms" className="hover:text-gray-900">Điều khoản sử dụng</Link>
          <Link href="/privacy" className="hover:text-gray-900">Chính sách bảo mật</Link>
          <Link href="/refund" className="hover:text-gray-900">Chính sách hoàn tiền</Link>
        </nav>
        <p className="text-center">
          © {new Date().getFullYear()} Tư vấn nghề nghiệp. Hướng nghiệp và phỏng vấn với AI.
        </p>
      </div>
    </footer>
  );
}
