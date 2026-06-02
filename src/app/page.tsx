"use client";

import { useEffect, useMemo, useState } from "react";
import {
  supabase,
  type Player,
  type FineType,
} from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/format";
import FinePickerSheet from "@/components/FinePickerSheet";

type DraftEntry = { fineTypeId: string; name: string; amount: number };
type Draft = Record<string, DraftEntry[]>; // playerId -> entries

export default function AssignPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [round, setRound] = useState("");
  const [draft, setDraft] = useState<Draft>({});
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [playersRes, finesRes] = await Promise.all([
        supabase.from("players").select("*").order("name"),
        supabase.from("fine_types").select("*").order("sort_order"),
      ]);
      if (playersRes.error) setError(playersRes.error.message);
      if (finesRes.error) setError(finesRes.error.message);
      setPlayers(playersRes.data ?? []);
      setFineTypes(finesRes.data ?? []);
      setLoading(false);
    })();
  }, []);

  const addFine = (playerId: string, ft: FineType) => {
    setDraft((prev) => {
      const entries = prev[playerId] ? [...prev[playerId]] : [];
      entries.push({ fineTypeId: ft.id, name: ft.name, amount: ft.amount });
      return { ...prev, [playerId]: entries };
    });
  };

  const removeFine = (playerId: string, fineTypeId: string) => {
    setDraft((prev) => {
      const entries = prev[playerId] ? [...prev[playerId]] : [];
      const idx = entries.findIndex((e) => e.fineTypeId === fineTypeId);
      if (idx >= 0) entries.splice(idx, 1);
      const next = { ...prev, [playerId]: entries };
      if (entries.length === 0) delete next[playerId];
      return next;
    });
  };

  // Per-player grouped counts for badges/chips.
  const countsFor = (playerId: string): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const e of draft[playerId] ?? []) {
      counts[e.fineTypeId] = (counts[e.fineTypeId] ?? 0) + 1;
    }
    return counts;
  };

  const totals = useMemo(() => {
    let count = 0;
    let amount = 0;
    for (const entries of Object.values(draft)) {
      for (const e of entries) {
        count += 1;
        amount += Number(e.amount);
      }
    }
    return { count, amount };
  }, [draft]);

  const save = async () => {
    setError(null);
    setMessage(null);
    if (!round.trim()) {
      setError("Please enter a round name first (e.g. \"Round 3\").");
      return;
    }
    if (totals.count === 0) {
      setError("Add at least one fine before saving.");
      return;
    }
    setSaving(true);
    const rows = Object.entries(draft).flatMap(([playerId, entries]) =>
      entries.map((e) => ({
        player_id: playerId,
        fine_type_id: e.fineTypeId,
        round: round.trim(),
        amount: e.amount,
      }))
    );
    const { error: insertError } = await supabase.from("fines").insert(rows);
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDraft({});
    setMessage(
      `Saved ${rows.length} fine${rows.length === 1 ? "" : "s"} for ${round.trim()}.`
    );
  };

  if (loading) {
    return <p className="py-10 text-center text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Round input */}
      <div className="sticky top-[52px] z-20 -mx-4 bg-slate-100 px-4 pb-2 pt-1">
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Round
        </label>
        <input
          value={round}
          onChange={(e) => setRound(e.target.value)}
          placeholder="e.g. Round 3"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand"
        />
      </div>

      {message && (
        <div className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {players.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No players yet. Add some on the{" "}
          <a href="/players" className="font-semibold text-brand">
            Players
          </a>{" "}
          page.
        </div>
      )}

      {/* Player cards */}
      <ul className="space-y-3">
        {players.map((p) => {
          const entries = draft[p.id] ?? [];
          const counts = countsFor(p.id);
          const subtotal = entries.reduce((s, e) => s + Number(e.amount), 0);
          // Group chips by fine type, preserving first-seen order.
          const grouped: { fineTypeId: string; name: string; count: number }[] =
            [];
          for (const e of entries) {
            const existing = grouped.find((g) => g.fineTypeId === e.fineTypeId);
            if (existing) existing.count += 1;
            else
              grouped.push({
                fineTypeId: e.fineTypeId,
                name: e.name,
                count: 1,
              });
          }

          return (
            <li
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  {subtotal > 0 && (
                    <p className="text-sm text-slate-500">
                      {entries.length} fine{entries.length === 1 ? "" : "s"} ·{" "}
                      {formatCurrency(subtotal)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setOpenPlayerId(p.id)}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white active:bg-brand-dark"
                >
                  + Fine
                </button>
              </div>

              {grouped.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {grouped.map((g) => (
                    <button
                      key={g.fineTypeId}
                      onClick={() => removeFine(p.id, g.fineTypeId)}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand active:bg-blue-100"
                      title="Tap to remove one"
                    >
                      {g.name}
                      {g.count > 1 && (
                        <span className="font-bold">×{g.count}</span>
                      )}
                      <span className="text-slate-400">✕</span>
                    </button>
                  ))}
                </div>
              )}

              <FinePickerSheet
                open={openPlayerId === p.id}
                playerName={p.name}
                fineTypes={fineTypes}
                counts={counts}
                onPick={(ft) => addFine(p.id, ft)}
                onRemove={(ftId) => removeFine(p.id, ftId)}
                onClose={() => setOpenPlayerId(null)}
              />
            </li>
          );
        })}
      </ul>

      {/* Sticky save bar */}
      {totals.count > 0 && (
        <div className="fixed bottom-[60px] inset-x-0 z-30 px-4">
          <div className="mx-auto max-w-lg">
            <button
              onClick={save}
              disabled={saving}
              className="flex w-full items-center justify-between rounded-xl bg-brand px-4 py-3 font-semibold text-white shadow-lg active:bg-brand-dark disabled:opacity-60"
            >
              <span>
                {saving ? "Saving…" : "Save round"}
              </span>
              <span className="tabular-nums">
                {totals.count} · {formatCurrency(totals.amount)}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
