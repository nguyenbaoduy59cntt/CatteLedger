import { hashPassword } from "@/lib/auth";
import { jsonError, jsonOk, serverError, supabaseError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, displayName, password, confirmPassword } = body;

    if (!username?.trim() || !displayName?.trim() || !password) {
      return jsonError("Vui lòng điền đầy đủ thông tin");
    }
    if (username.length < 3) {
      return jsonError("Username tối thiểu 3 ký tự");
    }
    if (password.length < 4) {
      return jsonError("Mật khẩu tối thiểu 4 ký tự");
    }
    if (password !== confirmPassword) {
      return jsonError("Mật khẩu xác nhận không khớp");
    }

    const supabase = getSupabaseAdmin();
    const passwordHash = await hashPassword(password);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        password_hash: passwordHash,
      })
      .select("id, username, display_name, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError("Username đã tồn tại");
      }
      return supabaseError(error);
    }

    return jsonOk({ user }, 201);
  } catch (error) {
    return serverError(error);
  }
}
