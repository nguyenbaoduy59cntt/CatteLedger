import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { leaveRoom } from "@/lib/rooms";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { roomId } = await params;
    await leaveRoom(user.id, roomId);
    return jsonOk({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
