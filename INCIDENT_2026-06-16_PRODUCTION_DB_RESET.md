# Incident: production PocketBase data wiped (2026-06-16)

## Summary

Production PocketBase (`pocketbase-production-489c.up.railway.app`) had **no persistent
volume attached**, despite `apps/pocketbase/railway.toml` declaring one. Every container
restart ran against a fresh, empty SQLite database. Multiple restarts during a deploy
troubleshooting session wiped all users, patients, appointments, and other records.
Data was rebuilt from the local dev database; structure and demo records were restored,
but anything created in production only (not present locally) was not recoverable.

## Root causes (three separate, unrelated bugs found in sequence)

1. **No persistent volume actually existed.** `railway.toml` had a `[[deploy.volumes]]`
   block, but no volume had ever been created/attached on Railway's side for this
   service. Confirmed via the Railway GraphQL API: `project { volumes { edges } }`
   returned an empty list. Config alone does not create the resource — it has to exist
   and be attached for the mount to do anything.

2. **Stale `updated_*` and `created_*` migration files crashed every boot.** All 12
   `1774194444_updated_*.js` files called `findCollectionByNameOrId()` and then tried to
   apply rule changes that had already been made directly against production at some
   earlier point (outside the migration system). Production's tracked `_migrations`
   table never recorded them as applied, so PocketBase retried them on every single
   boot and they failed with `sql: no rows in result set` (or, for `created_*` files,
   "already exists" / "relation collection doesn't exist" depending on what had drifted).
   This crashed `pocketbase serve`'s automigrate step before the HTTP port ever opened,
   which is what made every deploy fail Railway's healthcheck.

3. **Deleting all migration files broke the Docker build itself.** Git does not track
   empty directories. Once every file inside `pb_migrations/` was removed, the directory
   stopped existing in the repo, and `COPY pb_migrations ./pb_migrations` in the
   Dockerfile failed with "not found" — a build failure, not a runtime error. Fixed by
   adding `apps/pocketbase/pb_migrations/.gitkeep`.

## What actually fixed it

- Removed all stale `pb_migrations/*.js` files (verified each target collection already
  existed on production with matching rules before deleting — confirmed via direct API
  reads, not assumption).
- Added `.gitkeep` so the now-empty `pb_migrations/` directory still exists in git.
- Simplified `apps/pocketbase/entrypoint.sh` back to a plain sequential script (no
  backgrounding, no wget polling loop) after an earlier "optimize startup" attempt
  produced no usable log output for its own steps on Railway.
- **Created a real persistent volume** via the Railway API (`volumeCreate` mutation),
  mounted at `/app/pb_data` on the `pocketbase` service. This is the actual fix for the
  data-loss problem — everything above only fixed deploys failing to go live at all.
- Rebuilt all 18 non-system collections on production directly via the PocketBase admin
  API, using the local dev database as the schema source of truth, then copied over the
  demo records (patients, appointments, assignments, etc.), remapping `users`/`patients`
  record IDs between local and production where they differed.
- Recreated the 6 user accounts with a temporary password (`TempPass123!` — **must be
  changed by each user**).

## Going forward

- **Schema changes should be made directly against the live PocketBase admin API/UI**,
  not through new migration files, until the migration history is trusted again. The
  existing migration chain has already diverged from production once; adding more files
  to it risks repeating this exact failure mode.
- **Verify the volume before any future PocketBase service changes.** Check Railway
  dashboard → `pocketbase` service → Volumes, or query
  `project { volumes { edges { node { id name } } } }` via the API. If it's ever empty
  again, treat that as a live data-loss risk, not a config nit.
- Email alerts (`apps/pocketbase/pb_hooks/*.js` mailer hooks) do not currently work in
  production — confirmed via `GET /api/settings`: SMTP is disabled and no
  `BUILDER_MAILER_*` environment variables are set. This is unrelated to this incident
  and has presumably never worked; it needs real SMTP or Builder Mailer credentials set
  as Railway service variables before any hook can actually deliver mail.
