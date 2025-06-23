export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      results: {
        Row: { id: number; user_id: string; mbti_code: string; created_at: string }
        Insert: { user_id: string; mbti_code: string }
        Update: { mbti_code?: string }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          user_id: string
          role: 'user' | 'assistant'
          content: string
        }
        Update: {}
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
