const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'Admin123!';

if (process.env.CONFIRM_RESET_PASSWORDS !== 'true') {
  console.error('Refusing to run: this script resets user passwords.');
  console.error('Set CONFIRM_RESET_PASSWORDS=true to continue.');
  process.exit(1);
}

const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identity: process.env.PB_SUPERUSER_EMAIL || 'admin@seniorcare.com',
    password: process.env.PB_SUPERUSER_PASSWORD || 'Admin123!',
  }),
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

console.log(`\nAll done — password for all users is now: ${NEW_PASSWORD}`);
