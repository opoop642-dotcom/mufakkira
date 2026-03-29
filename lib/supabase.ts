import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anon)

// ── Types ──────────────────────────────────────
export type Field = {
  id: number
  name_ar: string
  name_en: string
  color: string
  bg: string
  symbol: string
}

export type Note = {
  id: number
  field_id: number
  author_id: string
  author_name: string
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  tags: string[]
  votes: number
  created_at: string
  comment_count?: number
}

export type Comment = {
  id: number
  note_id: number
  parent_id: number | null
  author_id: string
  author_name: string
  body: string
  likes: number
  created_at: string
  replies?: Comment[]
}

export type User = {
  id: string
  username: string
  joined_at: string
}

export type Notification = {
  id: number
  to_user_id: string
  from_name: string
  type: 'comment' | 'reply'
  note_id: number
  note_title: string
  is_read: boolean
  created_at: string
}
