import { NextResponse } from "next/server";
import { trackParcel } from "@/lib/couriers";
import { findParcel, updateParcel } from "@/lib/store";

export async function POST(req: Request) {
  let id = "";
  try {
    id = String((await req.json())?.id ?? "");
  } catch {
    return NextResponse.json({ error: "Send JSON like { id }." }, { status: 400 });
  }
  const parcel = await findParcel(id);
  if (!parcel) return NextResponse.json({ error: "Parcel not found." }, { status: 404 });
  try {
    const tracked = await trackParcel(parcel.courier, parcel.trackingId);
    const updated = await updateParcel(id, tracked);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
