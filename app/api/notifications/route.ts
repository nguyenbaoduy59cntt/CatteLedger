import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { getNotifications, getUnreadCount } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.id),
      getUnreadCount(user.id),
    ]);

    return jsonOk({ notifications, unreadCount });
  } catch (error) {
    return serverError(error);
  }
}
