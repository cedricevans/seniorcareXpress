#!/usr/bin/env node
/**
 * Senior Care Xpress — Site Image Seeder
 *
 * Downloads all external images used by the site and uploads them to the
 * PocketBase `site_assets` collection so they can be served from our own CDN.
 *
 * Usage:
 *   PB_URL=https://pocketbase-production-489c.up.railway.app \
 *   PB_SUPERUSER_EMAIL=admin@seniorcare.com \
 *   PB_SUPERUSER_PASSWORD=Admin123! \
 *   node seed-images.js
 *
 * After running, each image is stored in PocketBase and its record id + URL
 * is printed so you can update the app code to reference them.
 */

import 'dotenv/config';

const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'admin@seniorcare.com';
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || 'Admin123!';

// ─── All site images ─────────────────────────────────────────────────────────
const SITE_IMAGES = [
  {
    key: 'logo',
    label: 'SeniorCare Xpress Logo',
    url: 'https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/6cf179a531307fd05365d487c05a8a26.png',
    alt_text: 'SeniorCare Xpress logo',
    category: 'branding',
  },
  {
    key: 'hero_bg',
    label: 'Homepage Hero Background',
    url: 'https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/998e20385080771dbf491b59f248bada.png',
    alt_text: 'SeniorCare Xpress hero background',
    category: 'hero',
  },
  {
    key: 'who_we_are',
    label: 'Who We Are — Elder Care Planning',
    url: 'http://www.seniorcarexpress.com/wp-content/uploads/2020/01/elder-care-planning.jpg',
    alt_text: 'Elder care planning consultation',
    category: 'homepage',
  },
  {
    key: 'difference_bg',
    label: 'SeniorCare Xpress Difference Background',
    url: 'https://images.unsplash.com/photo-1669152581590-d54fda5a67de?q=80&w=2000&auto=format&fit=crop',
    alt_text: 'Caregiver with senior',
    category: 'homepage',
  },
  {
    key: 'cta_bg',
    label: 'Homepage CTA Background',
    url: 'https://images.unsplash.com/photo-1654702761561-d6d64d4227a1?q=80&w=2000&auto=format&fit=crop',
    alt_text: 'Senior care background',
    category: 'homepage',
  },
  {
    key: 'veterans_hero_bg',
    label: 'Veterans Page Hero Background',
    url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,h=1092,fit=crop/YleWb8GoELTgy7Dg/adobestock_1003153002-m7V396WoOzHLB7Bv.jpeg',
    alt_text: 'Veteran with caregiver',
    category: 'veterans',
  },
  {
    key: 'about_who_we_are',
    label: 'About Page — Home Care Services',
    url: 'http://www.seniorcarexpress.com/wp-content/uploads/2020/01/home-care-services-e1578767005218.jpg',
    alt_text: 'SeniorCare Xpress home care services',
    category: 'about',
  },
  {
    key: 'veterans_about',
    label: 'Veterans Page About Section',
    url: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,h=1092,fit=crop/YleWb8GoELTgy7Dg/adobestock_1086089902-AQExWlVGoriDZKRp.jpeg',
    alt_text: 'Veteran receiving home care',
    category: 'veterans',
  },
];

let token = '';

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function auth() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: SUPERUSER_EMAIL, password: SUPERUSER_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  token = data.token;
  console.log('  ✓ Authenticated');
}

// ─── Check if asset already exists by key ────────────────────────────────────
async function findByKey(key) {
  const res = await fetch(
    `${PB_URL}/api/collections/site_assets/records?filter=(key='${key}')&perPage=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.items?.[0] ?? null;
}

// ─── Download image as buffer ─────────────────────────────────────────────────
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer, contentType };
}

function extFromContentType(ct) {
  if (ct.includes('png'))  return 'png';
  if (ct.includes('gif'))  return 'gif';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('svg'))  return 'svg';
  return 'jpg';
}

// ─── Upload image record ──────────────────────────────────────────────────────
async function uploadAsset(asset) {
  const existing = await findByKey(asset.key);
  if (existing) {
    console.log(`  · Already exists: ${asset.key} (id: ${existing.id})`);
    printUrl(existing);
    return;
  }

  console.log(`  ↓ Downloading: ${asset.key} ...`);
  const { buffer, contentType } = await downloadImage(asset.url);
  const ext = extFromContentType(contentType);
  const filename = `${asset.key}.${ext}`;

  const form = new FormData();
  form.append('key',      asset.key);
  form.append('label',    asset.label);
  form.append('alt_text', asset.alt_text);
  form.append('category', asset.category);
  form.append('image',    new Blob([buffer], { type: contentType }), filename);

  const res = await fetch(`${PB_URL}/api/collections/site_assets/records`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Upload failed for ${asset.key}: ${JSON.stringify(data)}`);

  console.log(`  ✓ Uploaded: ${asset.key} (id: ${data.id})`);
  printUrl(data);
}

function printUrl(record) {
  if (record.image) {
    console.log(`    → ${PB_URL}/api/files/site_assets/${record.id}/${record.image}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🖼️  SeniorCare Xpress — Image Seeder');
  console.log(`   Target: ${PB_URL}\n`);

  await auth();

  console.log('\n[Uploading site images...]');
  for (const asset of SITE_IMAGES) {
    try {
      await uploadAsset(asset);
    } catch (err) {
      console.error(`  ✗ Failed: ${asset.key} — ${err.message}`);
    }
  }

  console.log('\n✅ Image seeding complete!');
  console.log(`\n   View in admin: ${PB_URL}/_/#/collections/site_assets\n`);
  console.log('   Copy the printed URLs above and replace the hardcoded');
  console.log('   image src values in your components.\n');
}

main();
