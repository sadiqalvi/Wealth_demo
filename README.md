# NayaPay Sukuk Demo

## Frontend-only (no backend)

To exercise the consumer UI, navigation, orders, and Sahulat flow without starting Python:

1. Copy `.env.local.example` to `.env.local` (or create `.env.local` with `NEXT_PUBLIC_DEMO_API_MOCK=true`).
2. Run `npm run dev` and open `http://127.0.0.1:3000`.

Data is **in-memory** (resets on refresh). The API console shows synthetic log lines for mock calls. The **admin** page at `/admin` is still its own static/synthetic UI and does not require the backend unless you extend it to call the API.

The **Wealth** chart uses the same code path in mock and live mode: it needs **at least one Sukuk holding** (place a buy in the demo). Mock holdings use an in-memory **accrual rate** so the line moves without pyTrader; with the real API, accrual comes from the backend snapshot.

## Deployed frontend (Vercel / etc.)

Production builds use **`https://api.pypsx.com`** as the API base when `NEXT_PUBLIC_DEMO_API_BASE_URL` is not set. Override that variable if your API lives elsewhere.

The browser must be allowed by the backend **CORS** list: set `PYTRADER_CORS_ORIGINS` on Render to include your site (e.g. `https://your-app.vercel.app`). Without that, the UI may show a network / “Failed to fetch” error even though the API is up.

## Local Run (full stack)

1. Start the backend from `pytrader-backend`:

```bash
set USE_SUPABASE=false
uvicorn app.main:app --reload --port 8000
```

2. Start the frontend from `nayaypaydemo`:

```bash
npm install
set NEXT_PUBLIC_DEMO_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

3. Open:

- Consumer app: `http://127.0.0.1:3000`
- Admin view: `http://127.0.0.1:3000/admin`
- Backend docs: `http://127.0.0.1:8000/docs`

## Demo Controls

- Market mode can be forced to `OPEN` or `CLOSED` from the admin page.
- Use `Simulate Market Open` on the admin page to release queued orders instantly.
- The consumer balance ticks locally from the backend `accrual_velocity_pkr_sec` snapshot and refreshes on a slower polling interval.

## Data Source

- Sukuk instruments are sourced live from the PSX debt instruments pipeline (Postgres `psx_debt_instruments` table populated by `fixed_income_workers`).
- Demo user state is stored locally in `../demo-data/nayapay_demo.sqlite3`.
