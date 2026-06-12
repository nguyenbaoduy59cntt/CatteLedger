"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Notification, User } from "@/types";

interface NotificationBellProps {
  user: User;
}

export default function NotificationBell({ user }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, []);

  useEffect(() => {
    fetchNotifications();

    try {
      const supabase = getSupabaseBrowser();
      const channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Supabase not configured for realtime in dev
    }
  }, [user.id, fetchNotifications]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    fetchNotifications();
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    fetchNotifications();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg border border-zinc-300 p-2 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        aria-label="Thông báo"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 sm:hidden"
            aria-label="Đóng thông báo"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-3 top-14 z-50 max-h-[70vh] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-h-none dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <span className="font-semibold">Thông báo</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-emerald-600 hover:underline"
              >
                Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">Chưa có thông báo</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`w-full border-b border-zinc-100 px-4 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 ${
                    !n.is_read ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                  }`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
