import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { getMySettlements } from "@/lib/settlements";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const settlements = await getMySettlements(user.id);
    return jsonOk({ settlements });
  } catch (error) {
    return serverError(error);
  }
}
