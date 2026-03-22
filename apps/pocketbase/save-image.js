#!/usr/bin/env node
/**
 * Download image and upload to PocketBase site_assets
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
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
    http.get(url, { timeout: 10000 }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(TEMP_FILE);
      });
    }).on('error', reject);
  });
}

async function uploadImage() {
  console.log(`🖼️ Saving image to PocketBase...\n`);

  try {
    const pb = new PocketBase(PB_URL);

    // Step 1: Authenticate
    console.log('[1/3] Authenticating...');
    await pb.collection('_superusers').authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASSWORD);
    console.log('✅ Authenticated\n');

    // Step 2: Download image
    console.log('[2/3] Downloading image from ' + IMAGE_URL);
    await downloadImage(IMAGE_URL);
    const stats = fs.statSync(TEMP_FILE);
    console.log(`✅ Downloaded ${stats.size} bytes\n`);

    // Step 3: Upload to PocketBase
    console.log('[3/3] Uploading to PocketBase...');
    const form = new FormData();
    const fileStream = fs.createReadStream(TEMP_FILE);
    form.append('image', fileStream, IMAGE_NAME);
    form.append('asset_type', 'hero');
    form.append('description', 'Elder care planning - Who We Are section');

    const uploadData = await pb.collection('site_assets').create(form);
    console.log('✅ Uploaded to PocketBase\n');
    console.log(`📦 Record ID: ${uploadData.id}`);
    console.log(`🖼️  Image filename: ${uploadData.image}`);
    
    const imageUrl = pb.getFileUrl(uploadData, uploadData.image);
    console.log(`\n✨ Image URL to use in HomePage.jsx:`);
    console.log(`https://pocketbase-production-489c.up.railway.app/api/files/site_assets/${uploadData.id}/${uploadData.image}`);
    console.log(`\nOr programmatically:`);
    console.log(`pb.getFileUrl(assetRecord, assetRecord.image);`);

    // Cleanup
    fs.unlinkSync(TEMP_FILE);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE);
    process.exit(1);
  }
}

uploadImage();
