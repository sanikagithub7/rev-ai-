const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const nodeDir = 'C:\\Program Files\\nodejs';
const env = { ...process.env };
env.PATH = `${nodeDir};${env.PATH || ''}`;

let nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

if (!fs.existsSync(nextBin)) {
  const pkgPath = path.join(__dirname, 'node_modules', 'next', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const binRel = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.next;
    if (binRel) {
      nextBin = path.join(__dirname, 'node_modules', 'next', binRel);
    }
  }
}

console.log('Starting Rev AI Local Server on http://localhost:3000 using binary:', nextBin);

const child = spawn(process.execPath, [nextBin, 'dev', '-p', '3000'], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('Failed to start Next dev server:', err);
});

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});
