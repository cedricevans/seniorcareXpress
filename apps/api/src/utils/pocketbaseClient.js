import 'dotenv/config';
import Pocketbase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const REAUTH_INTERVAL_MS = 15 * 60 * 1000;

const pocketbaseClient = new Pocketbase(PB_URL);

async function authenticateSuperuser() {
  await pocketbaseClient.collection('_superusers').authWithPassword(
    process.env.PB_SUPERUSER_EMAIL,
    process.env.PB_SUPERUSER_PASSWORD,
  );
}

try {
  await authenticateSuperuser();
  console.log('[PocketBase] Superuser auth successful');
} catch (err) {
  console.warn('[PocketBase] Superuser auth failed — collections may not exist yet:', err.message);
}

// The superuser login returns a session token (24h lifetime in this project),
// not a static API key, so it must be renewed periodically or requests
// eventually fail with PocketBase's generic 404 (its rule engine treats an
// expired/invalid token the same as "not allowed to see this", not as 401).
setInterval(() => {
  authenticateSuperuser().catch((err) => {
    console.error('[PocketBase] Superuser re-auth failed:', err.message);
  });
}, REAUTH_INTERVAL_MS).unref();

// Belt-and-suspenders: if the periodic refresh above ever misses a cycle,
// or the connection goes stale for any other reason (e.g. a schema change
// applied via setup.js while this process was already running), catch it
// here before a route ever sees a stale token.
export async function ensureAuthenticated() {
  if (!pocketbaseClient.authStore.isValid) {
    await authenticateSuperuser();
  }
}

export default pocketbaseClient;
export { pocketbaseClient };
