import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test 1: Basic spawn
const scriptPath = path.resolve(__dirname, 'scripts', 'discover-cli-tools.js');
console.log('Script path:', scriptPath);

const child = spawn('node', ['-e', 'console.log("line1"); setTimeout(() => console.log("line2"), 1000); setTimeout(() => console.log("line3"), 2000)'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
});

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  console.log('STDOUT:', JSON.stringify(text.slice(0, 100)));
});

child.stderr.on('data', (chunk) => {
  console.log('STDERR:', JSON.stringify(chunk.toString().slice(0, 100)));
});

child.on('close', (code) => {
  console.log('EXIT CODE:', code);
  process.exit(code || 0);
});
