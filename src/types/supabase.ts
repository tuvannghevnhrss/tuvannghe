/** Kiểu JSON (an toàn) */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/** Mô tả schema do Supabase Gen sinh (rút gọn) */
export interface Database {
  public: {
    Tables: {
      results: {
        Row: {
          id: number;
          user_id: string;
          mbti_code: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mbti_code: string;
        };
        Update: {
          mbti_code?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
        };
        /** `{}` ➜ Record<string, never> để khỏi lỗi ban-types */
        Update: Record<string, never>;
      };
    };
    /** Chưa dùng tới → tránh `{}` trống */
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
