"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectedFrom = sp.get("redirectedFrom") || "/";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setCheckingSession(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "USER_UPDATED") {
        router.replace(redirectedFrom);
      }
    });
    return () => data.subscription?.unsubscribe?.();
  }, [supabase, router, redirectedFrom]);

  if (checkingSession) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center space-y-3">
          <h1 className="text-xl font-bold">Liên kết đã hết hạn</h1>
          <p className="text-sm text-gray-600">
            Vui lòng yêu cầu đặt lại mật khẩu lần nữa từ trang đăng nhập.
          </p>
          <a
            href="/signup"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Quay lại đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Đặt lại mật khẩu</h1>
        <Auth
          supabaseClient={supabase}
          view="update_password"
          providers={[]}
          showLinks={false}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: { colors: { brand: "#EFD90C", brandAccent: "#FFC40C" } },
            },
          }}
          localization={{
            variables: {
              update_password: {
                password_label: "Mật khẩu mới",
                password_input_placeholder: "Nhập mật khẩu mới",
                button_label: "Cập nhật mật khẩu",
                loading_button_label: "Đang cập nhật...",
                confirmation_text: "Mật khẩu của bạn đã được cập nhật",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
