# spweather

Simple Angular app that fetches and displays forecasts from https://api.weather.gov.

Setup

```bash
# install deps
npm install

# run dev server
npm start

# spweather

Simple Angular app that fetches and displays forecasts and current conditions from api.weather.gov using a ZIP code.

Quick start

```bash
# install dependencies
npm install

# start the dev server (uses the dev proxy)
npm start

# open http://localhost:4200
```

Dev helper scripts

- Start services (background): `npm run services:start`
- Stop services: `npm run services:stop`
- Restart services: `npm run services:restart`
- Status: `npm run services:status`

Notes about the API and headers

- Browsers forbid setting the `User-Agent` header from client-side JavaScript. The app does not set `User-Agent` in the browser. To comply with api.weather.gov's request for a contact `User-Agent`, run a small server-side proxy or configure your reverse proxy to add that header when forwarding requests.
- The project includes a dev proxy (`proxy.conf.json`) which maps `/api` to `https://api.weather.gov`; this helps avoid CORS during development. The proxy alone cannot add `User-Agent` when running in the browser — use a server-side proxy to inject headers.

Dev proxy

The development proxy is `proxy.conf.json`. It forwards `/api` to `https://api.weather.gov` so the app can call `/api/points/{lat},{lon}` and related endpoints in development.

Example: test the proxied endpoint locally

```bash
curl -i http://localhost:4200/api/points/37.7725,-122.4147
```

If you need the server to add a `User-Agent` header, create a small Express proxy that sets the header and forwards to api.weather.gov, or use your preferred reverse proxy.

Project structure highlights

- `src/app/weather.service.ts` — encapsulates API calls and caching
- `src/app/zip-input/zip-input.component.ts` — ZIP input and validation
- `src/app/app.simple.html` & `src/styles.scss` — ZIP-first UI and theming
- `proxy.conf.json` — dev proxy to `https://api.weather.gov`
- `scripts/manage-services.sh` — start/stop/restart helper for local dev services

Build

```bash
npm run build
```

Tests

```bash
npm test
```

Contributing

Feel free to open a PR. Suggested next steps: add more unit tests, improve forecast presentation, or add a C/F toggle.
