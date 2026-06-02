"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Download,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  supabase,
  type Player,
  type Fine,
  type Payment,
  type FineType,
} from "@/lib/supabaseClient";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { toCsv, downloadCsv } from "@/lib/csv";

export default function SummaryPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const load = async () => {
    setLoading(true);
    const [pRes, fRes, payRes, ftRes] = await Promise.all([
      supabase.from("players").select("*").order("name"),
      supabase.from("fines").select("*").order("created_at"),
      supabase.from("payments").select("*").order("created_at"),
      supabase.from("fine_types").select("*"),
    ]);
    const firstError =
      pRes.error || fRes.error || payRes.error || ftRes.error;
    if (firstError) setError(firstError.message);
    setPlayers(pRes.data ?? []);
    setFines(fRes.data ?? []);
    setPayments(payRes.data ?? []);
    setFineTypes(ftRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const fineTypeById = useMemo(() => {
    const m: Record<string, FineType> = {};
    for (const ft of fineTypes) m[ft.id] = ft;
    return m;
  }, [fineTypes]);

  const finesByPlayer = useMemo(() => {
    const m: Record<string, Fine[]> = {};
    for (const f of fines) (m[f.player_id] ??= []).push(f);
    return m;
  }, [fines]);

  const paymentsByPlayer = useMemo(() => {
    const m: Record<string, Payment[]> = {};
    for (const p of payments) (m[p.player_id] ??= []).push(p);
    return m;
  }, [payments]);

  const owedFor = (id: string) =>
    (finesByPlayer[id] ?? []).reduce((s, f) => s + Number(f.amount), 0);
  const paidFor = (id: string) =>
    (paymentsByPlayer[id] ?? []).reduce((s, p) => s + Number(p.amount), 0);

  const grandTotals = useMemo(() => {
    const owed = fines.reduce((s, f) => s + Number(f.amount), 0);
    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
    return { owed, paid, remaining: owed - paid };
  }, [fines, payments]);

  const recordPayment = async (playerId: string, amount: number) => {
    if (!amount || amount <= 0) {
      setError("Enter a payment amount greater than 0.");
      return;
    }
    setError(null);
    const { error: e } = await supabase.from("payments").insert({
      player_id: playerId,
      amount,
      note: payNote.trim(),
    });
    if (e) {
      setError(e.message);
      return;
    }
    setPayOpen(null);
    setPayAmount("");
    setPayNote("");
    load();
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [];
    // Line items.
    rows.push(["Player", "Round", "Fine", "Description", "Amount", "Date"]);
    const sortedPlayers = [...players].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const p of sortedPlayers) {
      const pf = [...(finesByPlayer[p.id] ?? [])].sort((a, b) =>
        a.round.localeCompare(b.round, undefined, { numeric: true })
      );
      for (const f of pf) {
        const ft = f.fine_type_id ? fineTypeById[f.fine_type_id] : undefined;
        rows.push([
          p.name,
          f.round,
          ft?.name ?? "(deleted fine type)",
          ft?.description ?? "",
          Number(f.amount).toFixed(2),
          formatDate(f.created_at),
        ]);
      }
    }
    // Spacer + per-player balance summary.
    rows.push([]);
    rows.push(["Player", "Total Owed", "Total Paid", "Remaining"]);
    for (const p of sortedPlayers) {
      const owed = owedFor(p.id);
      const paid = paidFor(p.id);
      rows.push([
        p.name,
        owed.toFixed(2),
        paid.toFixed(2),
        (owed - paid).toFixed(2),
      ]);
    }
    rows.push([
      "TOTAL",
      grandTotals.owed.toFixed(2),
      grandTotals.paid.toFixed(2),
      grandTotals.remaining.toFixed(2),
    ]);

    downloadCsv("azzuri-fines.csv", toCsv(rows));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header totals + export */}
      <div className="card !p-0 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="px-3 py-3.5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Owed
            </p>
            <p className="mt-0.5 font-bold text-ink">
              {formatCurrency(grandTotals.owed)}
            </p>
          </div>
          <div className="px-3 py-3.5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Paid
            </p>
            <p className="mt-0.5 font-bold text-emerald-600">
              {formatCurrency(grandTotals.paid)}
            </p>
          </div>
          <div className="px-3 py-3.5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Owing
            </p>
            <p className="mt-0.5 font-bold text-red-500">
              {formatCurrency(grandTotals.remaining)}
            </p>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="btn btn-secondary w-full rounded-none py-3 text-sm"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {error && (
        <div className="animate-slide-up rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {players.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">
          No players yet.
        </p>
      )}

      {/* Per-player sections */}
      <ul className="space-y-3">
        {players.map((p) => {
          const owed = owedFor(p.id);
          const paid = paidFor(p.id);
          const remaining = owed - paid;
          const pct = owed > 0 ? Math.min(100, (paid / owed) * 100) : 0;
          const pf = finesByPlayer[p.id] ?? [];
          const isOpen = expanded[p.id];
          const paidUp = remaining <= 0 && owed > 0;

          // Group this player's fines by round (preserve insertion order).
          const rounds: { round: string; items: Fine[] }[] = [];
          for (const f of pf) {
            let g = rounds.find((r) => r.round === f.round);
            if (!g) {
              g = { round: f.round, items: [] };
              rounds.push(g);
            }
            g.items.push(f);
          }

          return (
            <li key={p.id} className="card !p-0 overflow-hidden">
              <button
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                }
                className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{p.name}</p>
                    {paidUp && (
                      <BadgeCheck size={16} className="shrink-0 text-emerald-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Owed {formatCurrency(owed)} · Paid {formatCurrency(paid)}
                  </p>
                  {/* Progress bar */}
                  {owed > 0 && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          paidUp ? "bg-emerald-500" : "bg-brand-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`badge ${
                      remaining <= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {remaining <= 0
                      ? "Paid up"
                      : `${formatCurrency(remaining)}`}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-3.5 pb-3.5 pt-3">
                  {rounds.length === 0 && (
                    <p className="py-2 text-sm text-slate-400">No fines yet.</p>
                  )}
                  {rounds.map((r) => {
                    const roundTotal = r.items.reduce(
                      (s, f) => s + Number(f.amount),
                      0
                    );
                    return (
                      <div key={r.round} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-ink">
                            {r.round}
                          </p>
                          <p className="text-sm font-medium text-slate-500">
                            {formatCurrency(roundTotal)}
                          </p>
                        </div>
                        <ul className="mt-1 divide-y divide-slate-50">
                          {r.items.map((f) => {
                            const ft = f.fine_type_id
                              ? fineTypeById[f.fine_type_id]
                              : undefined;
                            return (
                              <li
                                key={f.id}
                                className="flex items-center justify-between py-1.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm text-slate-700">
                                    {ft?.name ?? "(deleted fine)"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {formatDate(f.created_at)}
                                  </p>
                                </div>
                                <span className="text-sm font-medium tabular-nums text-slate-700">
                                  {formatCurrency(Number(f.amount))}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}

                  {/* Payments list */}
                  {(paymentsByPlayer[p.id]?.length ?? 0) > 0 && (
                    <div className="mt-2 rounded-xl bg-emerald-50 p-2.5">
                      <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <Wallet size={13} /> Payments
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {(paymentsByPlayer[p.id] ?? []).map((pay) => (
                          <li
                            key={pay.id}
                            className="flex items-center justify-between text-xs text-emerald-800"
                          >
                            <span>
                              {formatDateTime(pay.created_at)}
                              {pay.note ? ` · ${pay.note}` : ""}
                            </span>
                            <span className="tabular-nums">
                              {formatCurrency(Number(pay.amount))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Record payment */}
                  {payOpen === p.id ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-2.5">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="Amount"
                          className="input w-28 !py-2"
                        />
                        <input
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          placeholder="Note (optional)"
                          className="input flex-1 !py-2"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            recordPayment(p.id, parseFloat(payAmount))
                          }
                          className="btn btn-primary flex-1 py-2 text-sm"
                        >
                          Save payment
                        </button>
                        {remaining > 0 && (
                          <button
                            onClick={() => recordPayment(p.id, remaining)}
                            className="btn flex-1 bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700"
                          >
                            Pay full ({formatCurrency(remaining)})
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPayOpen(null);
                            setPayAmount("");
                            setPayNote("");
                          }}
                          className="btn btn-ghost px-3 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setPayOpen(p.id);
                        setError(null);
                      }}
                      className="btn btn-secondary mt-3 w-full py-2.5 text-sm"
                    >
                      <Wallet size={16} /> Record payment
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
