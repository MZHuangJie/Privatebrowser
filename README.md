# SafeView

Privacy-first desktop browser built with Electron + React + TypeScript.

## Features

- Tracker & ad blocking (EasyList rules)
- Per-tab data isolation (separate Chromium partitions)
- Automatic data cleanup on tab close and browser exit
- Encrypted local storage (OS keychain or PBKDF2 fallback)
- Fingerprint protection (canvas, WebGL, WebRTC)
- HTTPS automatic upgrade
- Dark/Light/System theme support
- Multiple search engines (Google, DuckDuckGo, Bing, Baidu, SearXNG)

## Development

```bash
npm install
npm run dev     # Starts Vite + tsc watch
npm start       # Launch Electron (in another terminal after dev builds)
```

## Build

```bash
npm run build
npm run dist
```
