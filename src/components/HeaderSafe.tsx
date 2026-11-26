"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChartBarSquareIcon,
  SparklesIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const MENU = [
  { label: "Hướng nghiệp", href: "/career" },
  { label: "Phỏng vấn AI", href: "/interview" },
  { label: "Bảng giá", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Tuyển dụng", href: "/tuyendung" },
  { label: "Liên hệ", href: "/phongtran" },
];

const ACCOUNT_MENU_GROUPS = [
  {
    heading: "TÀI KHOẢN",
    items: [
      {
        label: "Tài khoản của tôi",
        description: "Quản lý tài khoản và sản phẩm",
        href: "/account",
        icon: UserIcon,
      },
    ],
  },
  {
    heading: "KẾT QUẢ & TIẾN ĐỘ",
    items: [
      {
        label: "Kết quả hướng nghiệp",
        description: "MBTI · Holland · Knowdell",
        href: "/profile?step=trait",
        icon: SparklesIcon,
      },
      {
        label: "Tiến độ phỏng vấn AI",
        description: "Lịch sử · điểm số · tiến bộ",
        href: "/interview/dashboard",
        icon: ChartBarSquareIcon,
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderSafe() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAvatarFailed(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Tài khoản";

  const avatarUrl =
    !avatarFailed ? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null : null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="sm:h-10 sm:w-10" priority />
          <span className="whitespace-nowrap text-base font-semibold text-navText sm:text-lg">Tư vấn nghề nghiệp</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-4 whitespace-nowrap lg:flex lg:gap-8 xl:gap-12">
          {MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition sm:text-base ${
                isActive(pathname, item.href)
                  ? "font-semibold text-slate-950"
                  : "text-navText hover:text-blue-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={24}
                    height={24}
                    unoptimized
                    onError={() => setAvatarFailed(true)}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-6 w-6 text-gray-500" />
                )}
                <span className="max-w-[120px] truncate">{displayName}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-100 bg-white py-2 shadow-lg">
                  {ACCOUNT_MENU_GROUPS.map((group, groupIndex) => (
                    <div key={group.heading} className={groupIndex > 0 ? "mt-1 border-t border-gray-100 pt-1" : ""}>
                      <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        {group.heading}
                      </p>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-start gap-3 px-4 py-2.5 text-sm transition hover:bg-gray-50"
                          >
                            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                            <span className="min-w-0">
                              <span className="block font-medium text-gray-900">{item.label}</span>
                              <span className="block truncate text-xs text-gray-500">{item.description}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/signup?redirectedFrom=${encodeURIComponent(pathname)}`}
              className="hidden whitespace-nowrap rounded-full bg-brandYellow px-4 py-1.5 text-sm text-black transition hover:bg-yellow-500 sm:inline-block sm:text-base"
            >
              Đăng ký / Đăng nhập
            </Link>
          )}

          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="p-2 text-gray-600 transition hover:text-gray-800 lg:hidden"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          >
            {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden">
          <div className="absolute right-0 top-0 h-full w-3/4 max-w-xs overflow-y-auto bg-white p-6 shadow-lg">
            <nav className="flex flex-col gap-4">
              {MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-base transition hover:text-blue-600 ${
                    isActive(pathname, item.href) ? "font-semibold text-slate-950" : "text-gray-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-gray-200 pt-4">
              {user ? (
                <div className="space-y-3">
                  <p className="truncate text-sm font-medium text-gray-700">{displayName}</p>
                  {ACCOUNT_MENU_GROUPS.map((group) => (
                    <div key={group.heading}>
                      <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        {group.heading}
                      </p>
                      <div className="space-y-1.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                              <Icon className="h-5 w-5 shrink-0 text-gray-400" />
                              <span className="min-w-0 flex-1 text-left">
                                <span className="block font-medium">{item.label}</span>
                                <span className="block truncate text-xs text-gray-500">{item.description}</span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 text-center text-sm text-red-500 transition hover:bg-red-100"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link
                  href={`/signup?redirectedFrom=${encodeURIComponent(pathname)}`}
                  onClick={() => setMenuOpen(false)}
                  className="block w-full rounded-full bg-brandYellow px-4 py-2 text-center text-black transition hover:bg-yellow-500"
                >
                  Đăng ký / Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
