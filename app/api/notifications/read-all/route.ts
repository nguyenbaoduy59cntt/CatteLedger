import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    await markAllNotificationsRead(user.id);
    return jsonOk({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
