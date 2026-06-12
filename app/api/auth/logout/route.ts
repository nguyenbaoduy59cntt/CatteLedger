import { destroySession } from "@/lib/auth";
import { jsonOk, serverError } from "@/lib/api";

export async function POST() {
  try {
    await destroySession();
    return jsonOk({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
