import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pbqiumuzvzlhkbfvlybq.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_2TIKq45frzizMAzH9t44qw_IymfzwEA";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase URL veya Anon Key eksik. Lütfen .env.local dosyanıza NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini ekleyin."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
