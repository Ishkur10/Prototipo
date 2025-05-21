const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');
const waitOn = require('wait-on');

process.env.NODE_ENV = 'development';


console.log('Starting Vite dev server...');
const viteProcess = spawn('npm', ['run', 'dev'], { 
  shell: true,
  env: { ...process.env, BROWSER: 'none' },
  stdio: 'inherit'
});


waitOn({ resources: ['http://localhost:5173'] }).then(() => {
  console.log('Vite dev server is ready, starting Electron...');
  
  const electronProcess = spawn(electron, [path.join(__dirname, 'main.js')], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'inherit'
  });

  electronProcess.on('close', () => {
    viteProcess.kill();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit(0);
});