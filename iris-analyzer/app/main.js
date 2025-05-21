
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// Log some diagnostic information
console.log('App starting...');
console.log('App path:', app.getAppPath());
console.log('Current directory:', __dirname);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // This is the critical path - we need to make sure it's correctly referencing preload.js
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the React app from the correct location
  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log('Loading from:', indexPath);
  
  mainWindow.loadURL(url.format({
    pathname: indexPath,
    protocol: 'file:',
    slashes: true,
  }));

  // Uncomment to debug in packaged app
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Path to the JAR file
const jarPath = path.join(app.getAppPath(), 'resources', 'prueba_electron.jar');

// IPC handler for iris image processing
ipcMain.handle('process-iris-image', async (event, imagePath) => {
  return new Promise((resolve, reject) => {
    if (imagePath.startsWith('data:')) {
      const base64Data = imagePath.split(',')[1];
      const tempFilePath = path.join(os.tmpdir(), `temp-iris-${Date.now()}.png`);
      
      fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
      imagePath = tempFilePath;
    }
    
    console.log('Processing image with Java:', imagePath);
    console.log('Using JAR at:', jarPath);
    
    exec(`java -jar "${jarPath}" "${imagePath}"`, (error, stdout, stderr) => {
      if (imagePath.startsWith(os.tmpdir())) {
        try { fs.unlinkSync(imagePath); } catch (e) { /* ignore errors */ }
      }
      
      if (error) {
        console.error('Error executing JAR:', error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error('Error in JAR output:', stderr);
        reject(new Error(stderr));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        console.error('Error parsing JSON output:', e);
        reject(e);
      }
    });
  });
});
