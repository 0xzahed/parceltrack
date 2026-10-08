"use client";

import { useCallback, useEffect, useState } from "react";
import { COURIERS, type ParcelStatus } from "@/lib/couriers";

interface Parcel {
  id: string;
  trackingId: string;
  courier: string;
  status: ParcelStatus;
  summary: string;
  events: { at: string; note: string }[];
  updatedAt: string;
}

interface Stats {
  total: number;
  in_transit: number;
  delivered: number;
  pending: number;
  returned: number;
}

const pill: Record<ParcelStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  in_transit: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  returned: "bg-red-500/15 text-red-300 border-red-500/40",
  cancelled: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  unknown: "bg-slate-500/15 text-slate-400 border-slate-600/40",
};

export default function Home() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [storage, setStorage] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [courier, setCourier] = useState("demo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/parcels");
      const j = await r.json();
      setParcels(j.parcels ?? []);
      setStats(j.stats ?? null);
      setStorage(j.storage ?? "");
    } catch {
      /* offline — keep old list */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/parcels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trackingId: trackingId.trim(), courier }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to add parcel.");
      setTrackingId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add parcel.");
    } finally {
      setBusy(false);
    }
  };

  const refresh = async (id: string) => {
    setError("");
    try {
      const r = await fetch("/api/parcels/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Refresh failed.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed.");
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/parcels?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  };

  const seed = async () => {
    setError("");
    await fetch("/api/parcels/seed", { method: "POST" });
    load();
  };

  const cards: { label: string; value: number; dot: string }[] = stats
    ? [
        { label: "In transit", value: stats.in_transit, dot: "bg-sky-400" },
        { label: "Delivered", value: stats.delivered, dot: "bg-emerald-400" },
        { label: "Pending", value: stats.pending, dot: "bg-amber-400" },
        { label: "Returned", value: stats.returned, dot: "bg-red-400" },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-sky-400">ParcelTrack</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Every parcel, one dashboard.
          </h1>
          <p className="mt-2 text-slate-400">
            Track Steadfast, RedX and Pathao parcels side by side — built for Facebook sellers.
          </p>
        </div>
        {storage && (
          <span className="rounded-full border border-slate-700 px-3 py-1 font-mono text-xs text-slate-400">
            storage: {storage}
          </span>
        )}
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              <p className="text-sm text-slate-400">{c.label}</p>
            </div>
            <p className="mt-1 text-3xl font-black tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Tracking ID / invoice no."
          spellCheck={false}
          autoComplete="off"
          className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 text-[15px] outline-none placeholder:text-slate-600 focus:border-sky-500"
        />
        <select
          value={courier}
          onChange={(e) => setCourier(e.target.value)}
          className="h-12 cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-4 outline-none focus:border-sky-500"
        >
          {COURIERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || !trackingId.trim()}
          className="h-12 shrink-0 cursor-pointer rounded-xl bg-sky-500 px-6 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Adding…" : "Track"}
        </button>
        <button
          type="button"
          onClick={seed}
          className="h-12 shrink-0 cursor-pointer rounded-xl border border-slate-700 px-5 text-slate-300 transition hover:border-sky-500 hover:text-white"
        >
          Demo data
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <ul className="mt-6 space-y-2.5">
        {parcels.map((p) => (
          <li key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${pill[p.status]}`}>
                {p.status.replace("_", " ")}
              </span>
              <span className="font-mono font-bold">{p.trackingId}</span>
              <span className="font-mono text-xs text-slate-500">{p.courier}</span>
              <span className="ml-auto flex gap-2">
                <button
                  onClick={() => refresh(p.id)}
                  className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-sky-500 hover:text-white"
                >
                  Refresh
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 transition hover:border-red-500 hover:text-red-300"
                >
                  Remove
                </button>
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">{p.summary}</p>
            {p.events.length > 0 && (
              <p className="mt-1 font-mono text-xs text-slate-600">
                ↳ {p.events[p.events.length - 1].note} ·{" "}
                {new Date(p.events[p.events.length - 1].at).toLocaleString()}
              </p>
            )}
          </li>
        ))}
      </ul>

      {parcels.length === 0 && (
        <p className="mt-10 text-center text-slate-500">
          No parcels yet — add one above, or load demo data.
        </p>
      )}
    </div>
  );
}
