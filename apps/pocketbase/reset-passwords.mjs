const PB_URL = process.env.PB_URL || 'https://pocketbase-production-489c.up.railway.app';
const NEW_PASSWORD = 'Admin123!';

const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identity: 'admin@seniorcare.com', password: 'Admin123!' })
});
const auth = await authRes.json();
const token = auth.token;
console.log('Superuser auth:', token ? '✓' : '✗ FAILED', auth.message || '');
if (!token) process.exit(1);

const usersRes = await fetch(`${PB_URL}/api/collections/users/records?perPage=50`, {
  headers: { Authorization: `Bearer ${token}` }
});
const users = await usersRes.json();
console.log(`Found ${users.items?.length} users`);

for (const u of (users.items || [])) {
  const r = await fetch(`${PB_URL}/api/collections/users/records/${u.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD })
  });
  const result = await r.json();
  console.log(r.status === 200 ? '✓' : '✗', u.email, result.id ? 'password reset' : JSON.stringify(result));
}

console.log('\nAll done — password for all users is now: Admin123!');
