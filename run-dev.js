const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Use the actual Node executable directory
const nodeDir = path.dirname(process.execPath);
const env = { ...process.env };
env.PATH = `${nodeDir};${env.PATH || ''}`;

// Clean .next cache to force fresh compilation of updated routes
const nextCacheDir = path.join(__dirname, '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('Cleaning .next build cache...');
  try {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
  } catch (err) {
    console.warn('Cache clean warning:', err.message);
  }
}

// Locate next cli entry point
let nextCli = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!fs.existsSync(nextCli)) {
  const nextCliAlt = path.join(__dirname, 'node_modules', 'next', 'bin', 'next');
  if (fs.existsSync(nextCliAlt)) {
    nextCli = nextCliAlt;
  }
}

console.log('==================================================');
console.log('🚀 STARTING REV AI NEXT.JS APPLICATION SERVER');
console.log('URL: http://localhost:3000/dashboard/leads');
console.log('Node Path:', process.execPath);
console.log('Next CLI:', nextCli);
console.log('==================================================');

const child = spawn(process.execPath, [nextCli, 'dev', '-p', '3000'], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('Failed to start Next dev server:', err);
});

child.on('exit', (code) => {
  console.log(`Next.js server exited with code ${code}`);
});
