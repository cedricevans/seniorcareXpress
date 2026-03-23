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
    ],
    listRule: '@request.auth.role = "admin"',
    viewRule: '@request.auth.role = "admin"',
    createRule: '',
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
  console.log('\n[3/3] Seeding users (NOT overwritten)...');

  const users = [
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
