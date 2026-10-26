import http from 'http';
import fs from 'fs';
import path from 'path';

console.log('--- Profiling @imgly/background-removal execution stages ---');

// Create test server to serve public/imgly assets
const server = http.createServer((req, res) => {
  const filePath = path.join(path.resolve('public/imgly'), req.url.replace('/imgly/', ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': filePath.endsWith('.json') ? 'application/json' : 'application/octet-stream'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(9876, async () => {
  try {
    const publicPath = 'http://localhost:9876/imgly/';
    console.log(`Test asset server ready at ${publicPath}`);

    // Let's check resources.json
    const res = await fetch(publicPath + 'resources.json');
    const resources = await res.json();
    console.log('resources.json loaded successfully.');

    // Profile download & session creation
    console.log('\n[Stage 1: Model Asset Fetch Times from Local Server]');
    for (const model of ['isnet_quint8', 'isnet_fp16']) {
      const entry = resources[`/models/${model}`];
      if (!entry) continue;
      console.log(`Model /models/${model}: ${entry.size} bytes across ${entry.chunks.length} chunks`);
      const t0 = Date.now();
      await Promise.all(entry.chunks.map(async c => {
        const r = await fetch(publicPath + c.name);
        return r.arrayBuffer();
      }));
      console.log(`✓ Fetched all ${entry.chunks.length} chunks of ${model} in ${Date.now() - t0}ms`);
    }

  } catch (err) {
    console.error('Profiling error:', err);
  } finally {
    server.close();
  }
});
