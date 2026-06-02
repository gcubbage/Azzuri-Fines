"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { supabase, type Player } from "@/lib/supabaseClient";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data, error: e } = await supabase
      .from("players")
      .select("*")
      .order("name");
    if (e) setError(e.message);
    setPlayers(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addPlayer = async () => {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    const { error: e } = await supabase.from("players").insert({ name });
    if (e) {
      setError(e.message);
      return;
    }
    setNewName("");
    load();
  };

  const saveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    const { error: e } = await supabase
      .from("players")
      .update({ name })
      .eq("id", id);
    if (e) {
      setError(e.message);
      return;
    }
    setEditingId(null);
    load();
  };

  const removePlayer = async (p: Player) => {
    if (
      !window.confirm(
        `Remove ${p.name}? This also deletes all their fines and payments.`
      )
    )
      return;
    const { error: e } = await supabase.from("players").delete().eq("id", p.id);
    if (e) {
      setError(e.message);
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-ink">Players</h2>

      {/* Add player */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPlayer()}
          placeholder="New player name"
          className="input"
        />
        <button
          onClick={addPlayer}
          className="btn btn-primary shrink-0 px-4 py-3 text-sm"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {error && (
        <div className="animate-slide-up rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading…</span>
        </div>
      ) : players.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Users size={22} />
          </span>
          <p className="text-sm text-slate-500">
            No players yet — add your squad above.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.id} className="card flex items-center gap-2 !p-3">
              {editingId === p.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(p.id)}
                    className="input flex-1 !py-2"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(p.id)}
                    className="btn btn-primary px-3 py-2 text-sm"
                    aria-label="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="btn btn-ghost px-3 py-2 text-sm"
                    aria-label="Cancel"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 font-medium text-ink">{p.name}</span>
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                    className="btn btn-ghost px-3 py-2 text-sm"
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => removePlayer(p)}
                    className="btn btn-danger px-3 py-2 text-sm"
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
