// src/app/layout.tsx
'use client';

import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
// Giả sử bạn có thư mục styles ở root dự án
import '../../styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Tạo client browser chỉ một lần
  const [supabase] = useState(() => createBrowserSupabaseClient());

  return (
    <html lang="vi">
      <body>
        <SessionContextProvider supabaseClient={supabase}>
          {children}
        </SessionContextProvider>
      </body>
    </html>
  );
}
