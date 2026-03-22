#!/usr/bin/env node
/**
 * Upload image to PocketBase site_assets
 * Usage:
 *   PB_URL=http://localhost:8090 node upload-image.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PB_URL = process.env.PB_URL || 'http://localhost:8090';
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'admin@seniorcare.com';
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || 'Admin123!';

const IMAGE_URL = 'http://www.seniorcarexpress.com/wp-content/uploads/2020/01/elder-care-planning.jpg';
const IMAGE_NAME = 'elder-care-planning.jpg';
const TEMP_FILE = path.join(__dirname, 'temp-' + IMAGE_NAME);

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(TEMP_FILE);
    https.get(url.replace('http://', 'https://'), (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(TEMP_FILE);
      });
    }).on('error', reject);
  });
}

async function uploadImage() {
  console.log(`🖼️ Uploading image to PocketBase...\n`);

  try {
    const pb = new PocketBase(PB_URL);

    // Step 1: Authenticate
    console.log('[1/3] Authenticating...');
    await pb.collection('_superusers').authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASSWORD);
    console.log('✅ Authenticated\n');

    // Step 2: Download image
    console.log('[2/3] Downloading image...');
    await downloadImage(IMAGE_URL);
    const stats = fs.statSync(TEMP_FILE);
    console.log(`✅ Downloaded ${stats.size} bytes\n`);

    // Step 3: Upload to PocketBase
    console.log('[3/3] Uploading to PocketBase...');
    const form = new FormData();
    const fileStream = fs.createReadStream(TEMP_FILE);
    form.append('image', fileStream, IMAGE_NAME);
    form.append('asset_type', 'hero');
    form.append('description', 'Elder care planning image');

    const uploadData = await pb.collection('site_assets').create(form);
    console.log('✅ Uploaded to PocketBase\n');
    console.log(`📦 Record ID: ${uploadData.id}`);
    console.log(`🖼️  Image field: ${uploadData.image}`);
    console.log(`\n✨ Use this in HomePage.jsx:`);
    console.log(`const imageUrl = pb.getFileUrl(assetRecord, assetRecord.image);`);
    console.log(`\nAsset Record ID: ${uploadData.id}`);

    // Cleanup
    fs.unlinkSync(TEMP_FILE);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE);
    process.exit(1);
  }
}

uploadImage();
