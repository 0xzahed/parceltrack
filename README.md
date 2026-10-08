# ParcelTrack — every parcel, one dashboard

Track **Steadfast, RedX and Pathao** parcels side by side. Built for
Facebook sellers who juggle three courier tabs.

## Run it

```bash
npm install
cp .env.example .env   # optional — MongoDB storage + live Steadfast API
npm run dev            # http://localhost:3000
```

Without `MONGODB_URI` parcels are kept in memory (demo mode).
Without Steadfast keys, use the **Demo** courier — RedX/Pathao fetchers are
stubbed in `lib/couriers.ts` with exact integration points.

## Product notes

- Status pipeline: `pending → in_transit → delivered`, plus `returned/cancelled`.
- Stats cards update live from the same list endpoint.
- `POST /api/parcels/seed` loads 3 demo parcels for client demos.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Mongoose (optional)
