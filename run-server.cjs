const { spawn } = require('child_process');
const path = require('path');

const vitePath = path.join('node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const child = spawn('node', [path.join('node_modules', 'vite', 'bin', 'vite.js'), '--host', '0.0.0.0', '--port', '5173'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});