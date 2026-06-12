import { getSupabaseAdmin } from "./supabase";
import { applyDebt } from "./balances";
import { createNotificationsForUsers } from "./notifications";
import {
  BURN_AMOUNT,
  NORMAL_AMOUNT,
  PENALTY_BASE_AMOUNT,
  formatVnd,
  roundTypeLabel,
} from "./money";
import type {
  PlayerSnapshot,
  Round,
  RoundPreview,
  RoundType,
  UserPublic,
} from "@/types";

type SupabaseClient = ReturnType<typeof getSupabaseAdmin>;

export async function getActiveRoomMembers(
  supabase: SupabaseClient,
  roomId: string,
): Promise<UserPublic[]> {
  const { data, error } = await supabase
    .from("room_members")
    .select("user_id, users(id, username, display_name)")
    .eq("room_id", roomId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => {
    const user = m.users as unknown as UserPublic;
    return user;
  });
}

function buildTransactions(
  type: RoundType,
  winner: UserPublic,
  members: UserPublic[],
  penaltyPayerId?: string,
): { debtor: UserPublic; creditor: UserPublic; amount: number }[] {
  if (members.length < 2) {
    throw new Error("Room cần ít nhất 2 người chơi đang active");
  }

  if (!members.some((m) => m.id === winner.id)) {
    throw new Error("Người thắng phải là thành viên đang chơi");
  }

  if (type === "PENALTY") {
    if (!penaltyPayerId) {
      throw new Error("Đền làng cần chọn người đền");
    }
    if (penaltyPayerId === winner.id) {
      throw new Error("Người đền làng không được là người thắng");
    }
    const payer = members.find((m) => m.id === penaltyPayerId);
    if (!payer) {
      throw new Error("Người đền phải là thành viên đang chơi");
    }
    const loserCount = members.length - 1;
    const amount = PENALTY_BASE_AMOUNT * loserCount;
    return [{ debtor: payer, creditor: winner, amount }];
  }

  const amountPerLoser = type === "BURN" ? BURN_AMOUNT : NORMAL_AMOUNT;
  const losers = members.filter((m) => m.id !== winner.id);
  return losers.map((loser) => ({
    debtor: loser,
    creditor: winner,
    amount: amountPerLoser,
  }));
}

export function previewRound(
  type: RoundType,
  winner: UserPublic,
  members: UserPublic[],
  penaltyPayerId?: string,
): RoundPreview {
  const transactions = buildTransactions(
    type,
    winner,
    members,
    penaltyPayerId,
  );
  const penaltyPayer = penaltyPayerId
    ? members.find((m) => m.id === penaltyPayerId)
    : undefined;

  return { type, winner, penaltyPayer, transactions };
}

export async function submitRound(
  userId: string,
  roomId: string,
  winnerId: string,
  type: RoundType,
  penaltyPayerId?: string,
): Promise<Round> {
  const supabase = getSupabaseAdmin();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError || !room) throw new Error("Room không tồn tại");
  if (!room.is_active) throw new Error("Room không còn active");
  if (room.owner_id !== userId) {
    throw new Error("Chỉ chủ phòng mới được ghi nhận ván");
  }

  const members = await getActiveRoomMembers(supabase, roomId);
  const winner = members.find((m) => m.id === winnerId);
  if (!winner) throw new Error("Người thắng không hợp lệ");

  const preview = previewRound(type, winner, members, penaltyPayerId);
  const playerSnapshot: PlayerSnapshot[] = members.map((m) => ({
    id: m.id,
    displayName: m.display_name,
  }));

  const amountPerLoser =
    type === "BURN"
      ? BURN_AMOUNT
      : type === "NORMAL"
        ? NORMAL_AMOUNT
        : PENALTY_BASE_AMOUNT;
  const loserCount =
    type === "PENALTY" ? members.length - 1 : members.length - 1;
  const totalAmount = preview.transactions.reduce((s, t) => s + t.amount, 0);

  const { data: round, error: roundInsertError } = await supabase
    .from("rounds")
    .insert({
      room_id: roomId,
      created_by: userId,
      winner_id: winnerId,
      round_type: type,
      penalty_payer_id: penaltyPayerId ?? null,
      player_snapshot: playerSnapshot,
      amount_per_loser: amountPerLoser,
      loser_count: loserCount,
      total_amount: totalAmount,
    })
    .select("*")
    .single();

  if (roundInsertError || !round) {
    throw new Error(roundInsertError?.message ?? "Không tạo được ván");
  }

  for (const tx of preview.transactions) {
    const { error: txError } = await supabase.from("round_transactions").insert({
      round_id: round.id,
      debtor_id: tx.debtor.id,
      creditor_id: tx.creditor.id,
      amount: tx.amount,
    });
    if (txError) throw new Error(txError.message);

    await applyDebt(supabase, tx.debtor.id, tx.creditor.id, tx.amount);
  }

  const affectedUserIds = new Set<string>();
  for (const tx of preview.transactions) {
    affectedUserIds.add(tx.debtor.id);
    affectedUserIds.add(tx.creditor.id);
  }
  members.forEach((m) => affectedUserIds.add(m.id));

  const txSummary = preview.transactions
    .map(
      (t) =>
        `${t.debtor.display_name} nợ ${t.creditor.display_name} ${formatVnd(t.amount)}`,
    )
    .join("; ");

  await createNotificationsForUsers(supabase, Array.from(affectedUserIds), {
    type: "ROUND_CREATED",
    title: `Ván mới: ${roundTypeLabel(type)}`,
    message: `${winner.display_name} thắng. ${txSummary}`,
    metadata: { roomId, roundId: round.id, type },
  });

  return round;
}

export async function rollbackLatestRound(
  userId: string,
  roomId: string,
): Promise<Round> {
  const supabase = getSupabaseAdmin();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError || !room) throw new Error("Room không tồn tại");
  if (room.owner_id !== userId) {
    throw new Error("Chỉ chủ phòng mới được rollback");
  }

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("*")
    .eq("room_id", roomId)
    .eq("is_rolled_back", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roundError || !round) {
    throw new Error("Không có ván nào để rollback");
  }

  const { data: transactions, error: txError } = await supabase
    .from("round_transactions")
    .select("*")
    .eq("round_id", round.id);

  if (txError) throw new Error(txError.message);

  const userPairs = new Set<string>();
  for (const tx of transactions ?? []) {
    userPairs.add(`${tx.debtor_id}:${tx.creditor_id}`);
    userPairs.add(`${tx.creditor_id}:${tx.debtor_id}`);
  }

  for (const tx of transactions ?? []) {
    const { data: settlements } = await supabase
      .from("settlements")
      .select("id")
      .eq("status", "CONFIRMED")
      .gte("confirmed_at", round.created_at)
      .or(
        `and(debtor_id.eq.${tx.debtor_id},creditor_id.eq.${tx.creditor_id}),and(debtor_id.eq.${tx.creditor_id},creditor_id.eq.${tx.debtor_id})`,
      )
      .limit(1);

    if (settlements && settlements.length > 0) {
      throw new Error(
        "Không thể rollback vì đã có thanh toán được xác nhận sau ván này",
      );
    }
  }

  for (const tx of transactions ?? []) {
    await applyDebt(supabase, tx.creditor_id, tx.debtor_id, tx.amount);
  }

  const { data: updated, error: updateError } = await supabase
    .from("rounds")
    .update({
      is_rolled_back: true,
      rolled_back_at: new Date().toISOString(),
      rolled_back_by: userId,
    })
    .eq("id", round.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Rollback thất bại");
  }

  const members = await getActiveRoomMembers(supabase, roomId);
  await createNotificationsForUsers(
    supabase,
    members.map((m) => m.id),
    {
      type: "ROUND_ROLLED_BACK",
      title: "Rollback ván",
      message: `Chủ phòng đã hoàn tác ván gần nhất (${roundTypeLabel(round.round_type)})`,
      metadata: { roomId, roundId: round.id },
    },
  );

  return updated;
}

export async function getRoomRounds(roomId: string, limit = 20): Promise<Round[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("rounds")
    .select(
      "*, winner:users!rounds_winner_id_fkey(id, username, display_name), penalty_payer:users!rounds_penalty_payer_id_fkey(id, username, display_name)",
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Round[];
}
