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

Persistent storage for PocketBase
--------------------------------

PocketBase stores its DB files in `pb_data/` inside the service directory. To keep records (users, uploads) across deploys you must mount a persistent disk to `/app/pb_data` for the PocketBase service. Without a persistent volume, any runtime DB in the container will be lost on restart or rebuild.

On Railway:

	1. Open your PocketBase service.
	2. Go to "Add-ons / Disks" and create a new persistent disk.
	3. Mount it inside the container at `/app/pb_data`.
	4. Redeploy. The first time you run you may need to run the setup script once to create collections:

		 PB_URL=https://your-pb-url.railway.app node apps/pocketbase/setup.js

This repo is intentionally configured so PocketBase deploys do **not** ship `pb_data` inside the image. Production data must live on the Railway disk mounted at `/app/pb_data`.

If you accidentally committed `pb_data`, run `tools/remove_pb_data_from_git.sh` from the repo root (or `git rm -r --cached apps/pocketbase/pb_data`) and commit the removal.

Recovery + seeding runbook
--------------------------

### If production users/data disappear after a deploy

This almost always means the PocketBase service is **not** using a persistent disk at `/app/pb_data` (or it’s mounted to the wrong path). Fix the disk mount first, then restore.

1) In Railway → PocketBase service → Disks: ensure a disk exists and is mounted at `/app/pb_data`.
2) Redeploy PocketBase.
3) Recreate the PocketBase superuser if needed (the container entrypoint will do this automatically from `PB_SUPERUSER_EMAIL` / `PB_SUPERUSER_PASSWORD`).

### Seed demo flows (safe, opt-in)

The setup script creates/updates collections every run, but **demo seeding only runs when** `PB_SEED=true` and it will not overwrite existing users (it checks by email first):

	PB_URL=https://your-pb-url.railway.app PB_SEED=true node apps/pocketbase/setup.js

### Upsert “real” user accounts (safe, non-destructive by default)

Use `apps/pocketbase/upsert-users.mjs` to create missing accounts without modifying existing ones:

	PB_URL=https://your-pb-url.railway.app \
	PB_SUPERUSER_EMAIL=... \
	PB_SUPERUSER_PASSWORD=... \
	USERS_JSON='[{"email":"you@example.com","password":"Temp123!","name":"You","role":"admin"}]' \
	node apps/pocketbase/upsert-users.mjs
