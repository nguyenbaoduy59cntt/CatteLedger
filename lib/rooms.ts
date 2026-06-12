import { hashPassword, verifyPassword } from "./auth";
import { getSupabaseAdmin } from "./supabase";
import { createNotification } from "./notifications";
import type { Room, RoomWithDetails, UserPublic } from "@/types";

export async function listPublicRooms(): Promise<RoomWithDetails[]> {
  const supabase = getSupabaseAdmin();

  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!rooms?.length) return [];

  const roomIds = rooms.map((r) => r.id);
  const ownerIds = [...new Set(rooms.map((r) => r.owner_id))];

  const [{ data: owners }, { data: members }] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, display_name")
      .in("id", ownerIds),
    supabase
      .from("room_members")
      .select("room_id")
      .in("room_id", roomIds)
      .eq("is_active", true),
  ]);

  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));
  const countMap = new Map<string, number>();
  for (const m of members ?? []) {
    countMap.set(m.room_id, (countMap.get(m.room_id) ?? 0) + 1);
  }

  return rooms.map((room) => ({
    ...room,
    owner: ownerMap.get(room.owner_id),
    active_member_count: countMap.get(room.id) ?? 0,
  }));
}

export async function createRoom(
  userId: string,
  name: string,
  password: string,
): Promise<Room> {
  if (!name.trim()) throw new Error("Tên phòng không được rỗng");
  if (password.length < 4) {
    throw new Error("Mật khẩu phòng tối thiểu 4 ký tự");
  }

  const supabase = getSupabaseAdmin();
  const passwordHash = await hashPassword(password);

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      name: name.trim(),
      password_hash: passwordHash,
      owner_id: userId,
    })
    .select("*")
    .single();

  if (error || !room) {
    throw new Error(error?.message ?? "Không tạo được phòng");
  }

  const { error: memberError } = await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: userId,
    is_active: true,
  });

  if (memberError) throw new Error(memberError.message);
  return room;
}

export async function joinRoom(
  userId: string,
  roomId: string,
  password: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (error || !room) throw new Error("Phòng không tồn tại");
  if (!room.is_active) throw new Error("Phòng không còn active");

  const valid = await verifyPassword(password, room.password_hash);
  if (!valid) throw new Error("Mật khẩu phòng không đúng");

  const { data: existing } = await supabase
    .from("room_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) return;

  const { error: insertError } = await supabase.from("room_members").insert({
    room_id: roomId,
    user_id: userId,
    is_active: true,
  });

  if (insertError) throw new Error(insertError.message);

  const { data: user } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", userId)
    .single();

  const { data: activeMembers } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", roomId)
    .eq("is_active", true);

  await Promise.all(
    (activeMembers ?? [])
      .filter((m) => m.user_id !== userId)
      .map((m) =>
        createNotification(supabase, {
          userId: m.user_id,
          type: "MEMBER_JOINED",
          title: "Có người vào phòng",
          message: `${user?.display_name ?? "Ai đó"} đã join phòng ${room.name}`,
          metadata: { roomId },
        }),
      ),
  );
}

export async function leaveRoom(userId: string, roomId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (error || !room) throw new Error("Phòng không tồn tại");
  if (room.owner_id === userId) {
    throw new Error("Chủ phòng không được rời phòng");
  }

  const { data: member } = await supabase
    .from("room_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) throw new Error("Bạn không ở trong phòng này");

  const { error: updateError } = await supabase
    .from("room_members")
    .update({
      is_active: false,
      left_at: new Date().toISOString(),
    })
    .eq("id", member.id);

  if (updateError) throw new Error(updateError.message);

  const { data: user } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", userId)
    .single();

  const { data: activeMembers } = await supabase
    .from("room_members")
    .select("user_id")
    .eq("room_id", roomId)
    .eq("is_active", true);

  await Promise.all(
    (activeMembers ?? []).map((m) =>
      createNotification(supabase, {
        userId: m.user_id,
        type: "MEMBER_LEFT",
        title: "Có người rời phòng",
        message: `${user?.display_name ?? "Ai đó"} đã rời phòng ${room.name}`,
        metadata: { roomId },
      }),
    ),
  );
}

export async function getRoomDetail(
  roomId: string,
  currentUserId?: string,
): Promise<RoomWithDetails | null> {
  const supabase = getSupabaseAdmin();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (error || !room) return null;

  const [{ data: owner }, { data: members }] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, display_name")
      .eq("id", room.owner_id)
      .single(),
    supabase
      .from("room_members")
      .select(
        "*, user:users(id, username, display_name)",
      )
      .eq("room_id", roomId)
      .eq("is_active", true)
      .order("joined_at", { ascending: true }),
  ]);

  const activeMembers = (members ?? []).map((m) => ({
    ...m,
    user: m.user as unknown as UserPublic,
  }));

  return {
    ...room,
    owner: owner ?? undefined,
    active_members: activeMembers,
    active_member_count: activeMembers.length,
    is_owner: currentUserId ? room.owner_id === currentUserId : false,
    is_member: currentUserId
      ? activeMembers.some((m) => m.user_id === currentUserId)
      : false,
  };
}
