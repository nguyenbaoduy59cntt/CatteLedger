"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/rooms/${data.room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tạo phòng");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/rooms"
        className="text-sm text-emerald-600 hover:underline"
      >
        ← Quay lại
      </Link>
      <h1 className="mt-4 text-xl font-bold sm:text-2xl">Tạo phòng mới</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div>
          <label className="block text-sm font-medium">Tên phòng</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Mật khẩu phòng</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            required
            minLength={4}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Xác nhận mật khẩu</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 sm:py-2"
        >
          {loading ? "Đang tạo..." : "Tạo phòng"}
        </button>
      </form>
    </div>
  );
}
