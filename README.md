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

Expo reads these when the dev server starts. After changing env vars, restart with `--clear` so Metro picks them up.

**Health vs API routes:** `GET /health` lives at the **API host root**. Application REST calls use **`/api/v1`**.

### API URLs

| Environment | Host root | API base (`/api/v1`) | Health |
|-------------|-----------|----------------------|--------|
| Local dev | `http://localhost:3000` | `http://localhost:3000/api/v1` | `http://localhost:3000/health` |
| EC2 direct HTTP dev API | `http://ec2-3-219-93-142.compute-1.amazonaws.com:3000` | `http://ec2-3-219-93-142.compute-1.amazonaws.com:3000/api/v1` | `http://ec2-3-219-93-142.compute-1.amazonaws.com:3000/health` |
| Temporary HTTPS API via Cloudflare tunnel | `https://ministries-generic-inputs-spotlight.trycloudflare.com` | `https://ministries-generic-inputs-spotlight.trycloudflare.com/api/v1` | `https://ministries-generic-inputs-spotlight.trycloudflare.com/health` |

**Important:** the GitHub Pages frontend must use the HTTPS API URL. Browsers block secure pages from calling insecure HTTP APIs as mixed content.

**Cloudflare tunnel note:** the temporary HTTPS URL can rotate when the tunnel restarts. If it changes, update `EXPO_PUBLIC_API_BASE_URL`, rebuild, and redeploy the web app.

### Quick start scripts

| Script | Purpose |
|--------|---------|
| `npm run start:mock` | Mock data (`EXPO_PUBLIC_API_MODE=mock`) + clear Metro cache |
| `npm run start:remote` | Remote HTTPS backend (`EXPO_PUBLIC_API_MODE=remote` + Cloudflare tunnel `EXPO_PUBLIC_API_BASE_URL`) + clear cache |
| `npm run build:web:prod` | Build static web export against the HTTPS API |
| `npm run deploy:web` | Build and deploy the web app to GitHub Pages |

### Run in mock mode

No env vars required. Optional explicit config:

```bash
EXPO_PUBLIC_API_MODE=mock npx expo start --clear
```

Or use:

```bash
npm run start:mock
```

Run in remote mode against local backend

Point the app at your machine or LAN URL. The device or simulator must be able to reach the host.

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 npx expo start --clear
```

For a physical device, use your LAN IP, for example:

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000/api/v1 npx expo start --clear
```

Run in remote mode against EC2 HTTP

Use this for local development only. Do not use this for the deployed GitHub Pages app.

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=http://ec2-3-219-93-142.compute-1.amazonaws.com:3000/api/v1 npx expo start --clear
```

Run in remote mode against HTTPS

Use this for deployed web builds and browser testing.

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=https://ministries-generic-inputs-spotlight.trycloudflare.com/api/v1 npx expo start --clear
```

Or use:

```bash
npm run start:remote
```

Build web against HTTPS

```bash
EXPO_PUBLIC_API_MODE=remote EXPO_PUBLIC_API_BASE_URL=https://ministries-generic-inputs-spotlight.trycloudflare.com/api/v1 npx expo export --platform web --clear
```

Or use:

npm run build:web:prod

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
