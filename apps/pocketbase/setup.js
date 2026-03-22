#!/usr/bin/env node
/**
 * Senior Care Xpress — PocketBase Setup Script
 * 
 * Run this ONCE after PocketBase is deployed to create all collections and seed demo data.
 * 
 * Usage:
 *   PB_URL=https://your-pb-url.railway.app node setup.js
 *   
 * Or locally:
 *   node setup.js
 */

import 'dotenv/config';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'admin@seniorcare.com';
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || 'Admin123!';

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

// ─── 1. Auth ─────────────────────────────────────────────────────────────────
async function auth() {
  console.log('\n[1/3] Authenticating as superuser...');

  // Try to create superuser first (will fail if already exists — that's fine)
  try {
    await pb('POST', '/api/collections/_superusers/records', {
      email: SUPERUSER_EMAIL,
      password: SUPERUSER_PASSWORD,
      passwordConfirm: SUPERUSER_PASSWORD,
    });
    console.log('  ✓ Superuser created');
  } catch {
    console.log('  · Superuser already exists');
  }

  const data = await pb('POST', '/api/collections/_superusers/auth-with-password', {
    identity: SUPERUSER_EMAIL,
    password: SUPERUSER_PASSWORD,
  });
  token = data.token;
  console.log('  ✓ Authenticated');
}

// ─── 2. Create Collections ───────────────────────────────────────────────────
async function createCollection(schema) {
  try {
    await pb('POST', '/api/collections', schema);
    console.log(`  ✓ Created: ${schema.name}`);
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('400')) {
      console.log(`  · Exists:  ${schema.name}`);
    } else {
      console.error(`  ✗ Failed:  ${schema.name} — ${err.message}`);
    }
  }
}

async function createCollections() {
  console.log('\n[2/3] Creating collections...');

  // ── users (auth collection — extends built-in)
  await createCollection({
    name: 'users',
    type: 'auth',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'avatar', type: 'file', options: { maxSelect: 1 } },
      {
        name: 'role', type: 'select', required: true,
        options: { maxSelect: 1, values: ['admin', 'caregiver', 'family', 'patient'] }
      },
      { name: 'phone', type: 'text' },
    ],
    listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.id = id)',
    viewRule: '@request.auth.id != ""',
    createRule: null,
    updateRule: '@request.auth.id = id || @request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── contacts
  await createCollection({
    name: 'contacts',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'text' },
      { name: 'message', type: 'text' },
      { name: 'status', type: 'select', options: { maxSelect: 1, values: ['new', 'read', 'archived'] } },
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── patients
  await createCollection({
    name: 'patients',
    type: 'base',
    fields: [
      { name: 'first_name', type: 'text', required: true },
      { name: 'last_name', type: 'text', required: true },
      { name: 'date_of_birth', type: 'date' },
      { name: 'gender', type: 'select', options: { maxSelect: 1, values: ['male', 'female', 'other'] } },
      { name: 'address', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'emergency_contact', type: 'text' },
      { name: 'medical_notes', type: 'text' },
      { name: 'status', type: 'select', options: { maxSelect: 1, values: ['active', 'inactive', 'discharged'] } },
      { name: 'user_id', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: null, maxSelect: 1 } },
    ],
    listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || @collection.patient_assignments.caregiver_id = @request.auth.id || user_id = @request.auth.id)',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin" || @collection.patient_assignments.caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── patient_assignments
  await createCollection({
    name: 'patient_assignments',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, options: { collectionId: 'patients', cascadeDelete: true, maxSelect: 1 } },
      { name: 'caregiver_id', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'status', type: 'select', options: { maxSelect: 1, values: ['active', 'inactive'] } },
    ],
    listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || caregiver_id = @request.auth.id)',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── family_links
  await createCollection({
    name: 'family_links',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, options: { collectionId: 'patients', cascadeDelete: true, maxSelect: 1 } },
      { name: 'family_user_id', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'relationship', type: 'text' },
    ],
    listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || family_user_id = @request.auth.id)',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── care_updates
  await createCollection({
    name: 'care_updates',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, options: { collectionId: 'patients', cascadeDelete: true, maxSelect: 1 } },
      { name: 'caregiver_id', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'update_type', type: 'select', options: { maxSelect: 1, values: ['vitals', 'medication', 'activity', 'incident', 'general'] } },
      { name: 'notes', type: 'text' },
      { name: 'vitals', type: 'json' },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    updateRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── caregiver_notes
  await createCollection({
    name: 'caregiver_notes',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, options: { collectionId: 'patients', cascadeDelete: true, maxSelect: 1 } },
      { name: 'caregiver_id', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'note', type: 'text', required: true },
      { name: 'note_type', type: 'select', options: { maxSelect: 1, values: ['general', 'medical', 'behavioral', 'nutrition', 'activity'] } },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "caregiver" || @request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
  });

  // ── messages
  await createCollection({
    name: 'messages',
    type: 'base',
    fields: [
      { name: 'sender_id', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'recipient_id', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'content', type: 'text', required: true },
      { name: 'read', type: 'bool' },
    ],
    listRule: '@request.auth.id != "" && (sender_id = @request.auth.id || recipient_id = @request.auth.id)',
    viewRule: '@request.auth.id != "" && (sender_id = @request.auth.id || recipient_id = @request.auth.id)',
    createRule: '@request.auth.id != ""',
    updateRule: 'sender_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── video_calls
  await createCollection({
    name: 'video_calls',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, options: { collectionId: 'patients', cascadeDelete: true, maxSelect: 1 } },
      { name: 'initiated_by', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'participants', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 10 } },
      { name: 'status', type: 'select', options: { maxSelect: 1, values: ['scheduled', 'active', 'ended', 'missed'] } },
      { name: 'started_at', type: 'date' },
      { name: 'ended_at', type: 'date' },
      { name: 'room_id', type: 'text' },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── appointments
  await createCollection({
    name: 'appointments',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, options: { collectionId: 'patients', cascadeDelete: true, maxSelect: 1 } },
      { name: 'caregiver_id', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'appointment_date', type: 'date', required: true },
      { name: 'appointment_time', type: 'text' },
      { name: 'duration_minutes', type: 'number' },
      { name: 'status', type: 'select', options: { maxSelect: 1, values: ['scheduled', 'completed', 'cancelled', 'no-show'] } },
      { name: 'appointment_type', type: 'select', options: { maxSelect: 1, values: ['check-up', 'medication', 'therapy', 'specialist', 'emergency', 'other'] } },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    updateRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── medical_history
  await createCollection({
    name: 'medical_history',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, options: { collectionId: 'patients', cascadeDelete: true, maxSelect: 1 } },
      { name: 'condition', type: 'text', required: true },
      { name: 'diagnosed_date', type: 'date' },
      { name: 'status', type: 'select', options: { maxSelect: 1, values: ['active', 'resolved', 'chronic'] } },
      { name: 'notes', type: 'text' },
      { name: 'medications', type: 'json' },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    deleteRule: '@request.auth.role = "admin"',
  });

  // ── audit_logs
  await createCollection({
    name: 'audit_logs',
    type: 'base',
    fields: [
      { name: 'user_id', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
      { name: 'action', type: 'text', required: true },
      { name: 'collection_name', type: 'text' },
      { name: 'record_id', type: 'text' },
      { name: 'details', type: 'json' },
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.role = "admin"',
  });
}

// ─── 3. Seed Data ────────────────────────────────────────────────────────────
let createdUsers = {};
let patientId = '';

async function seedUsers() {
  console.log('\n[3/3] Seeding demo data...');

  const users = [
    { email: 'admin@seniorcare.com',    password: 'Admin123!', name: 'Admin User',    role: 'admin' },
    { email: 'caregiver@seniorcare.com', password: 'Admin123!', name: 'Sarah Johnson', role: 'caregiver' },
    { email: 'family@seniorcare.com',   password: 'Admin123!', name: 'Jane Smith',    role: 'family' },
    { email: 'patient@seniorcare.com',  password: 'Admin123!', name: 'John Smith',    role: 'patient' },
  ];

  for (const u of users) {
    try {
      const rec = await pb('POST', '/api/collections/users/records', {
        email: u.email,
        password: u.password,
        passwordConfirm: u.password,
        name: u.name,
        role: u.role,
        emailVisibility: true,
      });
      createdUsers[u.role] = rec.id;
      console.log(`  ✓ User created: ${u.email} (${u.role})`);
    } catch {
      // User exists — fetch their ID
      try {
        const res = await pb('GET', `/api/collections/users/records?filter=email='${u.email}'`);
        if (res.items?.[0]) {
          createdUsers[u.role] = res.items[0].id;
          console.log(`  · User exists: ${u.email}`);
        }
      } catch {}
    }
  }
}

async function seedPatient() {
  try {
    const rec = await pb('POST', '/api/collections/patients/records', {
      first_name: 'John',
      last_name: 'Smith',
      date_of_birth: '1945-03-15',
      gender: 'male',
      address: '123 Oak Street, Springfield, IL 62701',
      phone: '555-0100',
      emergency_contact: 'Jane Smith — 555-0101',
      medical_notes: 'Hypertension, Arthritis. Requires daily medication.',
      status: 'active',
      user_id: createdUsers['patient'] || '',
    });
    patientId = rec.id;
    console.log(`  ✓ Patient created: John Smith (${patientId})`);
  } catch (err) {
    try {
      const res = await pb('GET', '/api/collections/patients/records?filter=first_name="John"');
      if (res.items?.[0]) {
        patientId = res.items[0].id;
        console.log(`  · Patient exists: John Smith`);
      }
    } catch {}
  }
}

async function seedAssignmentsAndLinks() {
  if (!patientId || !createdUsers['caregiver']) return;

  // Patient assignment
  try {
    await pb('POST', '/api/collections/patient_assignments/records', {
      patient_id: patientId,
      caregiver_id: createdUsers['caregiver'],
      start_date: '2026-01-01',
      status: 'active',
    });
    console.log('  ✓ Patient assignment created');
  } catch { console.log('  · Assignment exists'); }

  // Family link
  if (createdUsers['family']) {
    try {
      await pb('POST', '/api/collections/family_links/records', {
        patient_id: patientId,
        family_user_id: createdUsers['family'],
        relationship: 'daughter',
      });
      console.log('  ✓ Family link created');
    } catch { console.log('  · Family link exists'); }
  }

  // Appointments
  const appointments = [
    { title: 'Weekly Check-up', appointment_date: '2026-03-25', appointment_time: '10:00', status: 'scheduled', appointment_type: 'check-up', duration_minutes: 60 },
    { title: 'Medication Review', appointment_date: '2026-04-01', appointment_time: '14:00', status: 'scheduled', appointment_type: 'medication', duration_minutes: 30 },
  ];
  for (const appt of appointments) {
    try {
      await pb('POST', '/api/collections/appointments/records', {
        ...appt,
        patient_id: patientId,
        caregiver_id: createdUsers['caregiver'],
      });
      console.log(`  ✓ Appointment: ${appt.title}`);
    } catch { console.log(`  · Appointment exists: ${appt.title}`); }
  }

  // Medical history
  const conditions = [
    { condition: 'Hypertension', diagnosed_date: '2015-06-01', status: 'chronic', notes: 'Managed with Lisinopril 10mg daily' },
    { condition: 'Arthritis', diagnosed_date: '2018-09-12', status: 'chronic', notes: 'Managed with Ibuprofen as needed' },
  ];
  for (const c of conditions) {
    try {
      await pb('POST', '/api/collections/medical_history/records', { ...c, patient_id: patientId });
      console.log(`  ✓ Medical history: ${c.condition}`);
    } catch { console.log(`  · Condition exists: ${c.condition}`); }
  }

  // Care update
  try {
    await pb('POST', '/api/collections/care_updates/records', {
      patient_id: patientId,
      caregiver_id: createdUsers['caregiver'],
      update_type: 'vitals',
      notes: 'Patient in good spirits. BP normal. Ate full breakfast.',
      vitals: { bp: '120/80', pulse: 72, temp: 98.6, weight: 165 },
    });
    console.log('  ✓ Care update created');
  } catch { console.log('  · Care update exists'); }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏥 Senior Care Xpress — PocketBase Setup`);
  console.log(`   Target: ${PB_URL}\n`);

  try {
    await auth();
    await createCollections();
    await seedUsers();
    await seedPatient();
    await seedAssignmentsAndLinks();

    console.log('\n✅ Setup complete!\n');
    console.log('   Demo accounts (password: Admin123!):');
    console.log('   · admin@seniorcare.com     → Admin portal');
    console.log('   · caregiver@seniorcare.com → Caregiver portal');
    console.log('   · family@seniorcare.com    → Family portal');
    console.log('   · patient@seniorcare.com   → Patient portal');
    console.log(`\n   Admin UI: ${PB_URL}/_/\n`);
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
