import { NextResponse } from "next/server";
import { trackParcel } from "@/lib/couriers";
import { addParcel } from "@/lib/store";

/** One-click demo data — uses the Demo courier, no API keys needed. */
export async function POST() {
  const samples = [
    { trackingId: "DEMO-1001", courier: "demo" },
    { trackingId: "DEMO-1002", courier: "demo" },
    { trackingId: "DEMO-1003", courier: "demo" },
  ];
  const added = [];
  for (const s of samples) {
    try {
      const tracked = await trackParcel(s.courier, s.trackingId);
      added.push(await addParcel({ ...s, ...tracked }));
    } catch {
      /* duplicate on re-seed — skip */
    }
  }
  return NextResponse.json({ added: added.length });
}
