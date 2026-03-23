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

This repo now avoids copying any committed `pb_data` into the image and ignores `apps/pocketbase/pb_data` by default. If you accidentally committed `pb_data`, run `tools/remove_pb_data_from_git.sh` from the repo root to stop tracking it and commit the removal.