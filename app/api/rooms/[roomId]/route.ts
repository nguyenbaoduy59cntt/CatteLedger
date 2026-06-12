import { getCurrentUser } from "@/lib/auth";
import { jsonOk, notFound, serverError, unauthorized } from "@/lib/api";
import { getRoomDetail } from "@/lib/rooms";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { roomId } = await params;
    const room = await getRoomDetail(roomId, user.id);
    if (!room) return notFound("Phòng không tồn tại");

    return jsonOk({ room });
  } catch (error) {
    return serverError(error);
  }
}
