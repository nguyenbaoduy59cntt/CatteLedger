import { getSupabaseAdmin } from "./supabase";
import { getBalanceBetween, reduceDebt } from "./balances";
import { createNotification } from "./notifications";
import { formatVnd } from "./money";
import type { Settlement } from "@/types";

type SupabaseClient = ReturnType<typeof getSupabaseAdmin>;

export async function requestSettlement(
  userId: string,
  creditorId: string,
): Promise<Settlement> {
  if (userId === creditorId) {
    throw new Error("Không thể tự thanh toán cho chính mình");
  }

  const supabase = getSupabaseAdmin();
  const amount = await getBalanceBetween(userId, creditorId);

  if (amount <= 0) {
    throw new Error("Bạn không còn nợ người này");
  }

  const { data: existing } = await supabase
    .from("settlements")
    .select("id")
    .eq("debtor_id", userId)
    .eq("creditor_id", creditorId)
    .eq("status", "PENDING")
    .maybeSingle();

  if (existing) {
    throw new Error("Đã có yêu cầu thanh toán đang chờ xác nhận");
  }

  const { data: settlement, error } = await supabase
    .from("settlements")
    .insert({
      debtor_id: userId,
      creditor_id: creditorId,
      amount,
      status: "PENDING",
      requested_by: userId,
    })
    .select("*")
    .single();

  if (error || !settlement) {
    throw new Error(error?.message ?? "Không tạo được yêu cầu");
  }

  const { data: debtor } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", userId)
    .single();

  await createNotification(supabase, {
    userId: creditorId,
    type: "SETTLEMENT_REQUESTED",
    title: "Yêu cầu xác nhận đã nhận tiền",
    message: `${debtor?.display_name ?? "Ai đó"} báo đã trả ${formatVnd(amount)}`,
    metadata: { settlementId: settlement.id },
  });

  return settlement;
}

export async function confirmSettlement(
  userId: string,
  settlementId: string,
): Promise<Settlement> {
  const supabase = getSupabaseAdmin();

  const { data: settlement, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", settlementId)
    .maybeSingle();

  if (error || !settlement) throw new Error("Settlement không tồn tại");
  if (settlement.creditor_id !== userId) {
    throw new Error("Chỉ người nhận tiền mới được xác nhận");
  }
  if (settlement.status !== "PENDING") {
    throw new Error("Settlement không còn ở trạng thái chờ");
  }

  const currentBalance = await getBalanceBetween(
    settlement.debtor_id,
    settlement.creditor_id,
  );

  if (currentBalance !== settlement.amount) {
    throw new Error(
      "Số nợ hiện tại đã thay đổi. Vui lòng từ chối và tạo yêu cầu mới.",
    );
  }

  await reduceDebt(
    supabase,
    settlement.debtor_id,
    settlement.creditor_id,
    settlement.amount,
  );

  const { data: updated, error: updateError } = await supabase
    .from("settlements")
    .update({
      status: "CONFIRMED",
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", settlementId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Xác nhận thất bại");
  }

  const { data: creditor } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", userId)
    .single();

  await createNotification(supabase, {
    userId: settlement.debtor_id,
    type: "SETTLEMENT_CONFIRMED",
    title: "Đã xác nhận nhận tiền",
    message: `${creditor?.display_name ?? "Người nhận"} đã xác nhận nhận ${formatVnd(settlement.amount)}`,
    metadata: { settlementId },
  });

  return updated;
}

export async function rejectSettlement(
  userId: string,
  settlementId: string,
): Promise<Settlement> {
  const supabase = getSupabaseAdmin();

  const { data: settlement, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", settlementId)
    .maybeSingle();

  if (error || !settlement) throw new Error("Settlement không tồn tại");
  if (settlement.creditor_id !== userId) {
    throw new Error("Chỉ người nhận tiền mới được từ chối");
  }
  if (settlement.status !== "PENDING") {
    throw new Error("Settlement không còn ở trạng thái chờ");
  }

  const { data: updated, error: updateError } = await supabase
    .from("settlements")
    .update({
      status: "REJECTED",
      rejected_by: userId,
      rejected_at: new Date().toISOString(),
    })
    .eq("id", settlementId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Từ chối thất bại");
  }

  const { data: creditor } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", userId)
    .single();

  await createNotification(supabase, {
    userId: settlement.debtor_id,
    type: "SETTLEMENT_REJECTED",
    title: "Yêu cầu thanh toán bị từ chối",
    message: `${creditor?.display_name ?? "Người nhận"} đã từ chối yêu cầu ${formatVnd(settlement.amount)}`,
    metadata: { settlementId },
  });

  return updated;
}

export async function getMySettlements(userId: string): Promise<Settlement[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("settlements")
    .select(
      "*, debtor:users!settlements_debtor_id_fkey(id, username, display_name), creditor:users!settlements_creditor_id_fkey(id, username, display_name)",
    )
    .or(`debtor_id.eq.${userId},creditor_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as Settlement[];
}
