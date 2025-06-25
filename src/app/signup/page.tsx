"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  // Khi trạng thái auth thay đổi (login thành công), redirect về Home
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      router.replace("/");
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Đăng ký / Đăng nhập</h1>
        <Auth
          supabaseClient={supabase}
          providers={["google", "facebook"]}
          magicLink={false}         // false để dùng user+pass hoặc social, bạn có thể bật thành true nếu muốn only magic link
          socialLayout="horizontal"
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#EFD90C",         // màu brand (nút Đăng ký)
                  brandAccent: "#FFC40C",   // hover
                },
              },
            },
          }}
          localization={{
            lang: "vi",
            variables: {
              sign_up: { button_label: "Tạo tài khoản" },
              sign_in: { button_label: "Đăng nhập" },
            },
          }}
        />
      </div>
    </div>
  );
}
