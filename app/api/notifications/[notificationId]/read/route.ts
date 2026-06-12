import { getCurrentUser } from "@/lib/auth";
import { jsonOk, serverError, unauthorized } from "@/lib/api";
import { markNotificationRead } from "@/lib/notifications";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { notificationId } = await params;
    await markNotificationRead(user.id, notificationId);
    return jsonOk({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
