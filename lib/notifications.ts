import { getSupabaseAdmin } from "./supabase";
import type { Notification } from "@/types";

type SupabaseClient = ReturnType<typeof getSupabaseAdmin>;

export async function createNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function createNotificationsForUsers(
  supabase: SupabaseClient,
  userIds: string[],
  params: Omit<Parameters<typeof createNotification>[1], "userId">,
): Promise<void> {
  const unique = [...new Set(userIds)];
  await Promise.all(
    unique.map((userId) =>
      createNotification(supabase, { ...params, userId }),
    ),
  );
}

export async function getNotifications(
  userId: string,
  limit = 50,
): Promise<Notification[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}
