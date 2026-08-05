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
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'cedric.evans@gmail.com';
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || 'Evans123@E';

let token = '';
const collectionCache = new Map();

function isLocalUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function readJsonFromEnvOrFile(envJsonKey, envFileKey) {
  const jsonText = process.env[envJsonKey];
  const filePath = process.env[envFileKey];

  if (jsonText) {
    return JSON.parse(jsonText);
  }

  if (filePath) {
    const fs = await import('node:fs/promises');
    const contents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(contents);
  }

  return null;
}

const IS_LOCAL = isLocalUrl(PB_URL);

if (!IS_LOCAL) {
  // Safety rails: refuse to run with demo defaults against a remote/prod instance.
  if (!process.env.PB_URL) {
    throw new Error('Refusing to run against remote PocketBase without explicit PB_URL');
  }
  if (!process.env.PB_SUPERUSER_EMAIL || !process.env.PB_SUPERUSER_PASSWORD) {
    throw new Error('Refusing to run against remote PocketBase without PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD');
  }
  if (process.env.PB_SEED === 'true' && process.env.CONFIRM_PB_SEED !== 'true') {
    throw new Error('PB_SEED=true requires CONFIRM_PB_SEED=true for remote/prod targets');
  }
}

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

function escapePbFilterValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findFirstRecord(collectionName, filter) {
  const encoded = encodeURIComponent(filter);
  const res = await pb('GET', `/api/collections/${collectionName}/records?perPage=1&filter=${encoded}`);
  return res.items?.[0] ?? null;
}

async function getCollection(name) {
  if (collectionCache.has(name)) return collectionCache.get(name);
  const collection = await pb('GET', `/api/collections/${name}`);
  collectionCache.set(name, collection);
  return collection;
}

async function getCollectionId(name) {
  if (name === '_pb_users_auth_') {
    return '_pb_users_auth_';
  }
  const collection = await getCollection(name);
  return collection.id;
}

function withRelationIds(fields, relationMap = {}) {
  return Promise.all(fields.map(async (field) => {
    if (field.type !== 'relation' || !field.collectionId) {
      return field;
    }

    const targetName = relationMap[field.name] || field.collectionId;
    return {
      ...field,
      collectionId: await getCollectionId(targetName),
    };
  }));
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
  } catch (err) {
    // On most PocketBase instances this endpoint is not publicly writable once a
    // superuser exists (or may require an existing superuser token). We still
    // try it for first-run bootstrap, but treat failure as "continue to auth".
    console.log(`  · Could not create superuser via API (continuing): ${err.message}`);
  }

  try {
    const data = await pb('POST', '/api/collections/_superusers/auth-with-password', {
      identity: SUPERUSER_EMAIL,
      password: SUPERUSER_PASSWORD,
    });
    token = data.token;
    console.log('  ✓ Authenticated');
  } catch (err) {
    throw new Error(
      [
        `Superuser auth failed for ${SUPERUSER_EMAIL}.`,
        `If you don't know the current PocketBase superuser password, reset it on the server with:`,
        `  pocketbase superuser upsert "${SUPERUSER_EMAIL}" "<new_password>"`,
        `Then rerun this script with PB_SUPERUSER_PASSWORD set to that new password.`,
        `Original error: ${err.message}`,
      ].join('\n'),
    );
  }
}

// ─── 2. Create Collections ───────────────────────────────────────────────────
async function upsertCollection(schema) {
  // Try GET first to see if collection already exists
  let existing = null;
  try {
    existing = await pb('GET', `/api/collections/${schema.name}`);
  } catch {
    // doesn't exist yet
  }

  if (existing) {
    // PATCH to update fields and rules
    try {
      // For auth collections, only send fields/rules — not type
      const patchBody = existing.type === 'auth'
        ? { fields: schema.fields, listRule: schema.listRule, viewRule: schema.viewRule, createRule: schema.createRule, updateRule: schema.updateRule, deleteRule: schema.deleteRule }
        : schema;
      await pb('PATCH', `/api/collections/${existing.id}`, patchBody);
      console.log(`  ↺ Updated: ${schema.name}`);
    } catch (patchErr) {
      console.error(`  ✗ Failed update: ${schema.name} — ${patchErr.message}`);
    }
  } else {
    // POST to create
    try {
      await pb('POST', '/api/collections', schema);
      console.log(`  ✓ Created: ${schema.name}`);
    } catch (createErr) {
      console.error(`  ✗ Failed create: ${schema.name} — ${createErr.message}`);
    }
  }
}

async function createOrUpdateCollection({ schema, relationMap }) {
  const fields = await withRelationIds(schema.fields, relationMap);
  await upsertCollection({ ...schema, fields });
  try {
    const collection = await pb('GET', `/api/collections/${schema.name}`);
    collectionCache.set(schema.name, collection);
  } catch {
    // ignore if create failed; caller will surface via logs
  }
}

function schemaWithoutRules(schema) {
  return {
    ...schema,
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  };
}

async function createCollections() {
  console.log('\n[2/3] Creating collections...');

  const usersSchema = {
    name: 'users',
    type: 'auth',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'avatar', type: 'file', maxSelect: 1 },
      {
        name: 'role', type: 'select', required: true,
        maxSelect: 1, values: ['admin', 'caregiver', 'family', 'patient']
      },
      { name: 'phone', type: 'text' },
    ],
  listRule: '@request.auth.id != ""',
  viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.id = id || @request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const contactsSchema = {
    name: 'contacts',
    type: 'base',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'text' },
      { name: 'message', type: 'text' },
      { name: 'status', type: 'select', maxSelect: 1, values: ['new', 'read', 'archived'] },
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const patientsSchema = {
    name: 'patients',
    type: 'base',
    fields: [
      { name: 'first_name', type: 'text', required: true },
      { name: 'last_name', type: 'text', required: true },
      { name: 'date_of_birth', type: 'date' },
      { name: 'gender', type: 'select', maxSelect: 1, values: ['male', 'female', 'other'] },
      { name: 'address', type: 'text' },
      { name: 'phone', type: 'text' },
      { name: 'emergency_contact', type: 'text' },
      { name: 'medical_notes', type: 'text' },
      { name: 'status', type: 'select', maxSelect: 1, values: ['active', 'inactive', 'discharged'] },
      { name: 'user_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
    ],
    listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || @collection.patient_assignments.caregiver_id = @request.auth.id || @collection.family_links.family_user_id = @request.auth.id || user_id = @request.auth.id)',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin" || @collection.patient_assignments.caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  };

  const patientAssignmentsSchema = {
    name: 'patient_assignments',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'caregiver_id', type: 'relation', required: true, collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'status', type: 'select', maxSelect: 1, values: ['active', 'inactive'] },
    ],
    listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || caregiver_id = @request.auth.id)',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const familyLinksSchema = {
    name: 'family_links',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'family_user_id', type: 'relation', required: true, collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'relationship', type: 'text' },
    ],
    listRule: '@request.auth.id != "" && (@request.auth.role = "admin" || family_user_id = @request.auth.id)',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const careUpdatesSchema = {
    name: 'care_updates',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'caregiver_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'update_type', type: 'select', maxSelect: 1, values: [
        'vitals', 'medication', 'feeding', 'bathing', 'grooming',
        'toileting', 'exercise', 'mobility', 'sleep', 'mood',
        'social_activity', 'incident', 'general'
      ]},
      { name: 'notes', type: 'text' },
      { name: 'vitals', type: 'json' },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    updateRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  };

  const caregiverNotesSchema = {
    name: 'caregiver_notes',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'caregiver_id', type: 'relation', required: true, collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'note', type: 'text', required: true },
      { name: 'note_type', type: 'select', maxSelect: 1, values: [
        'general', 'medical', 'behavioral', 'nutrition', 'feeding',
        'bathing', 'grooming', 'toileting', 'exercise', 'mobility',
        'sleep', 'mood', 'social_activity', 'incident'
      ]},
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "caregiver" || @request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
  };

  const careChecklistsSchema = {
    name: 'care_checklists',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'caregiver_id', type: 'relation', required: true, collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'date', type: 'date', required: true },
      { name: 'tasks', type: 'json' },
      { name: 'notes', type: 'text' },
      { name: 'status', type: 'select', maxSelect: 1, values: ['in_progress', 'completed'] },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "caregiver" || @request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  };

  const carePlansSchema = {
    name: 'care_plans',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'caregiver_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'title', type: 'text', required: true },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'schedule', type: 'json' },
      { name: 'notes', type: 'text' },
      { name: 'status', type: 'select', maxSelect: 1, values: ['active', 'paused', 'completed'] },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const messagesSchema = {
    name: 'messages',
    type: 'base',
    fields: [
      { name: 'sender_id', type: 'relation', required: true, collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'recipient_id', type: 'relation', required: true, collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'content', type: 'text', required: true },
      { name: 'read', type: 'bool' },
    ],
    listRule: '@request.auth.id != "" && (sender_id = @request.auth.id || recipient_id = @request.auth.id)',
    viewRule: '@request.auth.id != "" && (sender_id = @request.auth.id || recipient_id = @request.auth.id)',
    createRule: '@request.auth.id != ""',
    updateRule: 'sender_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  };

  const videoCallsSchema = {
    name: 'video_calls',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'initiated_by', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'participants', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 10 },
      { name: 'status', type: 'select', maxSelect: 1, values: ['scheduled', 'active', 'ended', 'missed'] },
      { name: 'started_at', type: 'date' },
      { name: 'ended_at', type: 'date' },
      { name: 'room_id', type: 'text' },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.role = "admin"',
  };

  const appointmentsSchema = {
    name: 'appointments',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'caregiver_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'text' },
      { name: 'appointment_date', type: 'date', required: true },
      { name: 'appointment_time', type: 'text' },
      { name: 'duration_minutes', type: 'number' },
      { name: 'status', type: 'select', maxSelect: 1, values: ['scheduled', 'completed', 'cancelled', 'no-show'] },
      { name: 'appointment_type', type: 'select', maxSelect: 1, values: ['check-up', 'medication', 'therapy', 'specialist', 'emergency', 'other'] },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    updateRule: '@request.auth.role = "admin" || caregiver_id = @request.auth.id',
    deleteRule: '@request.auth.role = "admin"',
  };

  const medicalHistorySchema = {
    name: 'medical_history',
    type: 'base',
    fields: [
      { name: 'patient_id', type: 'relation', required: true, collectionId: 'patients', cascadeDelete: true, maxSelect: 1 },
      { name: 'condition', type: 'text', required: true },
      { name: 'diagnosed_date', type: 'date' },
      { name: 'status', type: 'select', maxSelect: 1, values: ['active', 'resolved', 'chronic'] },
      { name: 'notes', type: 'text' },
      { name: 'medications', type: 'json' },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    updateRule: '@request.auth.role = "admin" || @request.auth.role = "caregiver"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const auditLogsSchema = {
    name: 'audit_logs',
    type: 'base',
    fields: [
      { name: 'user_id', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
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
  };

  await createOrUpdateCollection({ schema: usersSchema });
  await createOrUpdateCollection({ schema: contactsSchema });

  // ── New form collections ──────────────────────────────────────────────────
  const veteransInquiriesSchema = {
    name: 'veterans_inquiries',
    type: 'base',
    fields: [
      { name: 'full_name', type: 'text', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'phone', type: 'text', required: true },
      { name: 'veteran_status', type: 'text' },
      { name: 'service_era', type: 'text' },
      { name: 'service_length', type: 'text' },
      { name: 'care_needs', type: 'text' },
      { name: 'living_situation', type: 'text' },
      { name: 'additional_info', type: 'text' },
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const jobApplicationsSchema = {
    name: 'job_applications',
    type: 'base',
    fields: [
      { name: 'first_name', type: 'text', required: true },
      { name: 'last_name', type: 'text', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'cell_phone', type: 'text', required: true },
      { name: 'home_phone', type: 'text' },
      { name: 'address', type: 'text' },
      { name: 'address2', type: 'text' },
      { name: 'city_state', type: 'text' },
      { name: 'zip_code', type: 'text' },
      { name: 'resume', type: 'file', maxSelect: 1, maxSize: 10485760 },
      { name: 'worked_before', type: 'text' },
      { name: 'worked_before_details', type: 'text' },
      { name: 'work_authorization', type: 'text' },
      { name: 'how_heard', type: 'text' },
      { name: 'referral_name', type: 'text' },
      { name: 'criminal_record', type: 'text' },
      { name: 'criminal_record_details', type: 'text' },
      { name: 'licensing_disqualifiers', type: 'text' },
      { name: 'discharged', type: 'text' },
      { name: 'discharged_details', type: 'text' },
      { name: 'currently_employed', type: 'text' },
      { name: 'emp1_name', type: 'text' }, { name: 'emp1_phone', type: 'text' },
      { name: 'emp1_address', type: 'text' }, { name: 'emp1_city', type: 'text' },
      { name: 'emp1_from_date', type: 'text' }, { name: 'emp1_to_date', type: 'text' },
      { name: 'emp1_may_contact', type: 'text' }, { name: 'emp1_duties', type: 'text' },
      { name: 'emp1_reason', type: 'text' },
      { name: 'emp2_name', type: 'text' }, { name: 'emp2_phone', type: 'text' },
      { name: 'emp2_address', type: 'text' }, { name: 'emp2_city', type: 'text' },
      { name: 'emp2_from_date', type: 'text' }, { name: 'emp2_to_date', type: 'text' },
      { name: 'emp2_may_contact', type: 'text' }, { name: 'emp2_duties', type: 'text' },
      { name: 'emp2_reason', type: 'text' },
      { name: 'emp3_name', type: 'text' }, { name: 'emp3_phone', type: 'text' },
      { name: 'emp3_address', type: 'text' }, { name: 'emp3_city', type: 'text' },
      { name: 'emp3_from_date', type: 'text' }, { name: 'emp3_to_date', type: 'text' },
      { name: 'emp3_may_contact', type: 'text' }, { name: 'emp3_duties', type: 'text' },
      { name: 'emp3_reason', type: 'text' },
      { name: 'education_level', type: 'text' },
      { name: 'institution', type: 'text' },
      { name: 'graduated', type: 'text' },
      { name: 'degrees', type: 'text' },
      { name: 'licenses', type: 'text' },
      { name: 'licensure_number', type: 'text' },
      { name: 'ref1_first', type: 'text' }, { name: 'ref1_last', type: 'text' },
      { name: 'ref1_company', type: 'text' }, { name: 'ref1_relationship', type: 'text' },
      { name: 'ref1_phone', type: 'text' }, { name: 'ref1_email', type: 'text' },
      { name: 'ref1_years_known', type: 'text' },
      { name: 'ref2_first', type: 'text' }, { name: 'ref2_last', type: 'text' },
      { name: 'ref2_company', type: 'text' }, { name: 'ref2_relationship', type: 'text' },
      { name: 'ref2_phone', type: 'text' }, { name: 'ref2_email', type: 'text' },
      { name: 'ref2_years_known', type: 'text' },
      { name: 'ref3_first', type: 'text' }, { name: 'ref3_last', type: 'text' },
      { name: 'ref3_company', type: 'text' }, { name: 'ref3_relationship', type: 'text' },
      { name: 'ref3_phone', type: 'text' }, { name: 'ref3_email', type: 'text' },
      { name: 'ref3_years_known', type: 'text' },
      { name: 'statement_agreed', type: 'text' },
      { name: 'signature_first', type: 'text' },
      { name: 'signature_last', type: 'text' },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '',
    updateRule: '',
    deleteRule: '@request.auth.role = "admin"',
  };

  // ── VA Aid & Attendance forms library ─────────────────────────────────────
  const vaFormsSchema = {
    name: 'va_forms',
    type: 'base',
    fields: [
      { name: 'form_number', type: 'text', required: true },
      { name: 'title', type: 'text', required: true },
      { name: 'category', type: 'select', maxSelect: 1, values: [
        'aid_attendance', 'pension', 'dic', 'medical', 'authorization', 'other'
      ]},
      { name: 'revision_date', type: 'date' },
      { name: 'effective_date', type: 'date' },
      { name: 'is_current', type: 'bool' },
      { name: 'pdf_file', type: 'file', maxSelect: 1, maxSize: 10485760 },
      { name: 'field_map', type: 'json' },
      { name: 'notes', type: 'text' },
      { name: 'updated_by', type: 'relation', collectionId: 'users', cascadeDelete: false, maxSelect: 1 },
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const vaCasesSchema = {
    name: 'va_cases',
    type: 'base',
    fields: [
      { name: 'applicant_type', type: 'select', maxSelect: 1, values: ['veteran', 'surviving_spouse'] },
      { name: 'first_name', type: 'text', required: true },
      { name: 'last_name', type: 'text', required: true },
      { name: 'date_of_birth', type: 'date' },
      { name: 'ssn_last4', type: 'text' },
      { name: 'branch', type: 'text' },
      { name: 'service_start', type: 'date' },
      { name: 'service_end', type: 'date' },
      { name: 'living_situation', type: 'select', maxSelect: 1, values: ['home', 'assisted_living', 'nursing_facility'] },
      { name: 'patient_id', type: 'relation', collectionId: 'patients', cascadeDelete: false, maxSelect: 1 },
      { name: 'status', type: 'select', maxSelect: 1, values: ['intake', 'gathering_docs', 'ready_for_review', 'submitted', 'closed'] },
      // Reusable per-form-field identity data, shared across VA form field_maps.
      { name: 'veteran_first_name', type: 'text' },
      { name: 'veteran_last_name', type: 'text' },
      { name: 'veteran_middle_initial', type: 'text' },
      { name: 'veteran_ssn_first3', type: 'text' },
      { name: 'veteran_ssn_middle2', type: 'text' },
      { name: 'veteran_ssn_last4', type: 'text' },
      { name: 'va_file_number', type: 'text' },
      { name: 'veteran_dob_month', type: 'text' },
      { name: 'veteran_dob_day', type: 'text' },
      { name: 'veteran_dob_year', type: 'text' },
      { name: 'claimant_first_name', type: 'text' },
      { name: 'claimant_last_name', type: 'text' },
      { name: 'claimant_middle_initial', type: 'text' },
      { name: 'claimant_ssn_first3', type: 'text' },
      { name: 'claimant_ssn_middle2', type: 'text' },
      { name: 'claimant_ssn_last4', type: 'text' },
      { name: 'claimant_va_file_number', type: 'text' },
      { name: 'claimant_dob_month', type: 'text' },
      { name: 'claimant_dob_day', type: 'text' },
      { name: 'claimant_dob_year', type: 'text' },
      { name: 'veteran_service_number', type: 'text' },
      // Reusable contact data, shared across every VA form's field_map.
      { name: 'mailing_address_street', type: 'text' },
      { name: 'mailing_address_apt', type: 'text' },
      { name: 'mailing_address_city', type: 'text' },
      { name: 'mailing_address_state', type: 'text' },
      { name: 'mailing_address_country', type: 'text' },
      { name: 'mailing_address_zip5', type: 'text' },
      { name: 'phone_area', type: 'text' },
      { name: 'phone_mid', type: 'text' },
      { name: 'phone_last4', type: 'text' },
      { name: 'email', type: 'text' },
      // Staff review checklist, completed before a packet can be generated.
      { name: 'checklist_correct_forms', type: 'bool' },
      { name: 'checklist_info_verified', type: 'bool' },
      { name: 'checklist_signatures_obtained', type: 'bool' },
      { name: 'checklist_medical_docs_attached', type: 'bool' },
      { name: 'checklist_financial_docs_attached', type: 'bool' },
      { name: 'checklist_evidence_reviewed', type: 'bool' },
      { name: 'checklist_supervisor_approved', type: 'bool' },
      { name: 'packet_pdf', type: 'file', maxSelect: 1, maxSize: 20971520 },
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  const vaCaseFormsSchema = {
    name: 'va_case_forms',
    type: 'base',
    fields: [
      { name: 'case_id', type: 'relation', required: true, collectionId: 'va_cases', cascadeDelete: true, maxSelect: 1 },
      { name: 'form_id', type: 'relation', required: true, collectionId: 'va_forms', cascadeDelete: false, maxSelect: 1 },
      { name: 'status', type: 'select', maxSelect: 1, values: ['blank', 'filled', 'reviewed', 'submitted'] },
      { name: 'filled_pdf', type: 'file', maxSelect: 1, maxSize: 10485760 },
      // Form-specific data for VA Form 21-0779 (Nursing Home Information).
      { name: 'nursing_home_name', type: 'text' },
      { name: 'nursing_home_address_street', type: 'text' },
      { name: 'nursing_home_address_apt', type: 'text' },
      { name: 'nursing_home_address_city', type: 'text' },
      { name: 'nursing_home_address_state', type: 'text' },
      { name: 'nursing_home_address_country', type: 'text' },
      { name: 'nursing_home_address_zip5', type: 'text' },
      { name: 'nursing_home_address_zip4', type: 'text' },
      { name: 'date_admitted_month', type: 'text' },
      { name: 'date_admitted_day', type: 'text' },
      { name: 'date_admitted_year', type: 'text' },
      { name: 'is_medicaid_approved_facility', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'patient_applied_for_medicaid', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'patient_covered_by_medicaid', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'date_medicaid_began_month', type: 'text' },
      { name: 'date_medicaid_began_day', type: 'text' },
      { name: 'date_medicaid_began_year', type: 'text' },
      { name: 'monthly_amount_dollars', type: 'text' },
      { name: 'monthly_amount_cents', type: 'text' },
      { name: 'care_type', type: 'select', maxSelect: 1, values: ['skilled', 'intermediate'] },
      { name: 'nursing_home_official_name', type: 'text' },
      { name: 'nursing_home_official_title', type: 'text' },
      { name: 'nursing_home_official_phone_area', type: 'text' },
      { name: 'nursing_home_official_phone_mid', type: 'text' },
      { name: 'nursing_home_official_phone_last4', type: 'text' },
      { name: 'date_signed_month', type: 'text' },
      { name: 'date_signed_day', type: 'text' },
      { name: 'date_signed_year', type: 'text' },
      // Form-specific data for VA Form 21-0845 (Authorization to Disclose Personal Information).
      { name: 'beneficiary_first_name', type: 'text' },
      { name: 'beneficiary_last_name', type: 'text' },
      { name: 'beneficiary_middle_initial', type: 'text' },
      { name: 'beneficiary_address_street', type: 'text' },
      { name: 'beneficiary_address_apt', type: 'text' },
      { name: 'beneficiary_address_city', type: 'text' },
      { name: 'beneficiary_address_state', type: 'text' },
      { name: 'beneficiary_address_country', type: 'text' },
      { name: 'beneficiary_address_zip5', type: 'text' },
      { name: 'beneficiary_address_zip4', type: 'text' },
      { name: 'beneficiary_phone_area', type: 'text' },
      { name: 'beneficiary_phone_mid', type: 'text' },
      { name: 'beneficiary_phone_last4', type: 'text' },
      { name: 'beneficiary_phone_intl', type: 'text' },
      { name: 'beneficiary_email', type: 'text' },
      { name: 'beneficiary_agrees_to_email', type: 'bool' },
      { name: 'recipient_person_first_name', type: 'text' },
      { name: 'recipient_person_last_name', type: 'text' },
      { name: 'recipient_person_middle_initial', type: 'text' },
      { name: 'recipient_person_address_street', type: 'text' },
      { name: 'recipient_person_address_apt', type: 'text' },
      { name: 'recipient_person_address_city', type: 'text' },
      { name: 'recipient_person_address_state', type: 'text' },
      { name: 'recipient_person_address_country', type: 'text' },
      { name: 'recipient_person_address_zip5', type: 'text' },
      { name: 'recipient_person_address_zip4', type: 'text' },
      { name: 'recipient_org_name_line1', type: 'text' },
      { name: 'recipient_org_name_line2', type: 'text' },
      { name: 'recipient_org_name_line3', type: 'text' },
      { name: 'recipient_org_address_street', type: 'text' },
      { name: 'recipient_org_address_apt', type: 'text' },
      { name: 'recipient_org_address_city', type: 'text' },
      { name: 'recipient_org_address_state', type: 'text' },
      { name: 'recipient_org_address_country', type: 'text' },
      { name: 'recipient_org_address_zip5', type: 'text' },
      { name: 'recipient_org_address_zip4', type: 'text' },
      { name: 'disclosure_scope', type: 'select', maxSelect: 1, values: ['limited', 'any'] },
      { name: 'limited_info_pending_claim', type: 'bool' },
      { name: 'limited_info_current_benefit', type: 'bool' },
      { name: 'limited_info_payment_history', type: 'bool' },
      { name: 'limited_info_amount_owed', type: 'bool' },
      { name: 'limited_info_benefit_letter', type: 'bool' },
      { name: 'limited_info_address_deposit', type: 'bool' },
      { name: 'limited_info_other', type: 'bool' },
      { name: 'limited_info_other_specify', type: 'text' },
      { name: 'any_info_duration', type: 'select', maxSelect: 1, values: ['one_time', 'ongoing', 'until_date'] },
      { name: 'any_info_until_date_month', type: 'text' },
      { name: 'any_info_until_date_day', type: 'text' },
      { name: 'any_info_until_date_year', type: 'text' },
      { name: 'security_question_mother_birthplace', type: 'bool' },
      { name: 'security_question_high_school', type: 'bool' },
      { name: 'security_question_first_pet', type: 'bool' },
      { name: 'security_question_favorite_teacher', type: 'bool' },
      { name: 'security_question_fathers_middle_name', type: 'bool' },
      { name: 'security_answer_mother_birthplace', type: 'text' },
      { name: 'security_answer_high_school', type: 'text' },
      { name: 'security_answer_first_pet', type: 'text' },
      { name: 'security_answer_favorite_teacher', type: 'text' },
      { name: 'security_answer_fathers_middle_name', type: 'text' },
      // Form-specific data for VA Form 21-2680 (Examination for Housebound Status / Aid & Attendance).
      { name: 'claimant_relationship', type: 'select', maxSelect: 1, values: ['self', 'spouse', 'parent', 'child'] },
      { name: 'mailing_address_street', type: 'text' },
      { name: 'mailing_address_apt', type: 'text' },
      { name: 'mailing_address_city', type: 'text' },
      { name: 'mailing_address_state', type: 'text' },
      { name: 'mailing_address_country', type: 'text' },
      { name: 'mailing_address_zip5', type: 'text' },
      { name: 'mailing_address_zip4', type: 'text' },
      { name: 'phone_area', type: 'text' },
      { name: 'phone_mid', type: 'text' },
      { name: 'phone_last4', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'agrees_to_email', type: 'bool' },
      { name: 'benefit_type', type: 'select', maxSelect: 1, values: ['smc', 'smp'] },
      { name: 'is_hospitalized', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'hospital_date_admitted_month', type: 'text' },
      { name: 'hospital_date_admitted_day', type: 'text' },
      { name: 'hospital_date_admitted_year', type: 'text' },
      { name: 'hospital_name', type: 'text' },
      { name: 'hospital_address', type: 'text' },
      { name: 'veteran_date_signed_month', type: 'text' },
      { name: 'veteran_date_signed_day', type: 'text' },
      { name: 'veteran_date_signed_year', type: 'text' },
      { name: 'exam_date_month', type: 'text' },
      { name: 'exam_date_day', type: 'text' },
      { name: 'exam_date_year', type: 'text' },
      { name: 'complete_diagnosis', type: 'text' },
      { name: 'permanent_disability_a', type: 'text' },
      { name: 'permanent_disability_b', type: 'text' },
      { name: 'permanent_disability_c', type: 'text' },
      { name: 'permanent_disability_d', type: 'text' },
      { name: 'permanent_disability_e', type: 'text' },
      { name: 'permanent_disability_f', type: 'text' },
      { name: 'exam_age', type: 'text' },
      { name: 'exam_weight_actual', type: 'text' },
      { name: 'exam_weight_estimated', type: 'text' },
      { name: 'exam_height_feet', type: 'text' },
      { name: 'exam_height_inches', type: 'text' },
      { name: 'exam_nutrition', type: 'text' },
      { name: 'exam_gait', type: 'text' },
      { name: 'exam_blood_pressure', type: 'text' },
      { name: 'exam_pulse_rate', type: 'text' },
      { name: 'exam_respiratory_rate', type: 'text' },
      { name: 'exam_disabilities_restrict_activities', type: 'text' },
      { name: 'bed_hours_9pm_to_9am', type: 'text' },
      { name: 'bed_hours_9am_to_9pm', type: 'text' },
      { name: 'needs_bathing', type: 'bool' },
      { name: 'needs_feeding', type: 'bool' },
      { name: 'needs_dressing', type: 'bool' },
      { name: 'needs_ambulating', type: 'bool' },
      { name: 'needs_hygiene', type: 'bool' },
      { name: 'needs_transferring', type: 'bool' },
      { name: 'needs_toileting', type: 'bool' },
      { name: 'needs_medication_management', type: 'bool' },
      { name: 'needs_additional_activity', type: 'bool' },
      { name: 'additional_activities_specify', type: 'text' },
      { name: 'is_legally_blind', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'blind_explanation', type: 'text' },
      { name: 'corrected_vision_left', type: 'text' },
      { name: 'corrected_vision_right', type: 'text' },
      { name: 'requires_nursing_home_care', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'nursing_home_care_explanation', type: 'text' },
      { name: 'has_mental_capacity', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'mental_capacity_explanation', type: 'text' },
      { name: 'posture_and_appearance', type: 'text' },
      { name: 'upper_extremity_restrictions', type: 'text' },
      { name: 'lower_extremity_restrictions', type: 'text' },
      { name: 'spine_trunk_neck_restrictions', type: 'text' },
      { name: 'other_pathology', type: 'text' },
      { name: 'leave_home_frequency', type: 'text' },
      { name: 'requires_locomotion_aids', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'locomotion_aid_distance', type: 'select', maxSelect: 1, values: ['one_block', 'five_to_six_blocks', 'one_mile'] },
      { name: 'locomotion_aid_distance_other', type: 'text' },
      { name: 'examiner_printed_name', type: 'text' },
      { name: 'examiner_title', type: 'text' },
      { name: 'examiner_date_signed_month', type: 'text' },
      { name: 'examiner_date_signed_day', type: 'text' },
      { name: 'examiner_date_signed_year', type: 'text' },
      { name: 'examiner_npi', type: 'text' },
      { name: 'medical_facility_name', type: 'text' },
      { name: 'medical_facility_address', type: 'text' },
      { name: 'medical_facility_phone_area', type: 'text' },
      { name: 'medical_facility_phone_mid', type: 'text' },
      { name: 'medical_facility_phone_last4', type: 'text' },
      // VA Form 21P-8416 (Medical Expense Report): dynamic-row data (in-home care,
      // other expenses, mileage, and their addendum overflow rows). Stored as JSON
      // since row counts vary per case, unlike every other form's fixed fields above.
      { name: 'expense_report_data', type: 'json' },
      // Form-specific data for VA Form 21P-527EZ (Application for Veterans Pension), Sections 1-9 core.
      { name: 'mailing_address_street', type: 'text' },
      { name: 'mailing_address_apt', type: 'text' },
      { name: 'mailing_address_city', type: 'text' },
      { name: 'mailing_address_state', type: 'text' },
      { name: 'mailing_address_country', type: 'text' },
      { name: 'mailing_address_zip5', type: 'text' },
      { name: 'mailing_address_zip4', type: 'text' },
      { name: 'phone_area', type: 'text' },
      { name: 'phone_mid', type: 'text' },
      { name: 'phone_last4', type: 'text' },
      { name: 'phone_intl', type: 'text' },
      { name: 'other_name_served_under_first', type: 'text' },
      { name: 'other_name_served_under_last', type: 'text' },
      { name: 'date_entered_active_duty_month', type: 'text' },
      { name: 'date_entered_active_duty_day', type: 'text' },
      { name: 'date_entered_active_duty_year', type: 'text' },
      { name: 'date_release_active_duty_month', type: 'text' },
      { name: 'date_release_active_duty_day', type: 'text' },
      { name: 'date_release_active_duty_year', type: 'text' },
      { name: 'branch_army', type: 'bool' },
      { name: 'branch_air_force', type: 'bool' },
      { name: 'branch_navy', type: 'bool' },
      { name: 'branch_coast_guard', type: 'bool' },
      { name: 'branch_marine_corps', type: 'bool' },
      { name: 'branch_space_force', type: 'bool' },
      { name: 'branch_noaa', type: 'bool' },
      { name: 'branch_usphs', type: 'bool' },
      { name: 'place_last_separation_line1', type: 'text' },
      { name: 'place_last_separation_line2', type: 'text' },
      { name: 'date_confinement_started_month', type: 'text' },
      { name: 'date_confinement_started_day', type: 'text' },
      { name: 'date_confinement_started_year', type: 'text' },
      { name: 'date_confinement_ended_month', type: 'text' },
      { name: 'date_confinement_ended_day', type: 'text' },
      { name: 'date_confinement_ended_year', type: 'text' },
      { name: 'specify_facility_4f', type: 'text' },
      { name: 'specify_facility_4g', type: 'text' },
      { name: 'is_prisoner_of_war', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'ever_filed_va_claim', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'service_4a', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'service_4b', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'service_4d_medicaid', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'service_4e', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'service_4f', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'service_4g', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'currently_employed', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'current_work_kind', type: 'text' },
      { name: 'current_work_hours_per_week', type: 'text' },
      { name: 'date_last_worked_month', type: 'text' },
      { name: 'date_last_worked_day', type: 'text' },
      { name: 'date_last_worked_year', type: 'text' },
      { name: 'last_work_hours_per_week', type: 'text' },
      { name: 'last_job_title', type: 'text' },
      { name: 'last_work_kind', type: 'text' },
      { name: 'marital_status', type: 'select', maxSelect: 1, values: ['married', 'separated', 'not_married'] },
      { name: 'spouse_first_name', type: 'text' },
      { name: 'spouse_last_name', type: 'text' },
      { name: 'spouse_middle_initial', type: 'text' },
      { name: 'spouse_dob_month', type: 'text' },
      { name: 'spouse_dob_day', type: 'text' },
      { name: 'spouse_dob_year', type: 'text' },
      { name: 'spouse_ssn_first3', type: 'text' },
      { name: 'spouse_ssn_middle2', type: 'text' },
      { name: 'spouse_ssn_last4', type: 'text' },
      { name: 'date_of_marriage_month', type: 'text' },
      { name: 'date_of_marriage_day', type: 'text' },
      { name: 'date_of_marriage_year', type: 'text' },
      { name: 'place_of_marriage', type: 'text' },
      { name: 'marriage_type_other_specify', type: 'text' },
      { name: 'marriage_type', type: 'select', maxSelect: 1, values: ['ceremonial', 'other'] },
      { name: 'spouse_is_veteran', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'spouse_va_file_number', type: 'text' },
      { name: 'separation_reason', type: 'select', maxSelect: 1, values: ['medical', 'discord', 'work', 'other'] },
      { name: 'spouse_mailing_address_street', type: 'text' },
      { name: 'spouse_mailing_address_apt', type: 'text' },
      { name: 'spouse_mailing_address_city', type: 'text' },
      { name: 'spouse_mailing_address_state', type: 'text' },
      { name: 'spouse_mailing_address_country', type: 'text' },
      { name: 'spouse_mailing_address_zip5', type: 'text' },
      { name: 'spouse_mailing_address_zip4', type: 'text' },
      { name: 'spouse_monthly_contribution', type: 'text' },
      { name: 'veteran_prior_spouse1_first', type: 'text' },
      { name: 'veteran_prior_spouse1_last', type: 'text' },
      { name: 'veteran_prior_spouse1_mi', type: 'text' },
      { name: 'veteran_prior_marriage1_end', type: 'select', maxSelect: 1, values: ['death', 'divorce', 'other'] },
      { name: 'veteran_prior_marriage1_end_other', type: 'text' },
      { name: 'veteran_prior_marriage1_start_month', type: 'text' },
      { name: 'veteran_prior_marriage1_start_day', type: 'text' },
      { name: 'veteran_prior_marriage1_start_year', type: 'text' },
      { name: 'veteran_prior_marriage1_end_month', type: 'text' },
      { name: 'veteran_prior_marriage1_end_day', type: 'text' },
      { name: 'veteran_prior_marriage1_end_year', type: 'text' },
      { name: 'veteran_prior_marriage1_place', type: 'text' },
      { name: 'veteran_prior_marriage1_term_place', type: 'text' },
      { name: 'veteran_prior_spouse2_first', type: 'text' },
      { name: 'veteran_prior_spouse2_last', type: 'text' },
      { name: 'veteran_prior_spouse2_mi', type: 'text' },
      { name: 'veteran_prior_marriage2_end', type: 'select', maxSelect: 1, values: ['death', 'divorce', 'other'] },
      { name: 'veteran_prior_marriage2_end_other', type: 'text' },
      { name: 'veteran_prior_marriage2_start_month', type: 'text' },
      { name: 'veteran_prior_marriage2_start_day', type: 'text' },
      { name: 'veteran_prior_marriage2_start_year', type: 'text' },
      { name: 'veteran_prior_marriage2_end_month', type: 'text' },
      { name: 'veteran_prior_marriage2_end_day', type: 'text' },
      { name: 'veteran_prior_marriage2_end_year', type: 'text' },
      { name: 'veteran_prior_marriage2_place', type: 'text' },
      { name: 'veteran_prior_marriage2_term_place', type: 'text' },
      { name: 'veteran_has_more_marriages', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'spouse_prior_spouse1_first', type: 'text' },
      { name: 'spouse_prior_spouse1_last', type: 'text' },
      { name: 'spouse_prior_spouse1_mi', type: 'text' },
      { name: 'spouse_prior_marriage1_end', type: 'select', maxSelect: 1, values: ['death', 'divorce', 'other'] },
      { name: 'spouse_prior_marriage1_end_other', type: 'text' },
      { name: 'spouse_prior_marriage1_place', type: 'text' },
      { name: 'spouse_prior_marriage1_term_place', type: 'text' },
      { name: 'spouse_prior_spouse2_first', type: 'text' },
      { name: 'spouse_prior_spouse2_last', type: 'text' },
      { name: 'spouse_prior_spouse2_mi', type: 'text' },
      { name: 'spouse_prior_marriage2_end', type: 'select', maxSelect: 1, values: ['death', 'divorce', 'other'] },
      { name: 'spouse_prior_marriage2_end_other', type: 'text' },
      { name: 'spouse_prior_marriage2_place', type: 'text' },
      { name: 'spouse_prior_marriage2_term_place', type: 'text' },
      { name: 'spouse_has_more_marriages', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'num_dependent_children', type: 'text' },
      { name: 'child1_first_name', type: 'text' },
      { name: 'child1_last_name', type: 'text' },
      { name: 'child1_middle_initial', type: 'text' },
      { name: 'child1_ssn_first3', type: 'text' },
      { name: 'child1_ssn_middle2', type: 'text' },
      { name: 'child1_ssn_last4', type: 'text' },
      { name: 'child1_dob_month', type: 'text' },
      { name: 'child1_dob_day', type: 'text' },
      { name: 'child1_dob_year', type: 'text' },
      { name: 'child1_place_of_birth', type: 'text' },
      { name: 'child1_status_previously_married', type: 'bool' },
      { name: 'child1_status_stepchild', type: 'bool' },
      { name: 'child1_status_seriously_disabled', type: 'bool' },
      { name: 'child1_status_biological', type: 'bool' },
      { name: 'child1_status_adopted', type: 'bool' },
      { name: 'child1_status_18_to_23_in_school', type: 'bool' },
      { name: 'child1_status_not_living_with_you', type: 'bool' },
      { name: 'child1_contribution_amount', type: 'text' },
      { name: 'child2_first_name', type: 'text' },
      { name: 'child2_last_name', type: 'text' },
      { name: 'child2_middle_initial', type: 'text' },
      { name: 'child2_ssn_first3', type: 'text' },
      { name: 'child2_ssn_middle2', type: 'text' },
      { name: 'child2_ssn_last4', type: 'text' },
      { name: 'child2_dob_month', type: 'text' },
      { name: 'child2_dob_day', type: 'text' },
      { name: 'child2_dob_year', type: 'text' },
      { name: 'child2_place_of_birth', type: 'text' },
      { name: 'child2_status_previously_married', type: 'bool' },
      { name: 'child2_status_stepchild', type: 'bool' },
      { name: 'child2_status_seriously_disabled', type: 'bool' },
      { name: 'child2_status_biological', type: 'bool' },
      { name: 'child2_status_adopted', type: 'bool' },
      { name: 'child2_status_18_to_23_in_school', type: 'bool' },
      { name: 'child2_status_not_living_with_you', type: 'bool' },
      { name: 'child2_contribution_amount', type: 'text' },
      { name: 'child3_first_name', type: 'text' },
      { name: 'child3_last_name', type: 'text' },
      { name: 'child3_middle_initial', type: 'text' },
      { name: 'child3_ssn_first3', type: 'text' },
      { name: 'child3_ssn_middle2', type: 'text' },
      { name: 'child3_ssn_last4', type: 'text' },
      { name: 'child3_dob_month', type: 'text' },
      { name: 'child3_dob_day', type: 'text' },
      { name: 'child3_dob_year', type: 'text' },
      { name: 'child3_place_of_birth', type: 'text' },
      { name: 'child3_status_previously_married', type: 'bool' },
      { name: 'child3_status_stepchild', type: 'bool' },
      { name: 'child3_status_seriously_disabled', type: 'bool' },
      { name: 'child3_status_biological', type: 'bool' },
      { name: 'child3_status_adopted', type: 'bool' },
      { name: 'child3_status_18_to_23_in_school', type: 'bool' },
      { name: 'child3_status_not_living_with_you', type: 'bool' },
      { name: 'child3_contribution_amount', type: 'text' },
      { name: 'custodian_first_name', type: 'text' },
      { name: 'custodian_last_name', type: 'text' },
      { name: 'custodian_middle_initial', type: 'text' },
      { name: 'children_not_living_address_street', type: 'text' },
      { name: 'children_not_living_address_apt', type: 'text' },
      { name: 'children_not_living_address_city', type: 'text' },
      { name: 'children_not_living_address_state', type: 'text' },
      { name: 'children_not_living_address_country', type: 'text' },
      { name: 'children_not_living_address_zip5', type: 'text' },
      { name: 'children_not_living_address_zip4', type: 'text' },
      { name: 'children_same_address', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'children_18_23_in_school', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'total_assets_amount', type: 'text' },
      { name: 'has_over_75k_assets', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'transferred_assets_3yr', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'owns_primary_residence', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'lot_over_2_acres', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'income_sources_count', type: 'select', maxSelect: 1, values: ['none', 'one_to_four', 'five_plus'] },
      // Form-specific data for VA Form 21P-534EZ (Application for D.I.C., Survivors Pension, and/or Accrued Benefits), Sections I-II.
      { name: 'veteran_dod_month', type: 'text' },
      { name: 'veteran_dod_day', type: 'text' },
      { name: 'veteran_dod_year', type: 'text' },
      { name: 'claiming_dic', type: 'bool' },
      { name: 'claiming_survivors_pension', type: 'bool' },
      { name: 'claiming_accrued_benefits', type: 'bool' },
      { name: 'veteran_died_active_duty', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'claimant_type', type: 'select', maxSelect: 1, values: ['surviving_spouse', 'child_18_23_in_school', 'custodian_for_child_under_18', 'disabled_adult_child'] },
      { name: 'claimant_is_veteran', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'veteran_other_name_yn', type: 'select', maxSelect: 1, values: ['yes', 'no'] },
      { name: 'other_name1_first', type: 'text' },
      { name: 'other_name1_last', type: 'text' },
      { name: 'other_name1_mi', type: 'text' },
      { name: 'other_name2_first', type: 'text' },
      { name: 'other_name2_last', type: 'text' },
      { name: 'other_name2_mi', type: 'text' },
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  };

  await createOrUpdateCollection({ schema: veteransInquiriesSchema });
  await createOrUpdateCollection({ schema: jobApplicationsSchema });

  await createOrUpdateCollection({ schema: schemaWithoutRules(patientsSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(patientAssignmentsSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(familyLinksSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(careUpdatesSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(caregiverNotesSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(messagesSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(videoCallsSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(careChecklistsSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(carePlansSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(appointmentsSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(medicalHistorySchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(auditLogsSchema) });

  await createOrUpdateCollection({ schema: schemaWithoutRules(vaFormsSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(vaCasesSchema) });
  await createOrUpdateCollection({ schema: schemaWithoutRules(vaCaseFormsSchema) });

  await createOrUpdateCollection({ schema: patientsSchema });
  await createOrUpdateCollection({ schema: patientAssignmentsSchema });
  await createOrUpdateCollection({ schema: familyLinksSchema });
  await createOrUpdateCollection({ schema: careUpdatesSchema });
  await createOrUpdateCollection({ schema: caregiverNotesSchema });
  await createOrUpdateCollection({ schema: messagesSchema });
  await createOrUpdateCollection({ schema: videoCallsSchema });
  await createOrUpdateCollection({ schema: careChecklistsSchema });
  await createOrUpdateCollection({ schema: carePlansSchema });
  await createOrUpdateCollection({ schema: appointmentsSchema });
  await createOrUpdateCollection({ schema: medicalHistorySchema });
  await createOrUpdateCollection({ schema: auditLogsSchema });

  await createOrUpdateCollection({ schema: vaFormsSchema });
  await createOrUpdateCollection({ schema: vaCasesSchema });
  await createOrUpdateCollection({ schema: vaCaseFormsSchema });

  const siteAssetsSchema = {
    name: 'site_assets',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
    fields: [
      { name: 'key',         type: 'text',  required: true },
      { name: 'label',       type: 'text',  required: false },
      { name: 'image',       type: 'file',  required: false, options: { maxSelect: 1, maxSize: 10485760, mimeTypes: ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'] } },
      { name: 'alt_text',    type: 'text',  required: false },
      { name: 'category',    type: 'text',  required: false },
    ],
  };
  await createOrUpdateCollection({ schema: siteAssetsSchema });
}

// ─── 3. Seed Data ────────────────────────────────────────────────────────────
let createdUsers = {};
let patientId = '';

async function seedUsers() {
  console.log('\n[3/3] Seeding demo data (users NOT overwritten)...');

  const users = [
    { email: 'cedric.evans@gmail.com',  password: 'pa55word',  name: 'Cedric Evans',  role: 'admin' },
    { email: '1bassdebi@gmail.com',     password: 'pa55word',  name: 'Debi Bass',     role: 'admin' },
    { email: 'admin@seniorcare.com',    password: 'Admin123!', name: 'Admin User',    role: 'admin' },
    { email: 'caregiver@seniorcare.com', password: 'Admin123!', name: 'Sarah Johnson', role: 'caregiver' },
    { email: 'family@seniorcare.com',   password: 'Admin123!', name: 'Jane Smith',    role: 'family' },
    { email: 'patient@seniorcare.com',  password: 'Admin123!', name: 'John Smith',    role: 'patient' },
  ];

  // App admins (these were previously part of production and are safe to recreate if missing).
  // Only add these automatically when targeting a non-local PocketBase instance.
  if (!IS_LOCAL) {
    users.push(
      { email: 'cedric.evans@gmail.com', password: 'Admin123!', name: 'Cedric Evans', role: 'admin' },
      { email: '1bassdebi@gmail.com', password: 'Admin123!', name: 'Debi Bass', role: 'admin' },
    );
  }

  // Optional: provide additional app users without hardcoding real emails into the repo.
  // Example:
  //   PB_EXTRA_USERS_JSON='[{"email":"person@example.com","password":"Temp123!","name":"Person","role":"admin"}]'
  // or:
  //   PB_EXTRA_USERS_FILE=./users.json
  const extra = await readJsonFromEnvOrFile('PB_EXTRA_USERS_JSON', 'PB_EXTRA_USERS_FILE');
  if (Array.isArray(extra) && extra.length > 0) {
    for (const u of extra) {
      if (!u?.email) continue;
      users.push({
        email: String(u.email),
        password: u.password ? String(u.password) : '',
        name: u.name ? String(u.name) : String(u.email),
        role: u.role ? String(u.role) : 'family',
        phone: u.phone ? String(u.phone) : undefined,
      });
    }
    console.log(`  · Extra users provided: ${extra.length}`);
  }

  for (const u of users) {
    try {
      // IMPORTANT: Always check if user exists FIRST — never create/overwrite
      const existing = await findFirstRecord('users', `email='${escapePbFilterValue(u.email)}'`);
      if (existing) {
        createdUsers[u.role] = existing.id;
        console.log(`  · User exists: ${u.email}`);
      } else {
        if (!u.password) {
          console.log(`  ⚠ Skipping create for ${u.email} (missing password)`);
          continue;
        }
        // Only create if doesn't exist
        const rec = await pb('POST', '/api/collections/users/records', {
          email: u.email,
          password: u.password,
          passwordConfirm: u.password,
          name: u.name,
          role: u.role,
          ...(u.phone ? { phone: u.phone } : {}),
          emailVisibility: true,
        });
        createdUsers[u.role] = rec.id;
        console.log(`  ✓ User created: ${u.email} (${u.role})`);
      }
    } catch (err) {
      console.log(`  ⚠ Could not check user ${u.email}: ${err.message}`);
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
      const existing = await findFirstRecord('patients', `first_name='John' && last_name='Smith'`);
      if (existing) {
        patientId = existing.id;
        console.log(`  · Patient exists: John Smith`);
      }
    } catch {}
  }
}

async function seedAssignmentsAndLinks() {
  if (!patientId || !createdUsers['caregiver']) return;

  // Patient assignment
  try {
    const existing = await findFirstRecord(
      'patient_assignments',
      `patient_id='${escapePbFilterValue(patientId)}' && caregiver_id='${escapePbFilterValue(createdUsers['caregiver'])}'`,
    );
    if (existing) {
      console.log('  · Assignment exists');
    } else {
      await pb('POST', '/api/collections/patient_assignments/records', {
        patient_id: patientId,
        caregiver_id: createdUsers['caregiver'],
        start_date: '2026-01-01',
        status: 'active',
      });
      console.log('  ✓ Patient assignment created');
    }
  } catch { console.log('  · Assignment exists'); }

  // Family link
  if (createdUsers['family']) {
    try {
      const existing = await findFirstRecord(
        'family_links',
        `patient_id='${escapePbFilterValue(patientId)}' && family_user_id='${escapePbFilterValue(createdUsers['family'])}'`,
      );
      if (existing) {
        console.log('  · Family link exists');
      } else {
        await pb('POST', '/api/collections/family_links/records', {
          patient_id: patientId,
          family_user_id: createdUsers['family'],
          relationship: 'daughter',
        });
        console.log('  ✓ Family link created');
      }
    } catch { console.log('  · Family link exists'); }
  }

  // Appointments
  const appointments = [
    { title: 'Weekly Check-up', appointment_date: '2026-03-25', appointment_time: '10:00', status: 'scheduled', appointment_type: 'check-up', duration_minutes: 60 },
    { title: 'Medication Review', appointment_date: '2026-04-01', appointment_time: '14:00', status: 'scheduled', appointment_type: 'medication', duration_minutes: 30 },
  ];
  for (const appt of appointments) {
    try {
      const existing = await findFirstRecord(
        'appointments',
        `patient_id='${escapePbFilterValue(patientId)}' && title='${escapePbFilterValue(appt.title)}' && appointment_date='${escapePbFilterValue(appt.appointment_date)}'`,
      );
      if (existing) {
        console.log(`  · Appointment exists: ${appt.title}`);
      } else {
        await pb('POST', '/api/collections/appointments/records', {
          ...appt,
          patient_id: patientId,
          caregiver_id: createdUsers['caregiver'],
        });
        console.log(`  ✓ Appointment: ${appt.title}`);
      }
    } catch { console.log(`  · Appointment exists: ${appt.title}`); }
  }

  // Medical history
  const conditions = [
    { condition: 'Hypertension', diagnosed_date: '2015-06-01', status: 'chronic', notes: 'Managed with Lisinopril 10mg daily' },
    { condition: 'Arthritis', diagnosed_date: '2018-09-12', status: 'chronic', notes: 'Managed with Ibuprofen as needed' },
  ];
  for (const c of conditions) {
    try {
      const existing = await findFirstRecord(
        'medical_history',
        `patient_id='${escapePbFilterValue(patientId)}' && condition='${escapePbFilterValue(c.condition)}'`,
      );
      if (existing) {
        console.log(`  · Condition exists: ${c.condition}`);
      } else {
        await pb('POST', '/api/collections/medical_history/records', { ...c, patient_id: patientId });
        console.log(`  ✓ Medical history: ${c.condition}`);
      }
    } catch { console.log(`  · Condition exists: ${c.condition}`); }
  }

  // Care update
  try {
    const existing = await findFirstRecord(
      'care_updates',
      `patient_id='${escapePbFilterValue(patientId)}' && update_type='vitals'`,
    );
    if (existing) {
      console.log('  · Care update exists');
    } else {
      await pb('POST', '/api/collections/care_updates/records', {
        patient_id: patientId,
        caregiver_id: createdUsers['caregiver'],
        update_type: 'vitals',
        notes: 'Patient in good spirits. BP normal. Ate full breakfast.',
        vitals: { bp: '120/80', pulse: 72, temp: 98.6, weight: 165 },
      });
      console.log('  ✓ Care update created');
    }
  } catch { console.log('  · Care update exists'); }

  // Care plan (for Patient/Family/Admin views)
  try {
    const existing = await findFirstRecord(
      'care_plans',
      `patient_id='${escapePbFilterValue(patientId)}' && title='Demo Care Plan'`,
    );
    if (existing) {
      console.log('  · Care plan exists');
    } else {
      await pb('POST', '/api/collections/care_plans/records', {
        patient_id: patientId,
        caregiver_id: createdUsers['caregiver'],
        title: 'Demo Care Plan',
        start_date: '2026-03-01',
        status: 'active',
        schedule: {
          monday: ['Vitals check', 'Medication reminder'],
          wednesday: ['Mobility exercise'],
          friday: ['Weekly check-in'],
        },
        notes: 'Demo plan for portal walkthrough. Safe to delete after onboarding.',
      });
      console.log('  ✓ Care plan created');
    }
  } catch { console.log('  · Care plan exists'); }

  // Caregiver note
  try {
    const existing = await findFirstRecord(
      'caregiver_notes',
      `patient_id='${escapePbFilterValue(patientId)}' && note_type='general'`,
    );
    if (existing) {
      console.log('  · Caregiver note exists');
    } else {
      await pb('POST', '/api/collections/caregiver_notes/records', {
        patient_id: patientId,
        caregiver_id: createdUsers['caregiver'],
        note_type: 'general',
        note: 'Demo note: patient rested well overnight and is in good spirits.',
      });
      console.log('  ✓ Caregiver note created');
    }
  } catch { console.log('  · Caregiver note exists'); }

  // Message (for messaging page demo)
  if (createdUsers['family']) {
    try {
      const existing = await findFirstRecord(
        'messages',
        `sender_id='${escapePbFilterValue(createdUsers['family'])}' && recipient_id='${escapePbFilterValue(createdUsers['caregiver'])}' && content~'Demo message:'`,
      );
      if (existing) {
        console.log('  · Demo message exists');
      } else {
        await pb('POST', '/api/collections/messages/records', {
          sender_id: createdUsers['family'],
          recipient_id: createdUsers['caregiver'],
          content: 'Demo message: Hi Sarah — thanks for today. Any recommendations for hydration?',
          read: false,
        });
        console.log('  ✓ Demo message created');
      }
    } catch { console.log('  · Demo message exists'); }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏥 Senior Care Xpress — PocketBase Setup`);
  console.log(`   Target: ${PB_URL}\n`);
  // Make seeding opt-in. In production we should NOT seed automatically on every
  // deploy. To seed demo data, run with PB_SEED=true:
  //
  //   PB_URL=https://your-pb node setup.js
  //   PB_SEED=true PB_URL=https://your-pb node setup.js
  //
  // Default: only auth + collections are created/updated.
  //
  // - PB_SEED=true: ensures required app users exist.
  // - PB_SEED_DEMO=true: additionally seeds demo patient/appointments/etc.
  //
  // Local dev convenience: when targeting localhost, PB_SEED=true implies
  // PB_SEED_DEMO=true.
  const SHOULD_SEED = process.env.PB_SEED === 'true';
  const SHOULD_SEED_DEMO = process.env.PB_SEED_DEMO === 'true' || (IS_LOCAL && SHOULD_SEED);

  try {
    await auth();
    await createCollections();

    if (SHOULD_SEED) {
      console.log(`\n[SEED] PB_SEED=true — ensuring app users exist${SHOULD_SEED_DEMO ? ' + seeding demo data' : ''}...`);
      await seedUsers();

      if (SHOULD_SEED_DEMO) {
        await seedPatient();
        await seedAssignmentsAndLinks();
      } else {
        console.log('  · PB_SEED_DEMO is not true — demo patient/data seeding skipped.');
        console.log('    To also seed demo patient data run: PB_SEED_DEMO=true PB_SEED=true node setup.js');
      }

      console.log('\n✅ Setup complete!\n');
      console.log(`\n   Admin UI: ${PB_URL}/_/\n`);
    } else {
      console.log('\n⚠ PB_SEED is not true — seeding skipped.');
      console.log('   Collections and auth have been created/updated.');
      console.log('   To ensure required app users exist run: PB_SEED=true node setup.js');
      console.log('   To also seed demo patient data run: PB_SEED=true PB_SEED_DEMO=true node setup.js');
      console.log(`\n   Admin UI: ${PB_URL}/_/\n`);
    }
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
