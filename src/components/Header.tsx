// src/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

const MENU = [
  { label: "MBTI", href: "/mbti" },
  { label: "Holland", href: "/holland" },
  { label: "Giá trị bản thân", href: "/knowdell" },
  { label: "Tin tức", href: "/blog" },
  { label: "Chatbot/FAQ", href: "/chat" },
];

export default function Header() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  /* lấy user lần đầu + lắng nghe thay đổi phiên đăng nhập */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  /* xử lý đăng xuất */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      router.refresh(); // làm mới server component & cache
    }
  };

  return (
    <header className="fixed top-0 w-full h-header bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className="text-lg font-semibold text-navText">Hướng nghiệp AI</span>
        </Link>

        {/* Menu */}
        <nav
          className="
            flex items-center gap-8 sm:gap-navGap
            whitespace-nowrap overflow-x-auto scrollbar-hide
            flex-1
          "
        >
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="text-navText hover:text-blue-600 transition"
            >
              {m.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-3 pl-4 flex-shrink-0">
              <Image
                src={user.user_metadata?.avatar_url ?? "/default-avatar.png"}
                alt="avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-navText">
                {user.user_metadata?.full_name ?? user.email}
              </span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/signup"
              className="bg-brandYellow hover:bg-yellow-500 text-white px-5 py-2 rounded-full transition flex-shrink-0"
            >
              Đăng ký / Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
