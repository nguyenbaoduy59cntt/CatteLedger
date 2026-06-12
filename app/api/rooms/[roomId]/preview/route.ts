import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk, serverError, unauthorized } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getActiveRoomMembers, previewRound } from "@/lib/rounds";
import type { RoundType } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { roomId } = await params;
    const body = await request.json();
    const { winnerId, type, penaltyPayerId } = body as {
      winnerId: string;
      type: RoundType;
      penaltyPayerId?: string;
    };

    if (!winnerId || !type) return jsonError("Thiếu thông tin ván");

    const supabase = getSupabaseAdmin();
    const members = await getActiveRoomMembers(supabase, roomId);
    const winner = members.find((m) => m.id === winnerId);
    if (!winner) return jsonError("Người thắng không hợp lệ");

    const preview = previewRound(type, winner, members, penaltyPayerId);
    return jsonOk({ preview });
  } catch (error) {
    return serverError(error);
  }
}
