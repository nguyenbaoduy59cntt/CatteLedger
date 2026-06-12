import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk, serverError, unauthorized } from "@/lib/api";
import { joinRoom } from "@/lib/rooms";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { roomId } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password) return jsonError("Vui lòng nhập mật khẩu phòng");

    await joinRoom(user.id, roomId, password);
    return jsonOk({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
