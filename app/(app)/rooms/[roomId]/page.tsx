"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BalanceCard from "@/components/BalanceCard";
import ConfirmModal from "@/components/ConfirmModal";
import RoomMembers from "@/components/RoomMembers";
import RoundForm from "@/components/RoundForm";
import { formatVnd, roundTypeLabel } from "@/lib/money";
import type { BalanceSummary, RoomWithDetails, Round } from "@/types";

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();

  const [room, setRoom] = useState<RoomWithDetails | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [balances, setBalances] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRollback, setShowRollback] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [roomRes, roundsRes, balancesRes] = await Promise.all([
      fetch(`/api/rooms/${roomId}`),
      fetch(`/api/rooms/${roomId}/rounds`),
      fetch("/api/balances/me"),
    ]);

    if (roomRes.ok) {
      const data = await roomRes.json();
      setRoom(data.room);
    }
    if (roundsRes.ok) {
      const data = await roundsRes.json();
      setRounds(data.rounds);
    }
    if (balancesRes.ok) {
      const data = await balancesRes.json();
      setBalances(data.balances);
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleLeave() {
    const res = await fetch(`/api/rooms/${roomId}/leave`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    router.push("/rooms");
  }

  async function handleRollback() {
    setRollbackLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${roomId}/rollback`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowRollback(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rollback thất bại");
    } finally {
      setRollbackLoading(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Đang tải phòng...</p>;
  }

  if (!room) {
    return (
      <div>
        <p>Phòng không tồn tại</p>
        <Link href="/rooms" className="text-emerald-600 hover:underline">
          Quay lại
        </Link>
      </div>
    );
  }

  const members = room.active_members ?? [];
  const latestRound = rounds.find((r) => !r.is_rolled_back);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/rooms"
            className="text-sm text-emerald-600 hover:underline"
          >
            ← Danh sách phòng
          </Link>
          <h1 className="mt-2 break-words text-xl font-bold sm:text-2xl">
            {room.name}
          </h1>
          <p className="text-sm text-zinc-500">
            Chủ phòng: {room.owner?.display_name}
          </p>
        </div>
        {room.is_member && !room.is_owner && (
          <button
            type="button"
            onClick={handleLeave}
            className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 sm:w-auto sm:py-2 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            Rời phòng
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RoomMembers members={members} ownerId={room.owner_id} />

        {balances && <BalanceCard balances={balances} compact />}

        {room.is_owner && room.is_member && members.length >= 2 && (
          <RoundForm roomId={roomId} members={members} onSuccess={refresh} />
        )}

        {room.is_owner && latestRound && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">
              Rollback ván gần nhất
            </h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              Ván: {roundTypeLabel(latestRound.round_type)} —{" "}
              {new Date(latestRound.created_at).toLocaleString("vi-VN")}
            </p>
            <button
              type="button"
              onClick={() => setShowRollback(true)}
              className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Rollback ván gần nhất
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="font-semibold">Lịch sử ván gần đây</h3>
        {rounds.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Chưa có ván nào</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rounds.map((r) => (
              <li
                key={r.id}
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  r.is_rolled_back
                    ? "bg-zinc-100 line-through opacity-60 dark:bg-zinc-800"
                    : "bg-zinc-50 dark:bg-zinc-800"
                }`}
              >
                <div className="font-medium">
                  {r.winner?.display_name ?? "?"} —{" "}
                  {roundTypeLabel(r.round_type)}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-zinc-600 dark:text-zinc-400">
                  <span>{formatVnd(r.total_amount)}</span>
                  {r.is_rolled_back && (
                    <span className="text-xs text-red-600">(đã rollback)</span>
                  )}
                  <span className="text-xs">
                    {new Date(r.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        open={showRollback}
        title="Xác nhận rollback ván gần nhất?"
        confirmLabel="Rollback"
        danger
        loading={rollbackLoading}
        onConfirm={handleRollback}
        onCancel={() => {
          setShowRollback(false);
          setError("");
        }}
      >
        <p>
          Hành động này sẽ hoàn tác các khoản nợ từ ván gần nhất. Không thể
          hoàn tác nếu đã có thanh toán được xác nhận sau ván đó.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </ConfirmModal>
    </div>
  );
}
