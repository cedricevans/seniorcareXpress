# Railway Operations — Directives

This file exists because the same handful of mistakes have been made repeatedly across
this project's deploy history (20+ "fix: railway/pocketbase/deploy" commits — see
`git log --oneline | grep -iE "railway|pocketbase|deploy|healthcheck|migration|superuser|volume"`).
Read this before touching anything Railway- or PocketBase-related. When something breaks
in production, check the "Known failure modes" table below before forming a new theory —
it has almost certainly happened before.

Companion doc: `INCIDENT_2026-06-16_PRODUCTION_DB_RESET.md` covers the worst instance of
this (a full production data wipe) in narrative detail. This file is the standing
reference; that one is the case study.

---

## 1. The three services, verified as of 2026-07-31

Project: `proactive-acceptance` (Railway project ID `6ff17bb3-c893-4360-a12c-20edd4cd2fe1`,
environment `production`, ID `a19a11b8-49a1-40da-bf88-25e777eeeef8`).

| Service | Railway name | Root dir | Public URL | Builder |
|---|---|---|---|---|
| PocketBase | `pocketbase` | `apps/pocketbase` | `pocketbase-production-489c.up.railway.app` | Dockerfile |
| API (Express) | `api-qvX_` | `apps/api` | `api-qvx-production.up.railway.app` | Nixpacks |
| Web (Vite/React) | `web-7xPJ` | `apps/web` | `www.seniorcare-xpress.com` (custom domain; Railway default is `web-7xpj-production.up.railway.app`) | Nixpacks |

**Do not trust these names/IDs blindly forever** — re-verify with `railway status --json`
before relying on them if it's been a while, since services can be renamed/recreated.
Run `railway status --json` and `railway variables --service <name> --json` from the
**repo root**, not from inside an `apps/*` subdirectory — the CLI's project link context
did not resolve correctly when run from `apps/pocketbase` in this session even though it
worked fine from root.

## 2. The #1 recurring bug class: PORT / targetPort mismatch

**This has caused a full production 502 outage at least once (2026-07-30) and is the
single most likely thing to break again.**

- Railway injects a dynamic `PORT` env var at runtime for services that don't explicitly
  set one. A service's public domain has its own separate `targetPort` config, set
  independently in the Railway dashboard/API when the domain was created.
- If a service's `PORT` variable is ever manually/explicitly set to a fixed value (e.g.
  `PORT=3001`), it **overrides** Railway's dynamic injection — and if that fixed value
  doesn't match the domain's `targetPort`, every request hits "connection refused" at
  Railway's edge, while the container's own logs show a perfectly clean boot with no
  errors. This makes it look like a platform issue when it is entirely a config
  mismatch.
- **Confirmed current state (verified 2026-07-31):** `api-qvX_` has **no `PORT` variable
  set** — this is correct and must stay this way. Its domain `targetPort` is `8080`.
  `apps/api/src/main.js` falls back to `3001` only when `PORT` is unset, which only
  matters for local dev; in production Railway's injected `PORT` (matching `targetPort:
  8080`) takes over.
- `pocketbase`'s domain `targetPort` is `8090`, and `apps/pocketbase/entrypoint.sh`
  correctly reads `${PORT:-8090}` — also correct, verified working.

**Directive: never set a `PORT` env var on `api-qvX_` manually.** If you ever need to
change the listening port, change the domain's `targetPort` via Railway, not an app-level
env var override. Before assuming a 502/"connection refused" is Railway's fault, check
`railway variables --service <name> --json` for an unexpected `PORT` override first —
this single check would have saved an entire troubleshooting session.

## 3. PocketBase persistence — never let this regress

- PocketBase MUST have a real, attached persistent volume mounted at `/app/pb_data`.
  Without one, every container restart runs against a fresh empty SQLite database and
  **all production data is silently lost** — this already happened once, in full, on
  2026-06-16 (see the incident doc).
- Verify a volume actually exists and is attached before any PocketBase-service change:
  `railway volume list`, or check `RAILWAY_VOLUME_ID` / `RAILWAY_VOLUME_MOUNT_PATH` /
  `RAILWAY_VOLUME_NAME` in `railway variables --service pocketbase --json`. As of
  2026-07-31 these are set (`RAILWAY_VOLUME_MOUNT_PATH=/app/pb_data`,
  `RAILWAY_VOLUME_NAME=pocketbase-volume`) — confirm this is still true before trusting it.
- **Known drift, not yet reconciled:** `apps/pocketbase/railway.toml` declares
  `[[deploy.volumes]] name = "pocketbase-data"`, but the actually-attached volume's real
  name (per live Railway vars) is `pocketbase-volume`. The repo file does not match
  reality. Config-as-code here is aspirational, not authoritative — always check the live
  Railway state, never assume the `railway.toml` reflects what's actually attached.
- `apps/pocketbase/Dockerfile` and `.gitkeep`-in-`pb_migrations/` are both deliberately
  structured so `pb_data` never ships inside the built image — production data lives only
  on the mounted volume. Do not "fix" a build by copying `pb_data` into the image; that
  defeats the entire point and was an actual past mistake (`04b1e90`, later reverted).

## 4. Schema changes: `pb_migrations/` is **not trusted** — use `setup.js` directly

- This repo's migration-file chain (`pb_migrations/*.js`) diverged from production reality
  at least once and caused the 2026-06-16 incident: stale `updated_*`/`created_*` files
  called `findCollectionByNameOrId()` against schema states that no longer matched
  production, crashed PocketBase's automigrate step on every single boot, and that
  crash — not the missing volume — is what made every deploy fail its healthcheck.
- **Directive: all schema changes go through `apps/pocketbase/setup.js` run directly
  against the target PocketBase, never through new migration files.** `setup.js` is
  idempotent (`createOrUpdateCollection`) and is the actual source of truth for schema.
  ```
  PB_URL="https://pocketbase-production-489c.up.railway.app" \
  PB_SUPERUSER_EMAIL="admin@seniorcare.com" \
  PB_SUPERUSER_PASSWORD="<value from railway variables --service pocketbase --json>" \
  node apps/pocketbase/setup.js
  ```
- **After every `setup.js` run (local or production), immediately delete any
  auto-generated files in `pb_migrations/`:** `rm -f apps/pocketbase/pb_migrations/*.js`,
  confirm only `.gitkeep` remains, and never commit generated migration files. PocketBase
  auto-generates these on schema changes even when you didn't ask it to, and letting them
  accumulate is exactly what caused the original incident. Check `git status` on that
  directory before every commit that touched schema.
- `pb_migrations/.gitkeep` must always exist even when the directory has no `.js` files —
  git does not track empty directories, and the Dockerfile's `COPY pb_migrations
  ./pb_migrations` step fails the build entirely if the directory doesn't exist in the
  repo. Do not delete `.gitkeep`.

## 5. Schema changes on a live server can leave the API service in a stale state

**New failure mode, found and fixed 2026-07-30 — not yet in general Railway knowledge,
specific to this project's setup.**

**Update 2026-08-01:** `apps/api/src/utils/pocketbaseClient.js` no longer authenticates
only once at boot — it now re-authenticates the superuser session every 15 minutes in the
background (`REAUTH_INTERVAL_MS`), plus `apps/api/src/main.js` runs an `ensureAuthenticated()`
check before every request as a backstop that re-auths on the spot if the token is ever
found invalid. This was deployed specifically because a *second*, independent cause of the
same `ClientResponseError 404` symptom was found and confirmed on 2026-08-01: the superuser
token expiring from age alone (~24h+ uptime, no `setup.js` involved) — see the git history /
session notes for `fix: auto-refresh PocketBase superuser session to prevent stale-token
404s` (commit `2512782`) for the full diagnosis. The directive below (redeploy after
`setup.js`) **still applies** — the stale-connection-after-schema-change failure mode this
section describes is a separate trigger from token expiry, and the auto-refresh does not
eliminate the need to restart after a live schema change, though it should make token-expiry
alone no longer a source of `/fill`-type failures going forward.

- `apps/api`'s PocketBase client (`apps/api/src/utils/pocketbaseClient.js`) authenticated
  **once at process boot** and held that connection for the service's entire lifetime. (As
  of 2026-08-01, it now also self-refreshes — see the update note above — but the
  stale-after-`setup.js` mechanism described next is independent of that and still applies.)
- Running `setup.js` against production PocketBase while `api-qvX_` is already running and
  serving traffic can leave that already-running process's connection in a state where
  subsequent requests touching the changed collection fail with a `ClientResponseError
  404` (`"The requested resource wasn't found"`) — even though the exact same query
  succeeds instantly from a brand-new connection with identical credentials, and even
  though `getOne`/`expand` work perfectly via direct `curl` against the same record.
- This is NOT: a credentials issue, an API-rule/permissions issue, a token-expiry issue
  (production tokens are 24h), or a race condition (failures reproduced 100% of the time,
  30+ seconds apart, not concurrent). All of those were checked and ruled out via
  read-only requests before concluding this. (Token expiry *was* later confirmed as a
  separate real cause of the same symptom over longer uptimes — see the update note above —
  this bullet's original 2026-07-30 investigation was correct for the specific case it
  tested, just not exhaustive of every way a stale connection can happen.)
- **Directive: after running `setup.js` against production, always redeploy/restart
  `api-qvX_` immediately afterward**, even if nothing in `apps/api` itself changed:
  ```
  railway redeploy --service api-qvX_ -y
  ```
  Then verify: `curl https://api-qvx-production.up.railway.app/health` returns 200, and
  `railway logs --service api-qvX_` shows a fresh `"Superuser auth successful"` line
  timestamped after the restart.

## 6. Deploy verification sequence (follow every time, don't skip steps)

1. `git push origin main` — triggers all three services' auto-deploy simultaneously.
2. Poll `railway status --json` from repo root; check each service's
   `latestDeployment.status` for `SUCCESS` on the pushed commit hash. Deploys go
   `QUEUED` → `BUILDING`/`DEPLOYING` → `SUCCESS`. `QUEUED` can sit for several minutes
   under normal conditions — this is slow but not necessarily stuck; only escalate to the
   user if it's queued far longer than usual (multiple checks, several minutes apart,
   with no progress).
3. If the change touched PocketBase schema: run `setup.js` against production (§4), clean
   up `pb_migrations/*.js` (§4), **then restart `api-qvX_`** (§5) even if `apps/api`
   itself wasn't touched.
4. `curl -o /dev/null -w "%{http_code}\n" <url>/health` (or equivalent) for every service
   that changed. A 200 on `/health` only proves the container booted — it does NOT prove
   the actual feature works.
5. For anything that touches a real user-facing flow (form fill, PDF generation, CRUD),
   exercise the actual endpoint/page and look at the real output — a filled PDF, a
   rendered page, a real API response body — not just a status code. Screenshot UI
   changes; for PDFs, actually open/rasterize and view them (Poppler's `pdftoppm` has
   produced false "blank page" results in this project before — cross-check with
   `pdftotext` or a real renderer like macOS `qlmanage`/Preview before concluding a PDF is
   broken).
6. Only report "deployed" after steps 2–5 are done. "Pushed" and "deployed and verified"
   are different claims — don't conflate them.

## 7. Client-side SPA routing note (not a Railway issue, but easy to misread as one)

`apps/web` is a client-rendered React SPA with a catch-all `<Route path="*">` that renders
a 404 page. Because routing happens in JS after the page loads, **every path returns
HTTP 200 from the server**, including genuinely removed/nonexistent routes — the server
doesn't know about React Router's routes, only the client does. A `curl -o /dev/null -w
"%{http_code}"` check against a removed page will show `200`, not `404`. This is expected
and correct, not a bug. To actually verify a route is gone, load it in a real (or
Playwright-driven) browser and read the rendered content, not the HTTP status.

## 8. Known failure modes — check this table before forming a new theory

| Symptom | Actual cause (checked first) | How to confirm |
|---|---|---|
| 502 "Application failed to respond", clean container logs | `PORT` env var override mismatched with domain `targetPort` | `railway variables --service <name> --json`, check for unexpected `PORT` |
| All production data gone after a deploy | No persistent volume attached, or wrong mount path | `railway volume list`, check `RAILWAY_VOLUME_MOUNT_PATH` |
| PocketBase fails every healthcheck, never comes up | Stale/conflicting `pb_migrations/*.js` crashing automigrate | `railway logs --service pocketbase`, look for migration errors before the HTTP port ever opens |
| Docker build fails on `COPY pb_migrations` | `pb_migrations/.gitkeep` was deleted along with the last `.js` file | `git status` / `ls apps/pocketbase/pb_migrations/` |
| API 500s on a specific collection right after a schema change, but the same query works via direct curl | Stale connection in the already-running API process | Restart `api-qvX_` (§5) |
| `/va-forms/:id/fill` (or any PocketBase-backed route) 500s with `"The requested resource wasn't found"` after the API has been up 24h+, unrelated to any recent `setup.js` run | Superuser token expired and was never refreshed — fixed 2026-08-01 (commit `2512782`), client now self-refreshes every 15min + on-demand (§5 update). If this recurs post-fix, check `railway logs --service api-qvX_` for `"Superuser re-auth failed"` — the refresh itself may be erroring | `railway logs --service api-qvX_ \| grep -i "re-auth\|superuser"` |
| Admin dashboard/list query 400s with "Something went wrong" | `sort=-created` (or `-updated`) on a collection that has no `created`/`updated` autodate fields | Check the collection's fields via `railway variables`-authenticated `GET /api/collections/<name>`; several collections in this project (`care_updates`, `va_cases` before a later fix) lack these fields |
| A route that should be gone still "returns 200" | Expected SPA behavior, not a bug (§7) | Load it in a real browser, read the rendered content |
| Office notification email missing fields that are clearly present in the DB record | For **JSON-type fields only**, `record.get("jsonField")` in a `pb_hooks/*.pb.js` hook returns a raw byte array in the PocketBase JS VM, not a parsed object. Plain text/email/etc. fields via `record.get(...)` are unaffected. | Use `JSON.parse(record.getString("jsonField"))` for JSON fields specifically |

## 9. Credentials in this project (locations, not values)

- PocketBase superuser (`_superusers` collection, used for admin API access, `setup.js`,
  and by `apps/api`'s backend client): `PB_SUPERUSER_EMAIL` / `PB_SUPERUSER_PASSWORD` on
  the `pocketbase` Railway service. Same values are duplicated onto `api-qvX_`'s variables
  for its own backend PocketBase client.
- App-level admin login (the `users` collection record used to actually log into
  `www.seniorcare-xpress.com/admin`, role `admin`) is a **separate account with a
  separate password** from the PocketBase superuser above. It was reset to a temporary
  password during the 2026-06-16 recovery (`TempPass123!`, meant to be changed by each
  user) — its current value is not necessarily known and should not be assumed to match
  the PocketBase superuser password. Do not conflate the two when troubleshooting login
  issues.
- Several local scripts (`apps/pocketbase/scan-db.mjs`, `check-superuser.mjs`,
  `reset-passwords.mjs`, `upsert-users.mjs`, `setup.js`) have a hardcoded fallback
  superuser password in source as a default. This is a standing risk (flagged, not yet
  remediated as of 2026-07-31) — treat any of these files' default password as
  potentially stale/wrong and always pass the real one via env var explicitly.

---

**Maintenance:** when a new Railway/PocketBase deploy failure happens that isn't covered
by §8's table, add it here with the same shape (symptom → actual cause → how to confirm)
once root-caused — don't let it live only in a chat transcript.
