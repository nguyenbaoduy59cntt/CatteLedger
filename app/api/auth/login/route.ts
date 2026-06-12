import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk, serverError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username?.trim() || !password) {
      return jsonError("Vui lòng nhập username và mật khẩu");
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, display_name, password_hash, created_at")
      .eq("username", username.trim().toLowerCase())
      .maybeSingle();

    if (error || !user) {
      return jsonError("Username hoặc mật khẩu không đúng", 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonError("Username hoặc mật khẩu không đúng", 401);
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    const { password_hash: _, ...safeUser } = user;
    return jsonOk({ user: safeUser });
  } catch (error) {
    return serverError(error);
  }
}
