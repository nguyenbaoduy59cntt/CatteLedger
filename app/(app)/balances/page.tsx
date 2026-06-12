"use client";

import { useCallback, useEffect, useState } from "react";
import BalanceCard from "@/components/BalanceCard";
import { formatVnd } from "@/lib/money";
import type { BalanceSummary, Settlement, User } from "@/types";

export default function BalancesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<BalanceSummary | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [meRes, balRes, setRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/balances/me"),
      fetch("/api/settlements/me"),
    ]);
    if (meRes.ok) {
      const data = await meRes.json();
      setUser(data.user);
    }
    if (balRes.ok) {
      const data = await balRes.json();
      setBalances(data.balances);
    }
    if (setRes.ok) {
      const data = await setRes.json();
      setSettlements(data.settlements);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function requestPay(creditorId: string) {
    if (!confirm("Xác nhận bạn đã trả tiền? Người nhận sẽ cần xác nhận.")) {
      return;
    }
    setActionLoading(creditorId);
    try {
      const res = await fetch("/api/settlements/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmSettlement(id: string) {
    if (!confirm("Xác nhận bạn đã nhận tiền?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/settlements/${id}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectSettlement(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/settlements/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setActionLoading(null);
    }
  }

  const pendingAsCreditor = settlements.filter(
    (s) => s.status === "PENDING" && user && s.creditor_id === user.id,
  );

  if (loading) return <p className="text-zinc-500">Đang tải...</p>;
  if (!balances) return <p>Không tải được sổ nợ</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Sổ nợ cá nhân</h1>

      <BalanceCard balances={balances} />

      {pendingAsCreditor.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200">
            Yêu cầu chờ xác nhận
          </h3>
          <ul className="mt-3 space-y-3">
            {pendingAsCreditor.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-900"
              >
                <span className="text-sm">
                  {s.debtor?.display_name} báo đã trả {formatVnd(s.amount)}
                </span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={actionLoading === s.id}
                    onClick={() => confirmSettlement(s.id)}
                    className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:py-1.5"
                  >
                    Đã nhận tiền
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === s.id}
                    onClick={() => rejectSettlement(s.id)}
                    className="w-full rounded-lg border border-red-300 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 sm:w-auto sm:py-1.5"
                  >
                    Từ chối
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="font-semibold">Mình đang nợ — Thanh toán</h3>
        {balances.i_owe.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Không có khoản nợ</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {balances.i_owe.map((b) => {
              const hasPending = settlements.some(
                (s) =>
                  s.status === "PENDING" &&
                  s.debtor_id === b.debtor_id &&
                  s.creditor_id === b.creditor_id,
              );
              return (
                <li
                  key={b.id}
                  className="flex flex-col gap-2 rounded-lg bg-zinc-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2 dark:bg-zinc-800"
                >
                  <span className="text-sm font-medium">
                    {b.creditor?.display_name}
                    <span className="mt-0.5 block text-zinc-600 sm:inline sm:mt-0 dark:text-zinc-400">
                      {formatVnd(b.amount)}
                    </span>
                  </span>
                  {hasPending ? (
                    <span className="text-xs text-amber-600">
                      Đang chờ xác nhận
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading === b.creditor_id}
                      onClick={() => requestPay(b.creditor_id)}
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:py-1.5"
                    >
                      Tôi đã trả
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
