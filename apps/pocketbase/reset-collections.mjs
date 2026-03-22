#!/usr/bin/env node
// Deletes all non-system collections so setup.js can run fresh
import 'dotenv/config';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';

const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identity: process.env.PB_SUPERUSER_EMAIL || 'admin@seniorcare.com',
    password: process.env.PB_SUPERUSER_PASSWORD || 'Admin123!',
  }),
});
const { token } = await authRes.json();

const listRes = await fetch(`${PB_URL}/api/collections?perPage=100`, {
  headers: { Authorization: `Bearer ${token}` },
});
const { items } = await listRes.json();

// Only delete user-created (non-system) collections
const toDelete = items.filter(c => !c.name.startsWith('_'));
console.log('Deleting:', toDelete.map(c => c.name).join(', ') || '(none)');

// Delete in reverse order to avoid FK constraint errors
for (const col of toDelete.reverse()) {
  const del = await fetch(`${PB_URL}/api/collections/${col.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(`  DELETE ${col.name}: ${del.status}`);
}
console.log('Done.');
