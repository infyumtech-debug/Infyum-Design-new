import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';
const TARGET_DIR = path.resolve('public/imgly');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    console.log(`Already exists: ${path.basename(destPath)}`);
    return;
  }
  console.log(`Downloading ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`✓ Saved ${path.basename(destPath)} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  console.log('--- Downloading @imgly offline assets to public/imgly ---');
  
  // 1. Download resources.json
  const resourcesUrl = BASE_URL + 'resources.json';
  const resourcesDest = path.join(TARGET_DIR, 'resources.json');
  await downloadFile(resourcesUrl, resourcesDest);

  const resourcesData = JSON.parse(fs.readFileSync(resourcesDest, 'utf8'));

  // 2. Identify required chunks for isnet_quint8 and WASM
  const requiredKeys = [
    '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
    '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
    '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm',
    '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs',
    '/models/isnet_quint8',
    '/models/isnet_fp16'
  ];

  const chunkNames = new Set();
  for (const key of requiredKeys) {
    if (resourcesData[key] && resourcesData[key].chunks) {
      for (const chunk of resourcesData[key].chunks) {
        chunkNames.add(chunk.name);
      }
    }
  }

  console.log(`Total unique chunk files to download: ${chunkNames.size}`);

  let completed = 0;
  for (const chunkName of chunkNames) {
    const chunkUrl = BASE_URL + chunkName;
    const chunkDest = path.join(TARGET_DIR, chunkName);
    try {
      await downloadFile(chunkUrl, chunkDest);
      completed++;
      console.log(`[${completed}/${chunkNames.size}] ${chunkName}`);
    } catch (err) {
      console.error(`Failed to download ${chunkName}:`, err);
    }
  }

  console.log('\n🎉 ALL ASSETS DOWNLOADED SUCCESSFULLY TO public/imgly!');
}

main().catch(err => {
  console.error('Download script failed:', err);
  process.exit(1);
});
