// src/components/AuthUI.tsx
'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabaseClient } from '@/lib/supabaseClient'

export default function AuthUI() {
  return (
    <div className="grid place-items-center min-h-screen bg-gray-50">
      <Auth
        supabaseClient={supabaseClient}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'facebook']}
        redirectTo={`${location.origin}/auth/callback`}
      />
    </div>
  )
}
