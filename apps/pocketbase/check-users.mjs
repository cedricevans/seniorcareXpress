const PB_URL = 'https://pocketbase-production-489c.up.railway.app';
const SUPERUSER_EMAIL = 'cedric.evans@gmail.com';
const SUPERUSER_PASSWORD = 'Evans123@E';

async function checkUsers() {
  // Auth as superuser
  const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: SUPERUSER_EMAIL, password: SUPERUSER_PASSWORD })
  });
  const { token } = await authRes.json();

  // Get all users
  const usersRes = await fetch(`${PB_URL}/api/collections/users/records?perPage=500`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { items } = await usersRes.json();

  console.log('\n📋 Current Users in Production:\n');
  items.forEach(user => {
    console.log(`  ✓ ${user.email.padEnd(30)} | Role: ${user.role.padEnd(10)} | Name: ${user.name}`);
  });
  console.log(`\n  Total: ${items.length} users\n`);
}

checkUsers().catch(console.error);
