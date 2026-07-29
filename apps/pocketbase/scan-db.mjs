const PB_URL = 'https://pocketbase-production-489c.up.railway.app';
const EMAIL = process.env.PB_SUPERUSER_EMAIL || 'cedric.evans@gmail.com';
const PASS = process.env.PB_SUPERUSER_PASSWORD || 'Evans123@E';

const auth = await fetch(PB_URL + '/api/collections/_superusers/auth-with-password', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({identity: EMAIL, password: PASS})
}).then(r => r.json());

if (!auth.token) {
  console.log('❌ Auth failed:', JSON.stringify(auth));
  process.exit(1);
}
console.log('✅ Authenticated as superuser\n');

const headers = { Authorization: 'Bearer ' + auth.token };

// Check collections
const cols = await fetch(PB_URL + '/api/collections?perPage=100', { headers }).then(r => r.json());
console.log('📦 Collections (' + (cols.items?.length || 0) + '):');
cols.items?.forEach(c => console.log('  -', c.name));

// Check users
const users = await fetch(PB_URL + '/api/collections/users/records?perPage=100', { headers }).then(r => r.json());
console.log('\n👥 Users (' + (users.totalItems || 0) + '):');
users.items?.forEach(u => console.log('  -', u.email, '| role:', u.role, '| name:', u.name));

// Check patients
try {
  const patients = await fetch(PB_URL + '/api/collections/patients/records?perPage=100', { headers }).then(r => r.json());
  console.log('\n🏥 Patients (' + (patients.totalItems || 0) + '):');
  patients.items?.forEach(p => console.log('  -', p.first_name, p.last_name));
} catch(e) { console.log('\n🏥 Patients: collection missing'); }

// Check appointments
try {
  const apts = await fetch(PB_URL + '/api/collections/appointments/records?perPage=100', { headers }).then(r => r.json());
  console.log('\n📅 Appointments (' + (apts.totalItems || 0) + ')');
} catch(e) { console.log('\n📅 Appointments: collection missing'); }
