"use client";

import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { formatVnd, roundTypeLabel } from "@/lib/money";
import type { RoomMember, RoundPreview, RoundType } from "@/types";

interface RoundFormProps {
  roomId: string;
  members: RoomMember[];
  onSuccess: () => void;
}

export default function RoundForm({
  roomId,
  members,
  onSuccess,
}: RoundFormProps) {
  const [winnerId, setWinnerId] = useState(members[0]?.user_id ?? "");
  const [type, setType] = useState<RoundType>("NORMAL");
  const [penaltyPayerId, setPenaltyPayerId] = useState("");
  const [preview, setPreview] = useState<RoundPreview | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePreview() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId,
          type,
          penaltyPayerId: type === "PENALTY" ? penaltyPayerId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.preview);
      setShowConfirm(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi preview");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId,
          type,
          penaltyPayerId: type === "PENALTY" ? penaltyPayerId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowConfirm(false);
      setPreview(null);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi ghi nhận ván");
    } finally {
      setLoading(false);
    }
  }

  const nonWinners = members.filter((m) => m.user_id !== winnerId);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
        Ghi nhận ván (chủ phòng)
      </h3>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Người thắng
          </label>
          <select
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user?.display_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Loại ván
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RoundType)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            <option value="NORMAL">Thắng thường (5,000đ)</option>
            <option value="BURN">Đốt / cháy nhà (10,000đ)</option>
            <option value="PENALTY">Đền làng</option>
          </select>
        </div>

        {type === "PENALTY" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Người đền làng
            </label>
            <select
              value={penaltyPayerId}
              onChange={(e) => setPenaltyPayerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="">— Chọn —</option>
              {nonWinners.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user?.display_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handlePreview}
          disabled={loading || (type === "PENALTY" && !penaltyPayerId)}
          className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 sm:py-2"
        >
          Ghi nhận ván
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        title={`Xác nhận ${preview ? roundTypeLabel(preview.type) : ""}?`}
        loading={loading}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      >
        {preview && (
          <ul className="space-y-1">
            {preview.transactions.map((t, i) => (
              <li key={i}>
                {t.debtor.display_name} sẽ nợ {t.creditor.display_name}{" "}
                {formatVnd(t.amount)}
              </li>
            ))}
          </ul>
        )}
      </ConfirmModal>
    </div>
  );
}
