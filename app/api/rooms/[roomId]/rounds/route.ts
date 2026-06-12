import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk, serverError, unauthorized } from "@/lib/api";
import { getRoomRounds, submitRound } from "@/lib/rounds";
import type { RoundType } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { roomId } = await params;
    const rounds = await getRoomRounds(roomId);
    return jsonOk({ rounds });
  } catch (error) {
    return serverError(error);
  }
}

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

    if (!winnerId || !type) {
      return jsonError("Thiếu thông tin ván");
    }
    if (!["NORMAL", "BURN", "PENALTY"].includes(type)) {
      return jsonError("Loại ván không hợp lệ");
    }

    const round = await submitRound(
      user.id,
      roomId,
      winnerId,
      type,
      penaltyPayerId,
    );
    return jsonOk({ round }, 201);
  } catch (error) {
    return serverError(error);
  }
}
