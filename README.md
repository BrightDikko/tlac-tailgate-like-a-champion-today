# TLAC (Expo + React Native)

Tailgate and surplus pickup flows for hosts and Student/Fan users.

## Install dependencies

After cloning or when `package.json` changes (for example adding `expo-secure-store`):

```bash
npm install
```

## API mode and base URL

The app reads Expo public env vars at build time:

| Variable | Values | Default |
|----------|--------|---------|
| `EXPO_PUBLIC_API_MODE` | `mock` or `remote` | `mock` if unset or invalid |
| `EXPO_PUBLIC_API_BASE_URL` | Full base URL for the REST API | `http://localhost:3000/api/v1` if unset |

Expo reads these when the dev server starts. After changing env vars, restart with `--clear` (see npm scripts below) so Metro picks them up.

**Health vs API routes:** `GET /health` lives at the **API host root** (e.g. `http://host:3000/health`). Application REST calls use **`/api/v1`** (e.g. `http://host:3000/api/v1/tailgates`).

### Quick start scripts

| Script | Purpose |
|--------|---------|
| `npm run start:mock` | Mock data (`EXPO_PUBLIC_API_MODE=mock`) + clear Metro cache |
| `npm run start:remote` | Remote EC2 backend (`EXPO_PUBLIC_API_MODE=remote` + EC2 `EXPO_PUBLIC_API_BASE_URL`) + clear cache |

### Run in mock mode (default)

No env vars required. Optional explicit config:

```bash
EXPO_PUBLIC_API_MODE=mock npx expo start
```

Or use:

```bash
npm run start:mock
```

### Run in remote mode against a local backend

Point the app at your machine or LAN URL (device/simulator must reach the host):

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 npx expo start
```

Use your LAN IP from a physical device, for example:

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000/api/v1 npx expo start
```

### Run in remote mode against a deployed backend

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=https://api.example.com/api/v1 npx expo start
```

Remote mode expects a Bearer access token on authenticated requests, `POST /auth/refresh` with `{ "refreshToken": "..." }` on 401, and `GET /auth/me` for the current user after tokens are restored from secure storage on launch.

**Auth gating:** Student/Fan browsing stays public in remote mode; host workflows and user-specific endpoints (`/auth/me`, `/claims/me`, `/impact/me`, claims, etc.) require sign-in. Details: see **`docs/api-contract.md`** (“Auth gating policy”).

## Start the app

```bash
npx expo start
```

Then open in iOS Simulator, Android emulator, or Expo Go as usual.

## Scripts

- `npm run start` — Expo dev server  
- `npm run ios` / `npm run android` / `npm run web` — platform shortcuts  
- `npm run lint` — ESLint via Expo  

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
