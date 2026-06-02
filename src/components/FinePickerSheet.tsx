"use client";

import { useEffect } from "react";
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
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Add fines to
            </p>
            <p className="text-base font-semibold">{playerName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Done
          </button>
        </div>

        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {fineTypes.map((ft) => {
            const count = counts[ft.id] ?? 0;
            return (
              <li
                key={ft.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {ft.name}{" "}
                    <span className="text-slate-400">
                      · {formatCurrency(ft.amount)}
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
                      className="h-9 w-9 rounded-full bg-slate-100 text-lg font-bold text-slate-600 active:bg-slate-200"
                      aria-label={`Remove one ${ft.name}`}
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-semibold tabular-nums">
                      {count}
                    </span>
                    <button
                      onClick={() => onPick(ft)}
                      className="h-9 w-9 rounded-full bg-brand text-lg font-bold text-white active:bg-brand-dark"
                      aria-label={`Add one ${ft.name}`}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onPick(ft)}
                    className="h-9 w-9 rounded-full bg-brand text-lg font-bold text-white active:bg-brand-dark"
                    aria-label={`Add ${ft.name}`}
                  >
                    +
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
