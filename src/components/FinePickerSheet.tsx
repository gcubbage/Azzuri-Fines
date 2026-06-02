"use client";

import { useEffect } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { FineType } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/format";

type Props = {
  open: boolean;
  playerName: string;
  fineTypes: FineType[];
  // Map of fineTypeId -> count already added for this player (for the badge).
  counts: Record<string, number>;
  onPick: (fineType: FineType) => void;
  onRemove: (fineTypeId: string) => void;
  onClose: () => void;
};

export default function FinePickerSheet({
  open,
  playerName,
  fineTypes,
  counts,
  onPick,
  onRemove,
  onClose,
}: Props) {
  // Lock background scroll while the sheet is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[85vh] animate-sheet-up flex-col rounded-t-3xl bg-white shadow-float">
        {/* Grab handle */}
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 pt-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
              Add fines to
            </p>
            <p className="truncate text-base font-semibold text-ink">
              {playerName}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-primary px-4 py-2 text-sm">
            Done
          </button>
        </div>

        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          {fineTypes.map((ft) => {
            const count = counts[ft.id] ?? 0;
            return (
              <li
                key={ft.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${
                  count > 0 ? "bg-brand-50/50" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">
                    {ft.name}{" "}
                    <span className="font-semibold text-brand-700">
                      {formatCurrency(ft.amount)}
                    </span>
                  </p>
                  {ft.description && (
                    <p className="truncate text-xs text-slate-500">
                      {ft.description}
                    </p>
                  )}
                </div>

                {count > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRemove(ft.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-90 active:bg-slate-200"
                      aria-label={`Remove one ${ft.name}`}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-5 text-center font-semibold tabular-nums text-ink">
                      {count}
                    </span>
                    <button
                      onClick={() => onPick(ft)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition active:scale-90"
                      aria-label={`Add one ${ft.name}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onPick(ft)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-ink transition active:scale-90 active:bg-brand-200"
                    aria-label={`Add ${ft.name}`}
                  >
                    <Plus size={18} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
