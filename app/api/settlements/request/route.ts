import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk, serverError, unauthorized } from "@/lib/api";
import { requestSettlement } from "@/lib/settlements";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const { creditorId } = body;

    if (!creditorId) return jsonError("Thiếu người nhận tiền");

    const settlement = await requestSettlement(user.id, creditorId);
    return jsonOk({ settlement }, 201);
  } catch (error) {
    return serverError(error);
  }
}
