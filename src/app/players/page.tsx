"use client";

import { useEffect, useState } from "react";
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
      <h2 className="text-base font-semibold text-slate-700">Players</h2>

      {/* Add player */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPlayer()}
          placeholder="New player name"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand"
        />
        <button
          onClick={addPlayer}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white active:bg-brand-dark"
        >
          Add
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-slate-500">Loading…</p>
      ) : players.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No players yet — add your squad above.
        </p>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              {editingId === p.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(p.id)}
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-brand"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(p.id)}
                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{p.name}</span>
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 active:bg-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removePlayer(p)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 active:bg-red-100"
                  >
                    Remove
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
