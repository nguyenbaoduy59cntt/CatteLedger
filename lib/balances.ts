import { getSupabaseAdmin } from "./supabase";
import type { BalanceSummary, UserBalance, UserPublic } from "@/types";

type SupabaseClient = ReturnType<typeof getSupabaseAdmin>;

export async function applyDebt(
  supabase: SupabaseClient,
  debtorId: string,
  creditorId: string,
  amount: number,
): Promise<void> {
  if (debtorId === creditorId) {
    throw new Error("Debtor and creditor must be different");
  }
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const { data: reverse } = await supabase
    .from("user_balances")
    .select("id, amount")
    .eq("debtor_id", creditorId)
    .eq("creditor_id", debtorId)
    .maybeSingle();

  if (reverse) {
    if (reverse.amount > amount) {
      const { error } = await supabase
        .from("user_balances")
        .update({
          amount: reverse.amount - amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reverse.id);
      if (error) throw new Error(error.message);
      return;
    }

    if (reverse.amount === amount) {
      const { error } = await supabase
        .from("user_balances")
        .delete()
        .eq("id", reverse.id);
      if (error) throw new Error(error.message);
      return;
    }

    const remainder = amount - reverse.amount;
    const { error: delError } = await supabase
      .from("user_balances")
      .delete()
      .eq("id", reverse.id);
    if (delError) throw new Error(delError.message);

    const { error: insError } = await supabase.from("user_balances").insert({
      debtor_id: debtorId,
      creditor_id: creditorId,
      amount: remainder,
      updated_at: new Date().toISOString(),
    });
    if (insError) throw new Error(insError.message);
    return;
  }

  const { data: existing } = await supabase
    .from("user_balances")
    .select("id, amount")
    .eq("debtor_id", debtorId)
    .eq("creditor_id", creditorId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_balances")
      .update({
        amount: existing.amount + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("user_balances").insert({
    debtor_id: debtorId,
    creditor_id: creditorId,
    amount,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function reduceDebt(
  supabase: SupabaseClient,
  debtorId: string,
  creditorId: string,
  amount: number,
): Promise<void> {
  const { data: balance } = await supabase
    .from("user_balances")
    .select("id, amount")
    .eq("debtor_id", debtorId)
    .eq("creditor_id", creditorId)
    .maybeSingle();

  if (!balance) {
    throw new Error("Balance not found");
  }
  if (balance.amount < amount) {
    throw new Error("Balance is less than settlement amount");
  }
  if (balance.amount === amount) {
    const { error } = await supabase
      .from("user_balances")
      .delete()
      .eq("id", balance.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from("user_balances")
    .update({
      amount: balance.amount - amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", balance.id);
  if (error) throw new Error(error.message);
}

function attachUsers(
  balances: UserBalance[],
  users: UserPublic[],
): UserBalance[] {
  const map = new Map(users.map((u) => [u.id, u]));
  return balances.map((b) => ({
    ...b,
    debtor: map.get(b.debtor_id),
    creditor: map.get(b.creditor_id),
  }));
}

export async function getBalanceSummary(userId: string): Promise<BalanceSummary> {
  const supabase = getSupabaseAdmin();

  const [{ data: iOwe }, { data: owedToMe }] = await Promise.all([
    supabase
      .from("user_balances")
      .select("*")
      .eq("debtor_id", userId)
      .order("amount", { ascending: false }),
    supabase
      .from("user_balances")
      .select("*")
      .eq("creditor_id", userId)
      .order("amount", { ascending: false }),
  ]);

  const userIds = new Set<string>();
  for (const b of [...(iOwe ?? []), ...(owedToMe ?? [])]) {
    userIds.add(b.debtor_id);
    userIds.add(b.creditor_id);
  }

  let users: UserPublic[] = [];
  if (userIds.size > 0) {
    const { data } = await supabase
      .from("users")
      .select("id, username, display_name")
      .in("id", Array.from(userIds));
    users = data ?? [];
  }

  const iOweWithUsers = attachUsers(iOwe ?? [], users);
  const owedToMeWithUsers = attachUsers(owedToMe ?? [], users);

  return {
    i_owe: iOweWithUsers,
    owed_to_me: owedToMeWithUsers,
    total_i_owe: iOweWithUsers.reduce((s, b) => s + b.amount, 0),
    total_owed_to_me: owedToMeWithUsers.reduce((s, b) => s + b.amount, 0),
  };
}

export async function getBalanceBetween(
  debtorId: string,
  creditorId: string,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("user_balances")
    .select("amount")
    .eq("debtor_id", debtorId)
    .eq("creditor_id", creditorId)
    .maybeSingle();

  return data?.amount ?? 0;
}
