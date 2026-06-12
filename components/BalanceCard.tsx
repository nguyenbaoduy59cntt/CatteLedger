import { formatVnd } from "@/lib/money";
import type { BalanceSummary } from "@/types";

interface BalanceCardProps {
  balances: BalanceSummary;
  compact?: boolean;
}

export default function BalanceCard({
  balances,
  compact = false,
}: BalanceCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
        Sổ nợ {compact ? "nhanh" : "cá nhân"}
      </h3>

      <div className={`mt-3 grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
        <div>
          <p className="text-xs font-medium uppercase text-red-600">
            Mình đang nợ ({formatVnd(balances.total_i_owe)})
          </p>
          {balances.i_owe.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Không nợ ai</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {balances.i_owe.map((b) => (
                <li key={b.id} className="text-sm">
                  {b.creditor?.display_name}: {formatVnd(b.amount)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!compact && (
          <div>
            <p className="text-xs font-medium uppercase text-emerald-600">
              Người khác nợ mình ({formatVnd(balances.total_owed_to_me)})
            </p>
            {balances.owed_to_me.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Chưa ai nợ</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {balances.owed_to_me.map((b) => (
                  <li key={b.id} className="text-sm">
                    {b.debtor?.display_name}: {formatVnd(b.amount)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
