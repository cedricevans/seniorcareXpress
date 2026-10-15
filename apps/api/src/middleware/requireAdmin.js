import Pocketbase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';

// The API's own PocketBase client runs as superuser, so routes behind this must
// confirm the caller is a signed-in admin. The web app sends the user's
// PocketBase token; refreshing it with a throwaway client proves it's valid and
// returns the current user record (role included) straight from PocketBase.
export default async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  const userClient = new Pocketbase(PB_URL);
  userClient.autoCancellation(false);
  userClient.authStore.save(token, null);

  let user;
  try {
    ({ record: user } = await userClient.collection('users').authRefresh());
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  req.user = user;
  next();
}
