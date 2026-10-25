import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// kalau .env belum diisi, website tetap jalan tanpa fitur login/sewa
export const supabase = url && key ? createClient(url, key) : null;