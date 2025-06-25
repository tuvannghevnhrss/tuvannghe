"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  // Khi user click magic-link, URL sẽ có ?access_token=…&refresh_token=… 
  useEffect(() => {
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      // trao đổi code lấy session
      supabase.auth
        .exchangeCodeForSession({ code: accessToken })
        .then(({ error }) => {
          if (!error) router.replace("/"); // redirect về Home
        });
    }
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setMessage("Đã có lỗi: " + error.message);
    } else {
      setMessage(
        "✅ Link đăng nhập đã được gửi vào email. Vui lòng kiểm tra hộp thư."
      );
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Nhập email của bạn"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border px-3 py-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Đang gửi..." : "Gửi Link Đăng Nhập"}
      </button>
      {message && <p className="text-center text-gray-700">{message}</p>}
    </form>
  );
}
