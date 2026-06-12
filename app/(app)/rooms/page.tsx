"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import RoomCard from "@/components/RoomCard";
import type { RoomWithDetails } from "@/types";

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinRoom, setJoinRoom] = useState<RoomWithDetails | null>(null);
  const [password, setPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const fetchRooms = useCallback(async () => {
    const res = await fetch("/api/rooms");
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  async function handleJoin() {
    if (!joinRoom) return;
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${joinRoom.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJoinRoom(null);
      setPassword("");
      router.push(`/rooms/${joinRoom.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Join thất bại");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Danh sách phòng
        </h1>
        <Link
          href="/rooms/new"
          className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 sm:w-auto sm:py-2"
        >
          Tạo phòng
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-zinc-500">Đang tải...</p>
      ) : rooms.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
          <p className="text-zinc-500">Chưa có phòng nào</p>
          <Link
            href="/rooms/new"
            className="mt-2 inline-block text-emerald-600 hover:underline"
          >
            Tạo phòng đầu tiên
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={setJoinRoom} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!joinRoom}
        title={`Join phòng "${joinRoom?.name}"`}
        confirmLabel="Join"
        loading={joining}
        onConfirm={handleJoin}
        onCancel={() => {
          setJoinRoom(null);
          setPassword("");
          setError("");
        }}
      >
        <div>
          <label className="block text-sm font-medium">Mật khẩu phòng</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </ConfirmModal>
    </div>
  );
}
