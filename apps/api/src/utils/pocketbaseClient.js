import 'dotenv/config';
import Pocketbase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';

const pocketbaseClient = new Pocketbase(PB_URL);

try {
  await pocketbaseClient.collection('_superusers').authWithPassword(
    process.env.PB_SUPERUSER_EMAIL,
    process.env.PB_SUPERUSER_PASSWORD,
  );
  console.log('[PocketBase] Superuser auth successful');
} catch (err) {
  console.warn('[PocketBase] Superuser auth failed — collections may not exist yet:', err.message);
}

export default pocketbaseClient;
export { pocketbaseClient };
