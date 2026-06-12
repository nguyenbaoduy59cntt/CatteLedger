import { getCurrentUser } from "@/lib/auth";
import { jsonOk, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return jsonOk({ user });
}
