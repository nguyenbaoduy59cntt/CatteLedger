import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk, serverError, unauthorized } from "@/lib/api";
import { createRoom, listPublicRooms } from "@/lib/rooms";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rooms = await listPublicRooms();
    return jsonOk({ rooms });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const { name, password, confirmPassword } = body;

    if (!name?.trim() || !password) {
      return jsonError("Vui lòng điền đầy đủ thông tin");
    }
    if (password !== confirmPassword) {
      return jsonError("Mật khẩu xác nhận không khớp");
    }

    const room = await createRoom(user.id, name, password);
    return jsonOk({ room }, 201);
  } catch (error) {
    return serverError(error);
  }
}
