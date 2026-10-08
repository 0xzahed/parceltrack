import { NextResponse } from "next/server";
import { trackParcel } from "@/lib/couriers";
import { addParcel, deleteParcel, listParcels, storageMode } from "@/lib/store";

export const dynamic = "force-dynamic"; // fresh statuses on every request

export async function GET() {
  const parcels = await listParcels();
  const stats = {
    total: parcels.length,
    in_transit: parcels.filter((p) => p.status === "in_transit").length,
    delivered: parcels.filter((p) => p.status === "delivered").length,
    pending: parcels.filter((p) => p.status === "pending").length,
    returned: parcels.filter((p) => p.status === "returned").length,
  };
  return NextResponse.json({ parcels, stats, storage: await storageMode() });
}

export async function POST(req: Request) {
  let body: { trackingId?: string; courier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON like { trackingId, courier }." }, { status: 400 });
  }
  const trackingId = String(body.trackingId ?? "").trim();
  const courier = String(body.courier ?? "").trim();
  if (!trackingId || !courier) {
    return NextResponse.json({ error: "trackingId and courier are required." }, { status: 400 });
  }
  try {
    const tracked = await trackParcel(courier, trackingId);
    const doc = await addParcel({ trackingId, courier, ...tracked });
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("duplicate") || String(err).includes("E11000"))) {
      return NextResponse.json({ error: "This parcel is already tracked." }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Tracking failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const ok = await deleteParcel(id);
  return NextResponse.json({ deleted: ok });
}
