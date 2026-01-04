# Replit → Railway: Vite Import Leak Causing Production Crash

## Symptoms
- Error: `Cannot find package 'vite' imported from /app/dist/index.js`
- Appears immediately when the Railway container tries to start the Node server

## Root Cause
- The server build step bundles `server/index.ts` via `esbuild --bundle`, producing `dist/index.js`
- `server/index.ts` statically imports `server/vite.ts`
- `server/vite.ts` previously had top-level imports from `vite` and Vite plugins
- Production Docker image installs only production dependencies (`npm ci --omit=dev`), so `vite` is absent
- Node evaluates static imports during module load, even if the dev-only code never runs, so the bundle crashes before serving requests

## Why Replit-to-Production Exposes This
- Replit installs all dependencies (dev + prod) and runs the server in development mode, masking the issue
- Railway (and other production hosts) install only production dependencies inside the container
- When migrating, any dev-only module imported at the top level will break the production bundle because the dependency is missing

## Fix (Permanent)
- Remove every top-level `vite` / plugin import from `server/vite.ts`
- Load `vite` dynamically inside `setupVite()` using `await import()` so production never evaluates those imports
- Inline the dev-only Vite config inside `setupVite()` to avoid importing `vite.config.ts` at module scope

## Verification Steps
1. `npm run build`
2. `node dist/index.js` (no `vite` missing error)
3. `docker build -t homestagepro .`
4. `docker run -p 3000:3000 homestagepro` (using `npm ci --omit=dev` in the image) — server should bind to `0.0.0.0` and respond over HTTP

## Migration Checklist for Other Replit Apps
1. Server listens on `0.0.0.0` and respects `process.env.PORT`
2. No dev-time tooling (Vite, Vitest, Storybook, etc.) is imported statically in the production server bundle
3. Container install uses `npm ci --omit=dev` (or equivalent) and succeeds
4. Run `node dist/index.js` (or `npm start`) in a prod-like environment before deploying
5. Use Cloudflare for DNS if apex custom domains need CNAME flattening on Railway
