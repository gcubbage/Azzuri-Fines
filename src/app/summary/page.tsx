"use client";

import { useEffect, useMemo, useState } from "react";
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
    return <p className="py-10 text-center text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header totals + export */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-400">Owed</p>
              <p className="font-semibold">
                {formatCurrency(grandTotals.owed)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Paid</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(grandTotals.paid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Owing</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(grandTotals.remaining)}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white active:bg-slate-700"
        >
          ⬇ Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {players.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-500">
          No players yet.
        </p>
      )}

      {/* Per-player sections */}
      <ul className="space-y-3">
        {players.map((p) => {
          const owed = owedFor(p.id);
          const paid = paidFor(p.id);
          const remaining = owed - paid;
          const pf = finesByPlayer[p.id] ?? [];
          const isOpen = expanded[p.id];

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
            <li
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                }
                className="flex w-full items-center justify-between p-3 text-left"
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    Owed {formatCurrency(owed)} · Paid{" "}
                    {formatCurrency(paid)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-sm font-semibold ${
                      remaining <= 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {remaining <= 0
                      ? "Paid up"
                      : `${formatCurrency(remaining)} owing`}
                  </span>
                  <span className="text-slate-400">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-3 pb-3 pt-2">
                  {rounds.length === 0 && (
                    <p className="py-2 text-sm text-slate-400">
                      No fines yet.
                    </p>
                  )}
                  {rounds.map((r) => {
                    const roundTotal = r.items.reduce(
                      (s, f) => s + Number(f.amount),
                      0
                    );
                    return (
                      <div key={r.round} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">
                            {r.round}
                          </p>
                          <p className="text-sm text-slate-500">
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
                                  <p className="truncate text-sm">
                                    {ft?.name ?? "(deleted fine)"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {formatDate(f.created_at)}
                                  </p>
                                </div>
                                <span className="text-sm tabular-nums">
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
                    <div className="mt-2 rounded-lg bg-green-50 p-2">
                      <p className="text-xs font-semibold text-green-700">
                        Payments
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {(paymentsByPlayer[p.id] ?? []).map((pay) => (
                          <li
                            key={pay.id}
                            className="flex items-center justify-between text-xs text-green-800"
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
                    <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-brand"
                        />
                        <input
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          placeholder="Note (optional)"
                          className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-brand"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            recordPayment(p.id, parseFloat(payAmount))
                          }
                          className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white"
                        >
                          Save payment
                        </button>
                        {remaining > 0 && (
                          <button
                            onClick={() => recordPayment(p.id, remaining)}
                            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white"
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
                          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600"
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
                      className="mt-3 w-full rounded-lg border border-brand py-2 text-sm font-semibold text-brand active:bg-blue-50"
                    >
                      Record payment
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
