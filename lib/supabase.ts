import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { fetchWithRetry } from "./fetch-retry";

let adminClient: SupabaseClient | null = null;

function isValidSupabaseJwt(key: string): boolean {
  return key.startsWith("eyJ") && key.length > 100;
}

function validateSupabaseKey(name: string, key: string | undefined): string {
  if (!key || key.includes("your-")) {
    throw new Error(
      `Thiếu hoặc chưa cấu hình ${name} trong .env.local`,
    );
  }
  if (!isValidSupabaseJwt(key)) {
    throw new Error(
      `${name} không hợp lệ. Vào Supabase → Project Settings → API, copy đúng key dạng JWT dài (bắt đầu bằng eyJ...), không phải project ref hay password.`,
    );
  }
  return key;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = validateSupabaseKey(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!url || url.includes("your-project")) {
    throw new Error("Thiếu hoặc chưa cấu hình NEXT_PUBLIC_SUPABASE_URL");
  }

  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = validateSupabaseKey(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!url || url.includes("your-project")) {
    throw new Error("Thiếu hoặc chưa cấu hình NEXT_PUBLIC_SUPABASE_URL");
  }

  return createClient(url, key, {
    global: { fetch: fetchWithRetry },
  });
}
