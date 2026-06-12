import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { rollbackLatestRound } from "@/lib/rounds";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { roomId } = await params;
    const round = await rollbackLatestRound(user.id, roomId);
    return jsonOk({ round });
  } catch (error) {
    return serverError(error);
  }
}
