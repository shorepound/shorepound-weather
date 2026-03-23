# Shorepound Weather

A simple weather app built with curiosity and a love for both meteorology and clean code.

We combine official forecasts from api.weather.gov with real-time buoy and tide observations so you can quickly see conditions near any U.S. ZIP code. This project exists because weather is fascinating and technology makes it possible to bring timely, useful info to anyone with an internet connection.

Key features

- ZIP-based forecast and current-conditions lookup (api.weather.gov)
- Nearby NDBC buoy observations (waves, wind, water temp)
- NOAA CO-OPS support for tide/water-level and water-temperature stations

Quick start

```bash
# install dependencies
npm install

# start dev server (uses proxy.conf.json to forward /api and /ndbc)
npm start

# open http://localhost:4200
```

Deployment

- The production build lives in `dist/spweather-app/browser/`.
- Static files can be uploaded to your web host (example: `/home/spweather/weather.shorepound.net/`).
- The repository includes PHP proxy endpoints (`proxy/php/`) used in production to add a `User-Agent` and avoid CORS.

Developer notes

- Browsers cannot set the `User-Agent` header from client-side JavaScript. To comply with api.weather.gov guidance, run the app behind a server-side proxy that sets a contact `User-Agent` (the PHP proxy in `proxy/php/` is one option).
- The dev proxy (`proxy.conf.json`) forwards `/api` to `https://api.weather.gov` and `/ndbc` to NDBC feeds to ease local development.

Project layout highlights

- `src/app/weather.service.ts` — forecast/current weather lookups and caching
- `src/app/ndbc.service.ts` — NDBC station parsing and realtime2 text parsing
- `src/app/coops.service.ts` — CO-OPS datagetter integration (water level, temp)
- `src/app/app.simple.html` & `src/styles.scss` — main UI and theming
- `proxy/ndbc/` and `proxy/php/` — production proxy endpoints

Build & test

```bash
npm run build
npm test
```

Contributing

Contributions, bug reports, and PRs are welcome — whether it's UX polish, improved parsing, or more station sources. If you like the project, star the repo and tell a friend who cares about waves.

Contact

If you run this in production, please set a contact `User-Agent` header for upstream APIs (we use shorepound01@gmail.com for this project). Feel free to open issues or PRs on GitHub.

---
Built with love and curiosity — Shorepound
