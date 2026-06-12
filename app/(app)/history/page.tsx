"use client";

import { useCallback, useEffect, useState } from "react";
import { formatVnd, roundTypeLabel } from "@/lib/money";
import type { Round, Settlement } from "@/types";

type HistoryKind = "round" | "settlement";

export default function HistoryPage() {
  const [kind, setKind] = useState<HistoryKind>("round");
  const [items, setItems] = useState<(Round | Settlement)[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/history?type=${kind}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Lịch sử</h1>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKind("round")}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium sm:px-4 sm:py-2 ${
            kind === "round"
              ? "bg-emerald-600 text-white"
              : "border border-zinc-300 dark:border-zinc-600"
          }`}
        >
          Ván chơi
        </button>
        <button
          type="button"
          onClick={() => setKind("settlement")}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium sm:px-4 sm:py-2 ${
            kind === "settlement"
              ? "bg-emerald-600 text-white"
              : "border border-zinc-300 dark:border-zinc-600"
          }`}
        >
          Thanh toán
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-500">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-500">Chưa có lịch sử</p>
      ) : kind === "round" ? (
        <ul className="space-y-2">
          {(items as Round[]).map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {(r as Round & { room?: { name: string } }).room?.name ??
                    "Phòng"}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(r.created_at).toLocaleString("vi-VN")}
                </span>
              </div>
              <p className="mt-1 break-words text-sm">
                <span className="font-medium">{r.winner?.display_name}</span>
                {" — "}
                {roundTypeLabel(r.round_type)}
              </p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                {formatVnd(r.total_amount)}
                {r.is_rolled_back && (
                  <span className="ml-2 text-red-600">(đã rollback)</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {(items as Settlement[]).map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-sm">
                {s.debtor?.display_name} → {s.creditor?.display_name}:{" "}
                {formatVnd(s.amount)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {s.status} —{" "}
                {new Date(s.created_at).toLocaleString("vi-VN")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
