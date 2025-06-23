'use client'
import { useState } from 'react'
import Image        from 'next/image'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function LoginPage() {
  const supabase = useSupabaseClient()
  const router   = useRouter()
  const [email, setEmail]   = useState('')
  const [loading, setLoad]  = useState(false)

  /* Đăng nhập OTP qua email */
  const handleEmail = async () => {
    setLoad(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/chat' },
    })
    setLoad(false)
    alert(error ? 'Lỗi: ' + error.message : 'Hãy kiểm tra email của bạn!')
  }

  /* Đăng nhập OAuth */
  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoad(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/chat' },
    })
    setLoad(false)
    if (error) alert('Lỗi: ' + error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="py-6 px-8">
          <h1 className="text-2xl font-bold mb-4 text-center">Đăng nhập</h1>
          <p className="text-center text-black mb-6">
            Sử dụng Google, Facebook hoặc email
          </p>

          {/* GOOGLE */}
          <button
            disabled={loading}
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center
                       border border-gray-300 rounded-md py-2 mb-3
                       hover:bg-gray-100 active:scale-95 transition"
          >
            {/* đảm bảo đã có /icons/google.svg trong thư mục public */}
            <Image src="/icons/google.svg" alt="" width={20} height={20} className="mr-2"/>
            Tiếp tục với Google
          </button>

          {/* FACEBOOK */}
          <button
            disabled={loading}
            onClick={() => handleOAuth('facebook')}
            className="w-full flex items-center justify-center
                       border border-gray-300 rounded-md py-2 mb-6
                       hover:bg-gray-100 active:scale-95 transition"
          >
            <Image src="/icons/facebook.svg" alt="" width={20} height={20} className="mr-2"/>
            Tiếp tục với Facebook
          </button>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <hr className="flex-grow border-gray-300"/>
            <span className="px-2 text-gray-500 text-xs">HOẶC</span>
            <hr className="flex-grow border-gray-300"/>
          </div>

          {/* EMAIL OTP */}
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none"
          />
          <button
            disabled={!email || loading}
            onClick={handleEmail}
            className="w-full bg-indigo-600 text-white rounded-md py-2
                       hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Đang gửi…' : 'Gửi link đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  )
}
