const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
  console.log('============ DEBUG INFO ============');
  console.log('App path:', app.getAppPath());
  console.log('Current directory:', __dirname);
  
  const checkPaths = [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(app.getAppPath(), 'dist', 'assets'),
    path.join(app.getAppPath(), 'main.js'),
    path.join(app.getAppPath(), 'preload.js'),
    path.join(app.getAppPath(), 'resources')
  ];
  
  console.log('\nChecking key paths:');
  checkPaths.forEach(p => {
    const exists = fs.existsSync(p);
    console.log(`- ${p} (exists: ${exists})`);
    
    if (exists && fs.statSync(p).isDirectory()) {
      try {
        console.log(`  Contents: ${fs.readdirSync(p).join(', ')}`);
      } catch (e) {
        console.log(`  Error reading directory: ${e.message}`);
      }
    }
  });
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log(`\nAttempting to load: ${indexPath}`);
  
  win.loadURL(`file://${indexPath}`);
  win.webContents.openDevTools();
  
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log(`Failed to load: ${errorDescription} (${errorCode})`);
  });
});