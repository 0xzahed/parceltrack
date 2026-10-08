import { db } from "@/lib/db";
import { Parcel } from "@/models/Parcel";
import type { ParcelStatus, TrackEvent } from "@/lib/couriers";

export interface ParcelDoc {
  id: string;
  trackingId: string;
  courier: string;
  status: ParcelStatus;
  summary: string;
  events: TrackEvent[];
  createdAt: string;
  updatedAt: string;
}

type NewParcel = Omit<ParcelDoc, "id" | "createdAt" | "updatedAt">;

const mem = new Map<string, ParcelDoc>();

const toDoc = (p: {
  _id?: unknown;
  id?: string;
  trackingId: string;
  courier: string;
  status: ParcelStatus;
  summary: string;
  events: TrackEvent[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}): ParcelDoc => ({
  id: String(p._id ?? p.id ?? ""),
  trackingId: p.trackingId,
  courier: p.courier,
  status: p.status,
  summary: p.summary,
  events: p.events,
  createdAt: String(p.createdAt ?? new Date().toISOString()),
  updatedAt: String(p.updatedAt ?? new Date().toISOString()),
});

export async function storageMode(): Promise<"mongo" | "memory"> {
  return (await db()) ? "mongo" : "memory";
}

export async function listParcels(): Promise<ParcelDoc[]> {
  if (await db()) {
    const rows = await Parcel.find({}).sort({ updatedAt: -1 }).lean().catch(() => []);
    return (rows as unknown as Parameters<typeof toDoc>[0][]).map(toDoc);
  }
  return [...mem.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function findParcel(id: string): Promise<ParcelDoc | null> {
  if (await db()) {
    const row = await Parcel.findById(id).lean().catch(() => null);
    return row ? toDoc(row as unknown as Parameters<typeof toDoc>[0]) : null;
  }
  return mem.get(id) ?? null;
}

export async function addParcel(p: NewParcel): Promise<ParcelDoc> {
  if (await db()) {
    const created = await Parcel.create(p);
    return toDoc(created.toObject() as unknown as Parameters<typeof toDoc>[0]);
  }
  const now = new Date().toISOString();
  const doc: ParcelDoc = { ...p, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: now, updatedAt: now };
  mem.set(doc.id, doc);
  return doc;
}

export async function updateParcel(
  id: string,
  patch: Partial<Pick<ParcelDoc, "status" | "summary" | "events">>,
): Promise<ParcelDoc | null> {
  if (await db()) {
    const row = await Parcel.findByIdAndUpdate(id, patch, { new: true }).lean().catch(() => null);
    return row ? toDoc(row as unknown as Parameters<typeof toDoc>[0]) : null;
  }
  const cur = mem.get(id);
  if (!cur) return null;
  const next: ParcelDoc = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  mem.set(id, next);
  return next;
}

export async function deleteParcel(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Parcel.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  return mem.delete(id);
}
