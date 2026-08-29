# pyPSX Broker API Documentation

> Complete documentation for the **pyPSX Broker API** — the embedded-finance (B2B) layer that lets a fintech embed Pakistan Stock Exchange (PSX) trading for its own end-users.
> Sandbox base URL (local): `http://localhost:8080`

---

# Getting Started

Welcome to the **pyPSX Broker API** — the embedded-finance platform for building brokerage experiences on top of the Pakistan Stock Exchange (PSX). If the [pyPSX trading SDK](https://markets.pypsx.com/docs) is for *you* trading your own account, the Broker API is for *your company* offering trading to *your* users. It's the "Alpaca of PSX": you hold one partner API key, and through it you onboard end-users, fund them, place orders on their behalf, and read their portfolios — all scoped privately to your organization.

## What is the Broker API?

The Broker API is a thin **orchestration layer** over the same trading engine that powers the pyPSX platform. There is **one engine and one database**; your end-users are real rows in it, tagged with your `partner_id`, and every Broker API call you make is automatically filtered to *your* users only. A licensed partner broker (integrated separately) performs the real regulated work for live trading; in **sandbox** everything is simulated so you can build and test end-to-end today.

Two surfaces make up the product:

- **Partner Portal** (`/partner-docs/portal.html`) — a web dashboard where your team registers, logs in, generates/rotates/revokes API keys, and monitors onboarded users, orders, and market data.
- **Partner API** (`/v1/partner-api/*`) — the REST API your application calls with your key to onboard users, trade, and read data.

## Sandbox vs Live

| | **Sandbox** (available now) | **Live** (requires broker + SECP approval) |
|---|---|---|
| Market data | Synthetic, deterministic PSX prices | Real PSX feed |
| Order execution | Simulated instant fills | Real market execution via licensed broker |
| Funding | Flat starter balance (PKR 1,000,000) | Real deposits/withdrawals |
| Money at risk | None | Real |
| KYC | Name + email | Full regulatory KYC |

> **You can build your entire app against sandbox now.** The API contract does not change when you go live — you swap keys and flip the environment. Live is gated behind SECP compliance and a broker integration.

## Get Your API Keys

1. Open the **Partner Portal**: `http://localhost:8080/partner-docs/portal.html`
2. **Register** your company (or **log in**). You get a portal session (JWT) used only for managing keys.
3. Go to **API Keys → Generate API Key**. You receive:
   - an **API Key ID** (e.g. `PYPSX-SANDBOX-ACME-49DA50D83A8C`) — public, safe to log
   - an **API Secret Key** — **shown once**, store it immediately
4. Sandbox key IDs contain `SANDBOX`; production keys contain `LIVE`.

> **Prefer the API?** You can also mint keys programmatically — see [Portal Auth & Key Management](#portal-auth--key-management). A platform admin can pre-provision keys too.

## Authentication — two credential types

The Broker API uses two different credentials for two different jobs:

| Credential | Used for | Sent as |
|---|---|---|
| **Portal JWT** | Managing your org: login, list/create/revoke keys | `Authorization: Bearer <token>` |
| **API Key + Secret** | Every data/trading call | `PYPSX-ORG-API-KEY-ID` + `PYPSX-ORG-API-SECRET-KEY` headers |

Every `/v1/partner-api/*` request sends **both** key headers:

```bash
export PYPSX_KEY_ID="PYPSX-SANDBOX-ACME-49DA50D83A8C"
export PYPSX_SECRET="your-secret-shown-once"
export BASE="http://localhost:8080"

curl "$BASE/v1/partner-api/market/quote/HBL" \
  -H "PYPSX-ORG-API-KEY-ID: $PYPSX_KEY_ID" \
  -H "PYPSX-ORG-API-SECRET-KEY: $PYPSX_SECRET"
```

> **Security — read this before you ship.** The secret must live on **your server**, never in browser JavaScript. Your app's frontend calls *your* backend, and *your* backend calls the pyPSX Broker API with the key. If you put the secret in client-side code, every user can read it. (See [Security & Architecture](#security--architecture).)

## Scopes

Each key carries scopes. Requests missing a required scope get `403`.

| Scope | Grants |
|---|---|
| `accounts:read` | Read accounts, positions, portfolio, dashboard |
| `accounts:write` | Create sub-accounts |
| `trading:read` | Read orders |
| `trading:write` | Place / cancel orders |

Wildcards `*`, `read:*`, `write:*` are honored. Market-data endpoints need only a valid key (no specific scope). New sandbox keys get all four scopes by default.

---

# Quick Start — 5 Minutes to First Trade

Assumes you've generated a key and set `$BASE`, `$PYPSX_KEY_ID`, `$PYPSX_SECRET`. The Python examples use `requests`.

```python
import requests

BASE = "http://localhost:8080"
H = {
    "PYPSX-ORG-API-KEY-ID": "PYPSX-SANDBOX-ACME-49DA50D83A8C",
    "PYPSX-ORG-API-SECRET-KEY": "your-secret",
}
```

### 1. Onboard an end-user

Sandbox KYC is just name + email. The account is created ACTIVE and funded with PKR 1,000,000.

```python
acct = requests.post(f"{BASE}/v1/partner-api/accounts", headers=H, json={
    "full_name": "Ali Khan",
    "email": "ali@example.pk",
}).json()

sub = acct["account_id"]          # e.g. "acct_7e7e2830df60485db8f0"
print(acct["status"], acct["balance"]["cash"])   # ACTIVE 1000000.0
```

### 2. Check the live price before trading

```python
q = requests.get(f"{BASE}/v1/partner-api/market/quote/HBL", headers=H).json()
print(q["last"], q["bid"], q["ask"], q["change_pct"])
```

### 3. Place an order on the user's behalf

```python
order = requests.post(f"{BASE}/v1/partner-api/orders", headers=H, json={
    "sub_account_id": sub,
    "symbol": "HBL",
    "side": "BUY",
    "quantity": 100,
    "order_type": "MARKET",
}).json()

print(order["status"], order["avg_fill_price"], order["cash_balance"])
```

### 4. Show the user's portfolio

```python
pf = requests.get(f"{BASE}/v1/partner-api/accounts/{sub}/portfolio", headers=H).json()
print("Equity:", pf["equity"])
print("Unrealized P&L:", pf["total_unrealized_pnl"])
for p in pf["positions"]:
    print(p["symbol"], p["quantity"], p["market_value"], p["unrealized_pnl"])
```

### 5. List the user's orders

```python
orders = requests.get(
    f"{BASE}/v1/partner-api/orders?sub_account_id={sub}", headers=H
).json()["orders"]
for o in orders:
    print(o["symbol"], o["side"], o["quantity"], o["status"])
```

That's the whole loop: **onboard → quote → trade → portfolio**. Everything below is the full reference.

---

# Core Concepts

- **Partner** — your organization, identified by `partner_id` (derived from your company name at registration, e.g. `ACME`). Everything you create is owned by this id.
- **Sub-account** — one end-user's brokerage account under your partner. Identified by an `account_id` (also called `sub_account_id`, e.g. `acct_...`). This is the id you pass to trade and read data.
- **Tenant isolation** — a key can only ever see its own partner's sub-accounts. Requesting another partner's `account_id` returns `404`, never their data. This is enforced on every endpoint.
- **Broker account number** — the underlying account at the licensed broker, returned on creation (mock in sandbox).

---

# Portal Auth & Key Management

These endpoints manage your organization and keys. They authenticate with the **portal JWT** (`Authorization: Bearer`), *not* the API key — except registration/login, which need no auth.

## `POST /v1/partner/auth/register`

Register a company + admin login. Returns a portal session token.

```bash
curl -X POST "$BASE/v1/partner/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Acme Fintech","email":"dev@acme.test","password":"Password123!"}'
```

| Field | Required | Notes |
|---|---|---|
| `company_name` | ✓ | Slugs to your `partner_id` (e.g. "Acme Fintech" → `ACME_FINTECH`) |
| `email` | ✓ | Admin login |
| `password` | ✓ | Min 8 chars |

Response: `{ "token": "<jwt>", "partner_id": "ACME_FINTECH", "email": "...", "display_name": "Acme Fintech" }`

## `POST /v1/partner/auth/login`

```bash
curl -X POST "$BASE/v1/partner/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@acme.test","password":"Password123!"}'
```

Returns the same shape as register. `401` on bad credentials.

## `GET /v1/partner/auth/me`

Returns the current session's `{partner_id, user_id, email}`. Requires `Authorization: Bearer`.

## `GET /v1/partner/keys`

List your active API keys (metadata only — secrets are never returned).

```bash
curl "$BASE/v1/partner/keys" -H "Authorization: Bearer $TOKEN"
```

Each item: `{ id, partner_id, label, prefix, scopes, environment, is_active, last_used, created_at }`. The `prefix` is the API Key ID.

## `POST /v1/partner/keys`

Generate a new sandbox key. **The secret is returned once.**

```bash
curl -X POST "$BASE/v1/partner/keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"My backend key"}'
```

| Field | Required | Notes |
|---|---|---|
| `label` | – | Human label |
| `scopes` | – | Defaults to all four sandbox scopes |

Response: `{ id, label, environment, scopes, api_key_id, api_secret_key }` — store `api_secret_key` now.

## `DELETE /v1/partner/keys/{key_id}`

Revoke a key (tenant-scoped — you can only revoke your own).

```bash
curl -X DELETE "$BASE/v1/partner/keys/<id>" -H "Authorization: Bearer $TOKEN"
```

Returns `{ "status": "revoked", "key_id": "..." }`, or `404` if not found.

---

# Accounts & KYC

Onboard and read your end-users. All calls use the API key headers.

## `POST /v1/partner-api/accounts`  · scope `accounts:write`

Create one end-user sub-account. In sandbox it's auto-approved (`ACTIVE`) and funded with PKR 1,000,000.

```bash
curl -X POST "$BASE/v1/partner-api/accounts" \
  -H "PYPSX-ORG-API-KEY-ID: $PYPSX_KEY_ID" \
  -H "PYPSX-ORG-API-SECRET-KEY: $PYPSX_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Ali Khan","email":"ali@example.pk"}'
```

| Field | Required | Notes |
|---|---|---|
| `full_name` | ✓ | 2–200 chars |
| `email` | ✓ | Used for dedupe if no CNIC |
| `cnic` | – | Optional in sandbox (full KYC applies for live) |
| `phone` | – | |
| `address` | – | |
| `partner_reference_id` | – | Your own id for this user, echoed back |
| `metadata` | – | Arbitrary JSON object |

**Response (201):**

```json
{
  "account_id": "acct_7e7e2830df60485db8f0",
  "sub_account_id": "acct_7e7e2830df60485db8f0",
  "partner_id": "ACME_FINTECH",
  "status": "ACTIVE",
  "kyc_status": "APPROVED",
  "full_name": "Ali Khan",
  "email": "ali@example.pk",
  "partner_reference_id": null,
  "broker_account_number": "BRK-ACME_FINTECH-FAA07E4100",
  "balance": {
    "currency": "PKR",
    "cash": 1000000.0,
    "reserved_cash": 0.0,
    "available_cash": 1000000.0,
    "equity": 1000000.0
  },
  "created_at": "2026-08-18T12:00:00+00:00"
}
```

Duplicate email (or CNIC, if provided) under the same partner returns `409`.

## `GET /v1/partner-api/accounts`  · scope `accounts:read`

Paginated, searchable list of your sub-accounts.

```bash
curl "$BASE/v1/partner-api/accounts?limit=50&offset=0&search=ali" \
  -H "PYPSX-ORG-API-KEY-ID: $PYPSX_KEY_ID" -H "PYPSX-ORG-API-SECRET-KEY: $PYPSX_SECRET"
```

| Query param | Default | Notes |
|---|---|---|
| `limit` | 50 | 1–500 |
| `offset` | 0 | |
| `search` | – | Matches name, email, sub-account id |

Response: `{ partner_id, total, limit, offset, accounts: [ <account object>, ... ] }`.

## `GET /v1/partner-api/accounts/{account_id}`  · scope `accounts:read`

Fetch one account (tenant-scoped; `404` if not yours). Returns the account object shown above.

---

# Market Data

Market data reads from the **same feed the pyPSX algo platform uses** (the PSX live feed cached in Redis). When that feed is running, quotes, order fills, and position marks are all **real live prices**; when it isn't (offline/local sandbox), the API automatically falls back to a **deterministic synthetic** price so everything still works. The `is_synthetic` field on each quote tells you which you're getting. Needs only a valid key (no scope). The universe is the real curated PSX list (KMI-30, KSE-100, and sector constituents).

> **Enabling the live feed locally:** the portal Docker stack defaults to synthetic (no external dependencies). To pull the real PSX feed, run the `live` profile in `LIVE_FEED` mode (see [Local Testing](#local-testing-with-docker)). The feed host is usually reachable only from the licensed broker environment.

## `GET /v1/partner-api/market/instruments`

```bash
curl "$BASE/v1/partner-api/market/instruments" \
  -H "PYPSX-ORG-API-KEY-ID: $PYPSX_KEY_ID" -H "PYPSX-ORG-API-SECRET-KEY: $PYPSX_SECRET"
```

Response: `{ count, instruments: [ { symbol, name, sector }, ... ] }`.

## `GET /v1/partner-api/market/quote/{symbol}`

```json
{
  "symbol": "HBL", "last": 140.21, "bid": 140.07, "ask": 140.35,
  "prev_close": 144.32, "change": -4.11, "change_pct": -2.85,
  "currency": "PKR", "is_synthetic": true, "ts": "2026-08-18T12:00:00+00:00"
}
```

`404` for an unknown symbol.

## `GET /v1/partner-api/market/quotes?symbols=HBL,OGDC,LUCK`

Batch quotes. Response: `{ count, quotes: [ <quote>, ... ] }` (unknown symbols are skipped).

## `GET /v1/partner-api/market/klines/{symbol}?limit=30`

Daily OHLC candles (`limit` 1–365). Response: `{ symbol, timeframe: "1d", count, candles: [ { t, o, h, l, c, v }, ... ] }` where `t` is a UNIX timestamp (seconds).

## Indices & Sectors — "which stocks are in KMI-30?"

Build a universe from a real index or sector without hardcoding tickers. The lists are the curated PSX constituents (KMI-30, KSE-100, and major sectors), and every returned symbol has a quote.

### `GET /v1/partner-api/market/indices`

```json
{ "indices": [ { "name": "KMI-30", "count": 30 }, { "name": "KSE-100", "count": 30 } ] }
```

### `GET /v1/partner-api/market/indices/{name}`

`name` accepts `KMI-30`, `KMI30`, `KSE-100`, etc. Add `?with_quotes=true` to include a live quote for each.

```bash
curl "$BASE/v1/partner-api/market/indices/KMI-30?with_quotes=true" \
  -H "PYPSX-ORG-API-KEY-ID: $PYPSX_KEY_ID" -H "PYPSX-ORG-API-SECRET-KEY: $PYPSX_SECRET"
```

```json
{
  "index": "KMI-30", "count": 30,
  "symbols": ["OGDC","PPL","HBL","MCB","UBL","MEBL","LUCK","ENGROH", "..."],
  "quotes": [ { "symbol": "OGDC", "last": 152.4, "...": "..." } ]
}
```

`404` for an unknown index.

### `GET /v1/partner-api/market/sectors` and `GET /v1/partner-api/market/sectors/{name}`

List sectors (`Banking`, `Cement`, `Oil & Gas`, `Technology`, …) and their constituents (`?with_quotes=true` supported).

```python
# A KMI-30 app in three calls:
symbols = requests.get(f"{BASE}/v1/partner-api/market/indices/KMI-30", headers=H).json()["symbols"]
quotes  = requests.get(f"{BASE}/v1/partner-api/market/quotes?symbols={','.join(symbols)}", headers=H).json()["quotes"]
# ...render your KMI-30 watchlist, then place orders on any of `symbols`.
```

> The `/market/instruments` list also tags each symbol with its `sector` and `indices` membership, so you can filter client-side too.

---

# Orders

Place and manage orders on behalf of a sub-account. Sandbox fills are immediate at the current market price (MARKET) or your limit (LIMIT).

## `POST /v1/partner-api/orders`  · scope `trading:write`

```bash
curl -X POST "$BASE/v1/partner-api/orders" \
  -H "PYPSX-ORG-API-KEY-ID: $PYPSX_KEY_ID" \
  -H "PYPSX-ORG-API-SECRET-KEY: $PYPSX_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"sub_account_id":"acct_123","symbol":"HBL","side":"BUY","quantity":100,"order_type":"MARKET"}'
```

| Field | Required | Notes |
|---|---|---|
| `sub_account_id` | ✓ | Must be one of your accounts |
| `symbol` | ✓ | e.g. `HBL` |
| `side` | ✓ | `BUY` or `SELL` |
| `quantity` | ✓ | > 0 |
| `order_type` | – | `MARKET` (default) or `LIMIT` |
| `price` | for LIMIT | Required when `order_type` is `LIMIT` |

**Response (201):**

```json
{
  "order_id": "po_a9e08ff91fa743c4",
  "broker_order_id": "BORD-88ea11466110",
  "sub_account_id": "acct_123",
  "symbol": "HBL", "side": "BUY", "quantity": 100.0, "price": 140.21,
  "order_type": "MARKET", "status": "FILLED",
  "filled_qty": 100.0, "avg_fill_price": 140.21, "notional": 14021.0,
  "cash_balance": 985979.0, "equity": 1000000.0,
  "positions": { "HBL": { "qty": 100.0, "avg_price": 140.21 } },
  "created_at": "2026-08-18T12:00:00+00:00"
}
```

Errors: `422` insufficient cash (BUY) or insufficient position (SELL); `404` unknown sub-account; `409` sub-account not ACTIVE.

## `GET /v1/partner-api/orders?sub_account_id=&limit=`  · scope `trading:read`

List orders/fills. `sub_account_id` optional (omit for all your accounts). Response: `{ partner_id, count, orders: [ { order_id, sub_account_id, symbol, side, quantity, price, order_type, status, filled_qty, avg_fill_price, created_at }, ... ] }`.

## `GET /v1/partner-api/orders/{order_id}`  · scope `trading:read`

Fetch one order (tenant-scoped; `404` otherwise).

## `DELETE /v1/partner-api/orders/{order_id}`  · scope `trading:write`

Cancel an open order. Returns `{ order_id, status: "CANCELED" }`.

> **Note:** sandbox orders fill instantly, so a just-placed order is usually already `FILLED` and cancel returns `409` (`Order cannot be canceled (status=FILLED)`). The endpoint exists for API completeness and for resting orders under live execution.

---

# Positions & Portfolio

Both are tenant-scoped and marked to the live sandbox market price.

## `GET /v1/partner-api/accounts/{account_id}/positions`  · scope `accounts:read`

```json
{
  "account_id": "acct_123",
  "positions": [
    {
      "symbol": "HBL", "quantity": 100.0, "avg_price": 140.21,
      "last_price": 140.21, "market_value": 14021.0, "cost_basis": 14021.0,
      "unrealized_pnl": 0.0, "unrealized_pnl_pct": 0.0
    }
  ],
  "positions_market_value": 14021.0,
  "total_unrealized_pnl": 0.0,
  "currency": "PKR"
}
```

## `GET /v1/partner-api/accounts/{account_id}/portfolio`  · scope `accounts:read`

Cash + equity + positions in one call.

```json
{
  "account_id": "acct_123",
  "cash": 985979.0, "reserved_cash": 0.0, "available_cash": 985979.0,
  "positions_market_value": 14021.0, "equity": 1000000.0,
  "total_unrealized_pnl": 0.0,
  "positions": [ /* same rows as /positions */ ],
  "currency": "PKR"
}
```

---

# Metrics

## `GET /v1/partner-api/dashboard/summary`  · scope `accounts:read`

Aggregate metrics for your partner.

```json
{
  "partner_id": "ACME_FINTECH",
  "total_accounts": 12, "active_accounts": 12, "total_users": 12,
  "orders_today": 34, "orders_this_week": 128,
  "sandbox_aum": 12450000.0, "currency": "PKR"
}
```

---

# Local Testing with Docker

Everything runs on `http://localhost:8080` — no `api.pypsx.com`, no external services. This is the recommended way to build and test your app.

## Boot the stack

From the `pypsx_papertrading-embedded-finance` directory:

```bash
docker compose -f docker-compose.portal.yml up -d --build
```

This starts Postgres + Redis + the backend (synthetic market mode, mock broker), serves the portal and sample app, and seeds a ready-to-use sandbox partner. After a minute:

| Thing | URL |
|---|---|
| Partner Portal | `http://localhost:8080/partner-docs/portal.html` |
| Sample App | `http://localhost:8080/partner-docs/sample-app.html` |
| Interactive API docs (Swagger) | `http://localhost:8080/docs` |
| Seeded login | `pypsxofficial@gmail.com` / `pyPSX_2026Yeezy` |

The seeded API key is printed in the seed logs:

```bash
docker compose -f docker-compose.portal.yml logs seed
```

## Run the automated end-to-end test

```bash
docker compose -f docker-compose.portal.yml run --rm smoke
```

This drives the live backend (register → key → onboard → quote → trade → portfolio → tenant isolation) and prints `N/N checks passed`.

## Point your app at it

Set your app's server-side base URL to `http://localhost:8080` and use the seeded (or your own generated) key. If your app also runs locally (e.g. `next dev`), it can call `http://localhost:8080` directly.

## Optional: real PSX live feed

By default the stack uses synthetic prices (no external dependencies). To pull the **real** PSX feed — the same pipeline the algo platform runs — start the `live` profile in `LIVE_FEED` mode:

```bash
PYPSX_MARKET_DATA_MODE=LIVE_FEED docker compose -f docker-compose.portal.yml --profile live up -d --build
```

This adds a `live-feed` daemon (streams the exchange feed into Redis) and a `worker` (builds the price caches the API reads). The API needs no change — it already reads that source, so quotes/fills/marks become live. The feed host (`PSX_TCP_HOST`) is typically reachable only from the licensed broker environment; on a normal laptop the daemon won't connect and the API stays on synthetic prices.

## Tear down

```bash
docker compose -f docker-compose.portal.yml down -v      # -v wipes the DB (and keys)
```

> **`down -v` deletes the database volume**, so generated keys and users are gone — mint fresh ones after a reset. The DB only re-runs its init scripts on an empty volume.

---

# Security & Architecture

The correct integration keeps the secret server-side:

```
Your app frontend  (browser — no secret)
        │  calls your own backend
        ▼
Your app backend   (holds PYPSX-ORG-API-SECRET-KEY in an env var)
        │  calls the pyPSX Broker API
        ▼
pyPSX Broker API   →  one engine + one DB (your users tagged by partner_id)
```

- **Never** put the API secret in client-side JavaScript, mobile app bundles, or public repos.
- Each end-user request from your app hits *your* server, which attaches the key and calls pyPSX.
- Rotate keys from the portal if one is exposed; revoke the old one.
- Tenant isolation is enforced server-side, but treat your `partner_id`'s data as your responsibility.

---

# Errors

Standard HTTP status codes. Error bodies are `{ "detail": "<message>" }`.

| Status | Meaning |
|---|---|
| `401` | Missing/invalid API key or portal token |
| `403` | Authenticated but key lacks the required scope |
| `404` | Not found, or not owned by your partner (tenant isolation) |
| `409` | Conflict — duplicate account, or order not cancelable |
| `422` | Validation error — bad body, insufficient cash/position |
| `501` | Backend not configured for this operation |

---

# What's Not in Sandbox Yet

These are on the roadmap and **not** available in sandbox. Build around the stable contract above; these will be additive.

- **Real market feed** — *integrated* (same Redis-backed PSX feed as the algo platform), but off by default in local sandbox; enable the `live` profile with feed access. Prices are synthetic until then.
- **Funding & journals** — money movement between your firm account and end-users (deposits/withdrawals). Sandbox uses a flat starter balance.
- **Webhooks / event stream** — push notifications for fills and KYC. For now, poll the orders/portfolio endpoints.
- **Live execution** — real orders on PSX via the licensed broker, gated behind SECP compliance approval.

---

# Endpoint Index

| Method | Path | Auth | Scope |
|---|---|---|---|
| POST | `/v1/partner/auth/register` | none | – |
| POST | `/v1/partner/auth/login` | none | – |
| GET | `/v1/partner/auth/me` | Bearer | – |
| GET | `/v1/partner/keys` | Bearer | – |
| POST | `/v1/partner/keys` | Bearer | – |
| DELETE | `/v1/partner/keys/{key_id}` | Bearer | – |
| POST | `/v1/partner-api/accounts` | Key | `accounts:write` |
| GET | `/v1/partner-api/accounts` | Key | `accounts:read` |
| GET | `/v1/partner-api/accounts/{id}` | Key | `accounts:read` |
| GET | `/v1/partner-api/accounts/{id}/positions` | Key | `accounts:read` |
| GET | `/v1/partner-api/accounts/{id}/portfolio` | Key | `accounts:read` |
| GET | `/v1/partner-api/market/instruments` | Key | – |
| GET | `/v1/partner-api/market/quote/{symbol}` | Key | – |
| GET | `/v1/partner-api/market/quotes` | Key | – |
| GET | `/v1/partner-api/market/klines/{symbol}` | Key | – |
| GET | `/v1/partner-api/market/indices` | Key | – |
| GET | `/v1/partner-api/market/indices/{name}` | Key | – |
| GET | `/v1/partner-api/market/sectors` | Key | – |
| GET | `/v1/partner-api/market/sectors/{name}` | Key | – |
| POST | `/v1/partner-api/orders` | Key | `trading:write` |
| GET | `/v1/partner-api/orders` | Key | `trading:read` |
| GET | `/v1/partner-api/orders/{order_id}` | Key | `trading:read` |
| DELETE | `/v1/partner-api/orders/{order_id}` | Key | `trading:write` |
| GET | `/v1/partner-api/dashboard/summary` | Key | `accounts:read` |
