# Railway service roots

This monorepo should be deployed to Railway as **three separate services**.

## Root Directory

- Web: `apps/web`
- API: `apps/api`
- PocketBase: `apps/pocketbase`

## Notes

- `apps/web/railway.toml` is intended for the web service rooted at `apps/web`.
- `apps/api/railway.toml` is intended for the API service rooted at `apps/api`.
- `apps/pocketbase/railway.toml` is intended for the PocketBase service rooted at `apps/pocketbase`.
- The root-level `railway.toml` is only a fallback for accidental repo-root deployments and should not replace the per-service setup.

## Why this matters

If Railway builds from the repo root, it can infer the root `package.json` scripts and start the monorepo dev/runtime flow instead of the intended single service. That can cause startup failures such as PocketBase binary path errors.