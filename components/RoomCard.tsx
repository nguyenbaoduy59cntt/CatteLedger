"use client";

import type { RoomWithDetails } from "@/types";

interface RoomCardProps {
  room: RoomWithDetails;
  onJoin: (room: RoomWithDetails) => void;
}

export default function RoomCard({ room, onJoin }: RoomCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
            {room.name}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Chủ phòng: {room.owner?.display_name ?? "—"}
          </p>
          <p className="text-sm text-zinc-500">
            Đang chơi: {room.active_member_count ?? 0} người
          </p>
        </div>
        <button
          type="button"
          onClick={() => onJoin(room)}
          className="w-full shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 sm:w-auto sm:py-2"
        >
          Join
        </button>
      </div>
    </div>
  );
}
