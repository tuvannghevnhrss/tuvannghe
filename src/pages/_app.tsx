// src/pages/_app.tsx
import '../styles/globals.css';    // ← quan trọng: chỉ một cấp lên tới styles
import type { AppProps } from 'next/app';
import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default function MyApp({ Component, pageProps }: AppProps) {
  const [supabase] = useState(() => createBrowserSupabaseClient());

  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={(pageProps as any).initialSession}
    >
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}
