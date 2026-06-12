import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { confirmSettlement } from "@/lib/settlements";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ settlementId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { settlementId } = await params;
    const settlement = await confirmSettlement(user.id, settlementId);
    return jsonOk({ settlement });
  } catch (error) {
    return serverError(error);
  }
}
