import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return jsonError("Bạn cần đăng nhập", 401);
}

export function forbidden() {
  return jsonError("Không có quyền thực hiện", 403);
}

export function notFound(message = "Không tìm thấy") {
  return jsonError(message, 404);
}

export function supabaseError(error: { message?: string; code?: string }) {
  const message = error.message ?? "Lỗi Supabase";
  if (message.includes("fetch failed") || message.includes("ECONNRESET")) {
    return jsonError(
      "Không kết nối được Supabase (mạng công ty/VPN chặn hoặc không ổn định). Thử tắt VPN, đổi mạng hotspot, hoặc chạy `npm run check:db` để kiểm tra.",
      503,
    );
  }
  if (error.code === "23505") {
    return jsonError("Dữ liệu đã tồn tại");
  }
  return jsonError(message, 400);
}

export function serverError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
  console.error(error);
  if (message.includes("eyJ") || message.includes("Supabase")) {
    return jsonError(message, 400);
  }
  if (message.includes("fetch failed") || message.includes("ECONNRESET")) {
    return jsonError(
      "Không kết nối được Supabase. Kiểm tra URL/keys trong .env.local (key phải là JWT dài bắt đầu eyJ...) và mạng/VPN.",
      503,
    );
  }
  return jsonError(message, 500);
}
