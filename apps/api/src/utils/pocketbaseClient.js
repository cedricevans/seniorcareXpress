import dotenv from 'dotenv';
dotenv.config();
import Pocketbase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';

const pocketbaseClient = new Pocketbase(PB_URL);

// Authenticate as superuser and re-auth when token expires
async function authenticateSuperuser() {
  try {
    await pocketbaseClient.collection('_superusers').authWithPassword(
      process.env.PB_SUPERUSER_EMAIL,
      process.env.PB_SUPERUSER_PASSWORD,
    );
  } catch (err) {
    console.error('[PocketBase] Superuser auth failed:', err?.message || err);
    // Retry after 5 seconds
    setTimeout(authenticateSuperuser, 5000);
  }
}

await authenticateSuperuser();

// Re-auth whenever the token is cleared or expires
pocketbaseClient.authStore.onChange((token) => {
  if (!token) authenticateSuperuser();
});

export default pocketbaseClient;

export { pocketbaseClient };
