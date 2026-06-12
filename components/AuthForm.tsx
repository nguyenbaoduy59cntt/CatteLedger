"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { username, password }
          : { username, displayName, password, confirmPassword };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Đăng nhập thất bại");
      }

      router.push("/rooms");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          {mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Catte Ledger — quản lý tiền chơi Cát Tê
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              required
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium">Tên hiển thị</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              required
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading
              ? "Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập"
                : "Đăng ký"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-emerald-600 hover:underline">
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-emerald-600 hover:underline">
                Đăng nhập
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
