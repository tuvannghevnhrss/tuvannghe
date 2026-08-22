"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Map một số lỗi phổ biến từ Supabase/OAuth sang tiếng Việt dễ hiểu hơn */
function translateAuthError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("email not confirmed"))
    return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư (kể cả mục Spam) và bấm vào liên kết xác nhận.";
  if (msg.includes("invalid login credentials"))
    return "Email hoặc mật khẩu không đúng.";
  if (msg.includes("already registered") || msg.includes("already exists"))
    return "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng chức năng “Quên mật khẩu?”.";
  if (msg.includes("provider is not enabled") || msg.includes("unsupported provider"))
    return "Phương thức đăng nhập này chưa được kích hoạt trên hệ thống. Vui lòng thử phương thức khác.";
  if (msg.includes("redirect") && msg.includes("not allowed"))
    return "Địa chỉ chuyển hướng chưa được cho phép trong cấu hình đăng nhập. Vui lòng liên hệ quản trị viên.";
  return `Đã có lỗi xảy ra: ${raw}`;
}

export default function SignupClient() {
  const router        = useRouter();
  const sp            = useSearchParams();
  const redirectedFrom = sp.get("redirectedFrom") || "/";
  const authError      = sp.get("auth_error");
  const supabase      = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace(redirectedFrom);
    });
    return () => data.subscription?.unsubscribe?.();
  }, [supabase, router, redirectedFrom]);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?redirectedFrom=${encodeURIComponent(redirectedFrom)}`
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Đăng ký / Đăng nhập</h1>
        {authError && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {translateAuthError(authError)}
          </div>
        )}
        <Auth
          supabaseClient={supabase}
          providers={["google", "facebook"]}
          redirectTo={redirectTo}
          magicLink={false}
          socialLayout="horizontal"
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: { colors: { brand: "#EFD90C", brandAccent: "#FFC40C" } },
            },
          }}
          localization={{
            variables: {
              sign_up: {
                email_label: "Địa chỉ email",
                password_label: "Tạo mật khẩu",
                email_input_placeholder: "Email của bạn",
                password_input_placeholder: "Mật khẩu của bạn",
                button_label: "Tạo tài khoản",
                loading_button_label: "Đang tạo tài khoản...",
                social_provider_text: "Đăng nhập với {{provider}}",
                link_text: "Chưa có tài khoản? Đăng ký",
                confirmation_text: "Vui lòng kiểm tra email để xác nhận tài khoản",
              },
              sign_in: {
                email_label: "Địa chỉ email",
                password_label: "Mật khẩu",
                email_input_placeholder: "Email của bạn",
                password_input_placeholder: "Mật khẩu của bạn",
                button_label: "Đăng nhập",
                loading_button_label: "Đang đăng nhập...",
                social_provider_text: "Đăng nhập với {{provider}}",
                link_text: "Đã có tài khoản? Đăng nhập",
              },
              forgotten_password: {
                email_label: "Địa chỉ email",
                password_label: "Mật khẩu",
                email_input_placeholder: "Email của bạn",
                button_label: "Gửi hướng dẫn đặt lại mật khẩu",
                loading_button_label: "Đang gửi...",
                link_text: "Quên mật khẩu?",
                confirmation_text: "Vui lòng kiểm tra email để lấy liên kết đặt lại mật khẩu",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
