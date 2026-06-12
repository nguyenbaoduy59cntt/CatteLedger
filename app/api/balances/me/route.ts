import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { getBalanceSummary } from "@/lib/balances";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const balances = await getBalanceSummary(user.id);
    return jsonOk({ balances });
  } catch (error) {
    return serverError(error);
  }
}
