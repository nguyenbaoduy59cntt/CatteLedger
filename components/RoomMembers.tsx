import type { RoomMember } from "@/types";

interface RoomMembersProps {
  members: RoomMember[];
  ownerId: string;
}

export default function RoomMembers({ members, ownerId }: RoomMembersProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
        Người đang chơi ({members.length})
      </h3>
      <ul className="mt-3 space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800"
          >
            <span className="font-medium">{m.user?.display_name}</span>
            {m.user_id === ownerId && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Chủ phòng
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
