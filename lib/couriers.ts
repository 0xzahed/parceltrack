export const COURIERS = [
  { id: "steadfast", label: "Steadfast" },
  { id: "redx", label: "RedX" },
  { id: "pathao", label: "Pathao" },
  { id: "demo", label: "Demo (no keys needed)" },
] as const;

export type CourierId = (typeof COURIERS)[number]["id"];

export type ParcelStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "returned"
  | "cancelled"
  | "unknown";

export interface TrackEvent {
  at: string;
  note: string;
}

export interface TrackResult {
  status: ParcelStatus;
  summary: string;
  events: TrackEvent[];
}

const TIMEOUT = () => AbortSignal.timeout(15000);

class CourierConfigError extends Error {}

/** Deterministic demo tracker — stable results per tracking ID, no keys needed. */
function trackDemo(trackingId: string): TrackResult {
  let h = 0;
  for (const ch of trackingId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const stages: ParcelStatus[] = ["pending", "in_transit", "in_transit", "delivered", "returned"];
  const status = stages[h % stages.length];
  const now = Date.now();
  const day = 86400000;
  const events: TrackEvent[] = [
    { at: new Date(now - 3 * day).toISOString(), note: "Parcel received at hub" },
    { at: new Date(now - 2 * day).toISOString(), note: "In transit to destination" },
  ];
  if (status === "delivered")
    events.push({ at: new Date(now - day).toISOString(), note: "Delivered to customer" });
  if (status === "returned")
    events.push({ at: new Date(now - day).toISOString(), note: "Customer unavailable — returned" });
  const summary =
    status === "delivered"
      ? "Delivered to customer."
      : status === "returned"
        ? "Returned to merchant."
        : status === "pending"
          ? "Waiting for pickup."
          : "On the way to the customer.";
  return { status, summary, events };
}

function normalizeSteadfast(s: string): ParcelStatus {
  const t = s.toLowerCase();
  if (t.includes("deliver")) return "delivered";
  if (t.includes("cancel")) return "cancelled";
  if (t.includes("return")) return "returned";
  if (t.includes("hold") || t.includes("pending") || t.includes("review")) return "pending";
  return "in_transit";
}

async function trackSteadfast(trackingId: string): Promise<TrackResult> {
  const key = process.env.STEADFAST_API_KEY ?? "";
  const secret = process.env.STEADFAST_SECRET_KEY ?? "";
  if (!key || !secret) {
    throw new CourierConfigError(
      "Steadfast API keys are not configured. Add STEADFAST_API_KEY + STEADFAST_SECRET_KEY to .env, or use the Demo courier.",
    );
  }
  const r = await fetch(
    `https://portal.steadfast.com.bd/api/v1/status_by_cid/${encodeURIComponent(trackingId)}`,
    { headers: { "Api-Key": key, "Secret-Key": secret }, signal: TIMEOUT() },
  );
  if (!r.ok) throw new Error(`Steadfast API returned ${r.status}.`);
  const j = (await r.json()) as { delivery_status?: string };
  const raw = String(j.delivery_status ?? "unknown");
  return {
    status: normalizeSteadfast(raw),
    summary: `Steadfast: ${raw}.`,
    events: [{ at: new Date().toISOString(), note: raw }],
  };
}

export async function trackParcel(courier: string, trackingId: string): Promise<TrackResult> {
  const id = trackingId.trim();
  if (!id) throw new Error("Enter a tracking ID / invoice number.");
  switch (courier) {
    case "demo":
      return trackDemo(id);
    case "steadfast":
      return trackSteadfast(id);
    case "redx":
    case "pathao":
      throw new CourierConfigError(
        `${courier === "redx" ? "RedX" : "Pathao"} is not connected yet. Add its API fetcher in lib/couriers.ts, or use the Demo courier.`,
      );
    default:
      throw new Error("Unknown courier.");
  }
}

export function isConfigError(err: unknown): boolean {
  return err instanceof CourierConfigError;
}
