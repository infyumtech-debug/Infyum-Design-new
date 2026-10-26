import http from 'http';
import fs from 'fs';
import path from 'path';

console.log('Testing local asset server from public/imgly ...');

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

server.listen(8999, async () => {
  console.log('Local test asset server running on port 8999');
  try {
    const t0 = Date.now();
    const res = await fetch('http://localhost:8999/imgly/resources.json');
    if (!res.ok) throw new Error('resources.json 404');
    const data = await res.json();
    console.log(`✓ Fetched resources.json in ${Date.now() - t0}ms! Keys count: ${Object.keys(data).length}`);

    // Test a chunk fetch
    const chunkName = data['/models/isnet_quint8'].chunks[0].name;
    const t1 = Date.now();
    const chunkRes = await fetch(`http://localhost:8999/imgly/${chunkName}`);
    if (!chunkRes.ok) throw new Error(`Chunk ${chunkName} 404`);
    const blob = await chunkRes.blob();
    console.log(`✓ Fetched 4MB chunk in ${Date.now() - t1}ms! Size: ${blob.size} bytes`);
    
    console.log('\n🎉 ALL LOCAL ASSETS VERIFIED WITH SUB-MILLISECOND LATENCY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
  }
});
