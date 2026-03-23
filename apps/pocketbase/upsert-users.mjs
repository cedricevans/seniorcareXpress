#!/usr/bin/env node
/**
 * PocketBase user upsert helper (non-destructive by default).
 *
 * Usage:
 *   PB_URL=https://your-pb \
 *   PB_SUPERUSER_EMAIL=admin@seniorcare.com \
 *   PB_SUPERUSER_PASSWORD=... \
 *   USERS_JSON='[{"email":"a@x.com","password":"Temp123!","name":"A","role":"admin"}]' \
 *   node upsert-users.mjs
 *
 * Or:
 *   USERS_FILE=./users.json node upsert-users.mjs
 *
 * Notes:
 * - Existing users are NOT modified unless UPDATE_EXISTING=true.
 * - Passwords are only used when creating new accounts.
 */

import 'dotenv/config';
import fs from 'node:fs/promises';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL;
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD;

const USERS_JSON = process.env.USERS_JSON;
const USERS_FILE = process.env.USERS_FILE;
const UPDATE_EXISTING = process.env.UPDATE_EXISTING === 'true';

let token = '';

async function pb(method, path, body) {
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { message: text }; }

  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function auth() {
  if (!SUPERUSER_EMAIL || !SUPERUSER_PASSWORD) {
    throw new Error('Missing PB_SUPERUSER_EMAIL or PB_SUPERUSER_PASSWORD');
  }

  const data = await pb('POST', '/api/collections/_superusers/auth-with-password', {
    identity: SUPERUSER_EMAIL,
    password: SUPERUSER_PASSWORD,
  });
  token = data.token;
}

function escapePbFilterValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function readUsersInput() {
  if (USERS_JSON) {
    return JSON.parse(USERS_JSON);
  }
  if (USERS_FILE) {
    const contents = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(contents);
  }
  throw new Error('Provide USERS_JSON or USERS_FILE');
}

async function main() {
  const users = await readUsersInput();
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('Users input must be a non-empty JSON array');
  }

  await auth();

  console.log(`[upsert-users] Target: ${PB_URL}`);
  console.log(`[upsert-users] UPDATE_EXISTING=${UPDATE_EXISTING}`);

  for (const user of users) {
    const email = user?.email?.trim?.();
    if (!email) {
      console.log('  ⚠ Skipped user with missing email');
      continue;
    }

    const filterEmail = escapePbFilterValue(email);
    const res = await pb('GET', `/api/collections/users/records?filter=email='${filterEmail}'`);
    const existing = res.items?.[0] || null;

    if (existing) {
      if (!UPDATE_EXISTING) {
        console.log(`  · Exists: ${email}`);
        continue;
      }

      const updateBody = {};
      if (user.name != null) updateBody.name = user.name;
      if (user.role != null) updateBody.role = user.role;
      if (user.phone != null) updateBody.phone = user.phone;

      if (Object.keys(updateBody).length === 0) {
        console.log(`  · Exists (no updates): ${email}`);
        continue;
      }

      await pb('PATCH', `/api/collections/users/records/${existing.id}`, updateBody);
      console.log(`  ↺ Updated: ${email}`);
      continue;
    }

    if (!user.password) {
      console.log(`  ✗ Missing password for new user: ${email}`);
      continue;
    }

    await pb('POST', '/api/collections/users/records', {
      email,
      password: user.password,
      passwordConfirm: user.password,
      name: user.name || email,
      role: user.role || 'family',
      phone: user.phone,
      emailVisibility: true,
    });
    console.log(`  ✓ Created: ${email}`);
  }
}

main().catch((err) => {
  console.error(`[upsert-users] ERROR: ${err.message}`);
  process.exit(1);
});

