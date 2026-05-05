# TLAC backend API contract (integration notes)

Reference deployment used during frontend integration:

| Item | URL |
|------|-----|
| API host | `http://ec2-3-219-93-142.compute-1.amazonaws.com:3000` |
| API base (`/api/v1`) | `http://ec2-3-219-93-142.compute-1.amazonaws.com:3000/api/v1` |
| Health | `http://ec2-3-219-93-142.compute-1.amazonaws.com:3000/health` |

The Expo app sets `EXPO_PUBLIC_API_BASE_URL` to the **`/api/v1`** URL; `GET /health` is **not** under `/api/v1` (see app helper `API_HOST_URL` + `checkBackendHealth()`).

## Auth workflow

1. `POST /api/v1/auth/register` — create account (body matches app `RegisterInput`).
2. `POST /api/v1/auth/login` — obtain tokens (body matches `LoginInput`).
3. `POST /api/v1/auth/refresh` — refresh access token (app sends `{ refreshToken }`; slice + secure storage updated on success).
4. `GET /api/v1/auth/me` — current user (requires `Authorization: Bearer <access_token>`).
5. `POST /api/v1/auth/logout` — invalidate session (app clears local credentials).

Protected requests send **`Authorization: Bearer <ACCESS_TOKEN>`**. On **401**, the app attempts refresh once (remote mode only), then retries the original request or clears credentials.

## Auth gating policy (mobile app)

- **Student / Fan browse** — In remote mode, main Student / Fan surfaces (`/discover`, Surplus, Impact, etc.) are **public**; the app does not require a session to load public list/read endpoints.
- **Protected calls** — Endpoints and flows that need the current user require a valid access token, including: **`GET /auth/me`**, **`GET /claims/me`**, **`GET /impact/me`**, claim/pickup timer flows, host dashboard mutations (create/edit/publish tailgate, surplus, donations), and similar write/host workflows.
- **Host tabs** — Remote mode expects hosts to be signed in; the host shell redirects unauthenticated users to login. Screens still **skip** `/auth/me` (and related queries) when `remote && !authenticated` so deep links do not fire protected requests before the redirect completes.
- **Claim → login → Surplus** — Tapping Claim while logged out opens **`/login`** with safe redirect params (`redirectTo`, `intent`, `surplusId`). After sign-in, the app navigates back to **`/surplus`** with optional **`focusSurplusId`** / **`claimSurplusId`** query params so the UI can prompt the user to claim (no auto-submit).

## Public endpoints (no auth required for basic reads)

- `GET /api/v1/games/current`
- `GET /api/v1/tailgates`
- `GET /api/v1/tailgates/:id`
- `GET /api/v1/tailgates/:id/menu`
- `GET /api/v1/surplus`
- `GET /api/v1/surplus/:id`
- `GET /api/v1/donation-centers`
- `GET /api/v1/donation-centers/:id`
- `GET /api/v1/impact/global`

## Protected endpoints (Bearer token)

Examples (non-exhaustive; align with FastAPI routes):

- Tailgates: `POST/PATCH/DELETE /api/v1/tailgates`, menu mutations under tailgates / menu-items.
- Surplus: `POST/PATCH /api/v1/surplus`.
- **Claims (preferred):** `POST /api/v1/surplus/:surplusId/claims` with body `{ "servingsClaimed": number }`.
- **Claims (legacy-compatible):** `POST /api/v1/claims/:surplusId` may still exist on some deployments.
- Claims: `GET /api/v1/claims/me`, confirm/release on claim id under `/api/v1/claims/...`.
- Donations: `POST /api/v1/donations`, `GET /api/v1/donations/:id`.
- Impact: `GET /api/v1/impact/me`.
- Ratings: `POST /api/v1/ratings`.

### Remote menu item create (current app contract)

- **Route:** `POST /api/v1/tailgates/:tailgateId/menu`
- **Current app body:**

```json
{
  "tailgateId": "string",
  "name": "string",
  "category": "entree | side | drink | dessert",
  "description": "string",
  "quantityPrepared": 1
}
```

- Backend currently validates `tailgateId` in the body even though the path also owns it.

### Remote surplus publish (current app contract)

- **Route:** `POST /api/v1/surplus`
- **Current app body (remote mode):**

```json
{
  "tailgateId": "string",
  "foodName": "string",
  "groupName": "string",
  "location": "string",
  "servingsRemaining": 1,
  "pickupNote": "string",
  "foodItemId": "string, optional",
  "expiresAt": "ISO string availability deadline",
  "pickupWindowMinutes": 30
}
```

- Intended durable backend contract should ideally derive display fields from `tailgateId` and `foodItemId`.
- Current deployed backend requires `foodName`, `groupName`, and `location`, so the app sends them as a compatibility shim.
- `expiresAt` is the listing availability deadline (when the surplus is no longer claimable).
- `pickupWindowMinutes` is the reservation hold duration after someone claims.
- The app still omits unnecessary write fields in remote publish payloads (`id`, `claimId`, `status`, `minutesLeft`, `imageKey`).

### Surplus and claim timing semantics

- `Surplus.expiresAt` = **listing availability deadline** (`Available until` in UI).
- `Surplus.pickupWindowMinutes` = **host-selected reservation hold duration** after a claim (`Pickup window` in UI).
- `Claim.expiresAt` = **actual pickup deadline for that claim** (`Pickup deadline` in UI and pickup timer source).
- Backend timing rule should be:

```text
claim.expiresAt = min(now + surplus.pickupWindowMinutes, surplus.expiresAt)
```

- Frontend pickup timer uses `claim.expiresAt` only and does not invent countdowns from surplus availability deadlines.

### Remote surplus patch (current app contract)

- **Route:** `PATCH /api/v1/surplus/:id`
- **Current app body:** only defined whitelisted fields:

```json
{
  "servingsRemaining": 1,
  "pickupNote": "string",
  "status": "available | almost_gone | claimed | expired | donated",
  "expiresAt": "ISO string"
}
```

- `closeSurplus` sends `{ "status": "expired", "servingsRemaining": 0 }`.

### Claim flow ids and routes

- **Create claim route:** `POST /api/v1/surplus/:surplusId/claims`
- **Create claim body:**

```json
{ "servingsClaimed": 1 }
```

- In remote mode, claim create intentionally strips `surplusId` from body because `surplusId` is path-owned.
- In mock mode, request input may still include optional `surplusId` for validation parity.
- `ClaimRecord.id` is the backend claim record id used by confirm/release requests.
- `claimId` is a public/display code when provided.
- Confirm/release routes use `/claims/:id/...`, where `id` is `ClaimRecord.id`.

## Error payloads (FastAPI-style)

Backend errors may use a nested **`detail`** object:

```json
{
  "detail": {
    "message": "Human readable message",
    "code": "MACHINE_READABLE_CODE",
    "fieldErrors": {
      "fieldName": "Optional per-field hint"
    }
  }
}
```

The app parses `detail.message`, `detail.code`, and `detail.fieldErrors` / `detail.field_errors` in addition to flatter shapes (`message`, `code`, `fieldErrors`).

## Response wrapper pattern

The mobile client normalizes remote errors via `normalizeRemoteError` / `messageFromUnknownError` (see `src/api/response.ts`, `src/utils/errorMessage.ts`). Success bodies often wrap entities in `{ "data": ... }`.

## Remote response mapper tolerance

- The app accepts both **camelCase** and **snake_case** on core entities (tailgates, menu items, surplus, claims).
- Mapper fallbacks keep UI stable when optional display fields are absent:
  - tailgate/group/location text defaults to safe copy,
  - surplus display fields fall back to generic labels and pickup note defaults,
  - `minutesLeft` can derive from `expiresAt` when explicit minutes are missing.
- Menu create currently sends `tailgateId` in both **path and body** for backend compatibility.
- Remote surplus publish remains minimal (see section above).
- Backend claim record **`id`** is still required; confirm/release use that id (not public `claimId`).

### Mapper smoke checklist (manual)

Use `/dev-api` in remote mode and confirm UI remains readable when responses are sparse:

1. Fetch tailgates and open a tailgate detail card.
2. Fetch surplus and ensure unnamed/missing display fields still render safe fallback copy.
3. Post a test menu item (`POST /tailgates/:id/menu`) and verify it appears in host edit/manage flows.
4. Post a claim, then confirm/release using the backend claim record id.

## Paginated responses

List endpoints (e.g. tailgates, surplus, donation centers) use **`PaginatedResponse<T>`** in the app (`data`, pagination meta). Confirm field names against FastAPI responses and adjust mappers in later batches if needed.

## Recently confirmed via Postman

- **`GET /api/v1/games/current`** returns a clean wrapped payload `{ "data": { "id", "opponent", "matchup", "gameDate", "kickoffTime", "location", "weather", "phase", ... } }`.
- **`weather`** may return ASCII-safe descriptive text, e.g. `58 F, clear, light breeze from the lake`.

## Known quirks

- **`/health`** is at the **host root**, not `/api/v1/health`.
- Public GETs work **without** auth; protected routes require **Bearer** token.

For day-to-day debugging, open **`/dev-api`** in the Expo app (manual navigation) to hit health and sample endpoints.

### Manual auth smoke test (mobile)

1. Start the app in **remote** mode (`npm run start:remote` or equivalent env).
2. Open **`/dev-api`** before logging in; exercise **public** reads (e.g. current game, tailgates list) and confirm **`GET /auth/me`** returns **401** (or fails as expected) without a token.
3. **Register** a **student** account → after success, navigation should land on **`/discover`** (or a safe `redirectTo` if you passed one).
4. **Log out** → tokens cleared from storage and Redux.
5. **Log in** → lands on role default (**`/dashboard`** for host/admin, **`/discover`** for student) or a safe allowlisted **`redirectTo`**.
6. **Restart the app** → **`AuthBootstrap`** should restore tokens from secure storage and **`GET /auth/me`** should hydrate the session.
7. **Register** a **host** account → after success, navigation should land on **`/dashboard`** (or allowlisted redirect).

### Remote MVP golden path checklist

1. Logged-out user can open Student/Fan public screens (`/discover`, `/surplus`, `/impact`) and read public data.
2. Register/login/logout works and redirects safely; app restart restores session via `/auth/me` when tokens are valid.
3. Host can create a tailgate, add menu items, publish surplus, and see updates on host dashboard/manage screens.
4. Student can claim surplus (`POST /surplus/:surplusId/claims`), then confirm/release with backend claim record id.
5. Host donation logging works: prepared food requires eligible surplus; packaged/produce categories can log without surplus.
6. Impact/profile/dashboard cards refresh after writes (claims, donations, tailgate/surplus/menu changes) via tag invalidation.
