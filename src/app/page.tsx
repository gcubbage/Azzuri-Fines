"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Users, X } from "lucide-react";
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
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Round input */}
      <div className="sticky top-[57px] z-20 -mx-4 bg-[#f4f8fc]/90 px-4 pb-3 pt-1 backdrop-blur-sm">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Round
        </label>
        <input
          value={round}
          onChange={(e) => setRound(e.target.value)}
          placeholder="e.g. Round 3"
          className="input"
        />
      </div>

      {message && (
        <div className="animate-slide-up rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700">
          {message}
        </div>
      )}
      {error && (
        <div className="animate-slide-up rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {players.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Users size={22} />
          </span>
          <p className="text-sm text-slate-500">
            No players yet. Add some on the{" "}
            <a href="/players" className="font-semibold text-brand-700">
              Players
            </a>{" "}
            page.
          </p>
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
            <li key={p.id} className="card !p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{p.name}</p>
                  {subtotal > 0 ? (
                    <p className="text-sm font-medium text-brand-700">
                      {entries.length} fine{entries.length === 1 ? "" : "s"} ·{" "}
                      {formatCurrency(subtotal)}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">No fines yet</p>
                  )}
                </div>
                <button
                  onClick={() => setOpenPlayerId(p.id)}
                  className="btn btn-primary shrink-0 px-3.5 py-2 text-sm"
                >
                  <Plus size={16} /> Fine
                </button>
              </div>

              {grouped.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {grouped.map((g) => (
                    <button
                      key={g.fineTypeId}
                      onClick={() => removeFine(p.id, g.fineTypeId)}
                      className="chip"
                      title="Tap to remove one"
                    >
                      {g.name}
                      {g.count > 1 && (
                        <span className="font-bold">×{g.count}</span>
                      )}
                      <X size={12} className="text-brand-600" />
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
        <div className="fixed bottom-[72px] inset-x-0 z-30 px-4">
          <div className="mx-auto max-w-lg">
            <button
              onClick={save}
              disabled={saving}
              className="btn btn-primary flex w-full items-center justify-between px-4 py-3.5 text-base shadow-float"
            >
              <span className="flex items-center gap-2">
                {saving && <Loader2 className="animate-spin" size={18} />}
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
