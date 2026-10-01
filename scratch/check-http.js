const { exec } = require('child_process');
const http = require('http');

async function testFetch(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, data: data.slice(0, 500) });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function run() {
  console.log('Testing routes:');
  const routes = ['/', '/admin', '/executive', '/employee', '/employee/advance', '/employee/leave', '/employee/stats'];
  for (const r of routes) {
    const res = await testFetch(r);
    console.log(`${r}: Status ${res.status || 'ERR'} (${res.error || res.length + ' bytes'})`);
  }
}

run();
