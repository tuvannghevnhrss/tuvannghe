// src/components/Providers.tsx
'use client'

import { ReactNode } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function Providers({ children }: { children: ReactNode }) {
  // tạo instance Supabase client cho bên Client
  const supabase = createClientComponentClient()

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}
