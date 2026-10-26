import fs from 'fs';
import path from 'path';
import ort from 'onnxruntime-web';

console.log('--- Profiling ONNX Session Creation and Inference Time ---');

const resources = JSON.parse(fs.readFileSync('public/imgly/resources.json', 'utf8'));

function assembleModelBuffer(modelKey) {
  const entry = resources[modelKey];
  const chunks = entry.chunks;
  const buffers = chunks.map(c => fs.readFileSync(path.join('public/imgly', c.name)));
  return Buffer.concat(buffers);
}

async function benchmarkModel(modelName) {
  console.log(`\nTesting ${modelName} ...`);
  const t0 = Date.now();
  const buffer = assembleModelBuffer(`/models/${modelName}`);
  console.log(`1. Assembled buffer: ${(buffer.length / 1024 / 1024).toFixed(2)} MB in ${Date.now() - t0}ms`);

  const tSessionStart = Date.now();
  // Create session
  const session = await ort.InferenceSession.create(buffer, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all'
  });
  const sessionCreationMs = Date.now() - tSessionStart;
  console.log(`2. InferenceSession.create(): ${sessionCreationMs}ms`);

  // Create dummy input tensor: 1 x 3 x 1024 x 1024 float32
  const inputData = new Float32Array(1 * 3 * 1024 * 1024);
  const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 1024, 1024]);

  // First inference (Cold)
  const tInfer1 = Date.now();
  const res1 = await session.run({ input: inputTensor });
  const infer1Ms = Date.now() - tInfer1;
  console.log(`3. Cold Inference (first run): ${infer1Ms}ms`);

  // Second inference (Warm)
  const tInfer2 = Date.now();
  const res2 = await session.run({ input: inputTensor });
  const infer2Ms = Date.now() - tInfer2;
  console.log(`4. Warm Inference (second run): ${infer2Ms}ms`);

  return {
    modelName,
    sizeMb: (buffer.length / 1024 / 1024).toFixed(2),
    sessionCreationMs,
    infer1Ms,
    infer2Ms
  };
}

async function main() {
  try {
    const q8 = await benchmarkModel('isnet_quint8');
    const fp16 = await benchmarkModel('isnet_fp16');

    console.log('\n================== BENCHMARK COMPARISON ==================');
    console.log(`Model          | Size     | Session Init | Cold Run | Warm Run`);
    console.log(`isnet_quint8   | ${q8.sizeMb} MB | ${q8.sessionCreationMs}ms      | ${q8.infer1Ms}ms   | ${q8.infer2Ms}ms`);
    console.log(`isnet_fp16     | ${fp16.sizeMb} MB | ${fp16.sessionCreationMs}ms      | ${fp16.infer1Ms}ms   | ${fp16.infer2Ms}ms`);
    console.log('==========================================================');
  } catch (err) {
    console.error('Benchmark failed:', err);
  }
}

main();
