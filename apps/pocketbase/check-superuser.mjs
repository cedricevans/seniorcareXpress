#!/usr/bin/env node
import 'dotenv/config';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const email = process.env.PB_SUPERUSER_EMAIL;
const password = process.env.PB_SUPERUSER_PASSWORD;

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function postJson(path, body) {
  const res = await fetch(`${PB_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = safeJsonParse(text);
  return { res, text, json };
}

async function getJson(path, token) {
  const res = await fetch(`${PB_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const text = await res.text();
  const json = safeJsonParse(text);
  return { res, text, json };
}

async function main() {
  console.log(`[check-superuser] Target: ${PB_URL}`);

  const health = await getJson('/api/health');
  if (!health.res.ok) {
    console.error(`[check-superuser] /api/health failed: ${health.res.status} ${health.text}`);
    process.exit(1);
  }
  console.log('[check-superuser] /api/health: ✓');

  if (!email || !password) {
    console.error('[check-superuser] Missing PB_SUPERUSER_EMAIL and/or PB_SUPERUSER_PASSWORD.');
    console.error('  Example: PB_URL=... PB_SUPERUSER_EMAIL=... PB_SUPERUSER_PASSWORD=... node apps/pocketbase/check-superuser.mjs');
    process.exit(1);
  }

  const candidates = [
    {
      label: '_superusers',
      path: '/api/collections/_superusers/auth-with-password',
      body: { identity: email, password },
    },
    // Older PocketBase versions used /api/admins/auth-with-password
    {
      label: 'admins (legacy)',
      path: '/api/admins/auth-with-password',
      body: { identity: email, password },
    },
  ];

  for (const c of candidates) {
    const { res, text, json } = await postJson(c.path, c.body);
    const token = json?.token;
    const message = json?.message || json?.data?.message || '';

    console.log(`[check-superuser] Auth via ${c.label}: ${res.status} ${token ? '✓' : '✗'} ${message}`.trim());

    if (token) {
      const whoami = await getJson('/api/collections/_superusers/records?perPage=1', token);
      if (whoami.res.ok) {
        const found = whoami.json?.items?.[0]?.email || whoami.json?.items?.[0]?.id || 'unknown';
        console.log(`[check-superuser] Token works. First superuser: ${found}`);
      } else {
        console.log(`[check-superuser] Token acquired but listing superusers failed: ${whoami.res.status}`);
      }
      process.exit(0);
    }

    // Helpful error detail (without printing secrets)
    if (res.status === 404) {
      console.log(`[check-superuser] Endpoint not found: ${c.path}`);
    } else if (!res.ok) {
      console.log(`[check-superuser] Response: ${text.slice(0, 400)}`);
    }
  }

  console.error('[check-superuser] Superuser auth failed. Common causes:');
  console.error('  - Railway variables not applied (restart/redeploy PocketBase service).');
  console.error('  - You are logging into /_/ with an app user, not a PocketBase superuser.');
  console.error('  - PB_SUPERUSER_EMAIL/PB_SUPERUSER_PASSWORD mismatch vs what was upserted.');
  console.error('  - No persistent disk at /app/pb_data (DB resets on deploy).');
  process.exit(1);
}

main();

