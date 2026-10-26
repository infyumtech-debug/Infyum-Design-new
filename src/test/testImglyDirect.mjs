import { removeBackground, preload } from '@imgly/background-removal';
import fs from 'fs';

console.log('Testing @imgly/background-removal execution in Node...');

async function test() {
  const t0 = Date.now();
  try {
    console.log('Attempting preload with default config...');
    await preload({
      model: 'isnet_quint8',
      debug: true
    });
    console.log(`Preload succeeded in ${(Date.now() - t0) / 1000}s`);
  } catch (e) {
    console.error('Preload failed:', e);
  }
}

test();
