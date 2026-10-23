import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Mode DEMO = belum ada kredensial Supabase -> pakai data contoh di browser.
// Jadi mockup bisa dibuka tanpa setup apa pun.
export const DEMO = !url || !key || url.includes('xxxxxxxxxxxx')

export const supabase = DEMO ? null : createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const FAMILY_NAME = import.meta.env.VITE_FAMILY_NAME || 'Keluarga Besar'