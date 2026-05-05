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

### Run in mock mode (default)

No env vars required. Optional explicit config:

```bash
EXPO_PUBLIC_API_MODE=mock npx expo start
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
