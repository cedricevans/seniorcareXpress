import Pocketbase, { getTokenPayload } from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';

// The API's own PocketBase client runs as superuser, so routes behind this must
// confirm the caller is a signed-in admin. The web app sends the user's
// PocketBase token. Reading the user's own record *with that token* makes
// PocketBase verify it (an invalid or expired token is treated as a guest and
// the users viewRule refuses it), and returns the current role from the DB.
export default async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const userId = token ? getTokenPayload(token).id : null;
  if (!userId) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  const userClient = new Pocketbase(PB_URL);
  userClient.autoCancellation(false);
  userClient.authStore.save(token, null);

  let user;
  try {
    user = await userClient.collection('users').getOne(userId);
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  req.user = user;
  next();
}
