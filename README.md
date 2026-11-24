# NS Running Results

Nova Scotia road & trail race results dashboard built with **React (Vite)** + **PocketBase**, combining:
- **Atlantic Chip** (`atlanticchip.ca`, 2004–2026) — queried directly from the browser with a 24-hour `localStorage` cache
- **Route541** (`route541.com`, 2023–2026) — 7,282+ finishes stored & indexed in PocketBase SQLite

Live target domain: **https://ns-running-results.opensrc.mx**

## Local Development

```bash
npm install
npm run pb   # starts PocketBase on http://127.0.0.1:8090
npm run dev  # starts Vite React app on http://localhost:5173
```

## Production Deployment (FeatherCI → `opensrc.mx`)

Pushing to `main` triggers [`.featherci/workflow.yml`](.featherci/workflow.yml):
1. Installs dependencies and verifies the React production build (`npm ci && npm run build`).
2. Syncs the repository to `opensrc.mx` and runs `docker compose up -d --build`.
3. PocketBase serves both `/api/*` and the compiled React app (`pb_public/`) on port `8090`, auto-migrating collections and auto-importing `data/route541_all/` on first boot.

### Required FeatherCI Secrets
- `DEPLOY_SSH_KEY` — SSH private key with access to `zodman@opensrc.mx`
- `DEPLOY_HOST` *(optional, defaults to `opensrc.mx`)*
- `DEPLOY_USER` *(optional, defaults to `zodman`)*
- `DEPLOY_PORT` *(optional, defaults to `22`)*
- `DEPLOY_PATH` *(optional, defaults to `/home/zodman/apps/ns-running-results`)*

### Reverse Proxy (`ns-running-results.opensrc.mx`)
- **Traefik:** labels are already included in `docker-compose.yml`.
- **Caddy:**
  ```caddy
  ns-running-results.opensrc.mx {
      reverse_proxy 127.0.0.1:8090
  }
  ```

---

👟 Coded at a 4:30/km pace by [Andres Vargas](https://www.strava.com/athletes/zodman)
