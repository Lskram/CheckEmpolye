const { spawn } = require('child_process');
const http = require('http');

// Find Edge or Chrome path
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const fs = require('fs');
const browserPath = edgePaths.find(p => fs.existsSync(p));

console.log('Found browser:', browserPath);

if (!browserPath) {
  console.log('No browser found');
  process.exit(1);
}

const port = 9333;
const browser = spawn(browserPath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    console.log('Pages:', pages);
    const wsUrl = pages[0].webSocketDebuggerUrl;
    console.log('WS URL:', wsUrl);

    const WebSocket = require('ws') || null;
    // If ws is not installed, let's see
  } catch (e) {
    console.error('Error connecting to browser CDP:', e);
  } finally {
    browser.kill();
  }
}, 2000);
