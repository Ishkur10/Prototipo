const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

app.whenReady().then(() => {
  console.log('============ DEBUG INFO ============');
  console.log('App path:', app.getAppPath());
  console.log('Current directory:', __dirname);
  console.log('Java version:');

  exec('java -version', (error, stdout, stderr) => {
    console.log(stderr || stdout); 
    if (error) {
      console.error('Error checking Java version:', error);
    }
  });
  
  const jarPath = path.join(app.getAppPath(), 'resources', 'prueba_electron.jar');
  console.log('JAR path:', jarPath);
  console.log('JAR exists:', fs.existsSync(jarPath));
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  mainWindow.loadURL(url.format({
    pathname: indexPath,
    protocol: 'file:',
    slashes: true,
  }));
  
  mainWindow.webContents.openDevTools();
  

  ipcMain.handle('process-iris-image', async (event, imagePath) => {
    return new Promise((resolve, reject) => {
      console.log('============ IMAGE PROCESSING DEBUG ============');
      console.log('Received image data (length):', imagePath.length);
      
      let tempFilePath = imagePath;
      if (imagePath.startsWith('data:')) {
        console.log('Converting base64 image to temp file...');
        const base64Data = imagePath.split(',')[1];
        tempFilePath = path.join(os.tmpdir(), `temp-iris-${Date.now()}.png`);
        
        try {
          fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
          console.log('Temp file created at:', tempFilePath);
          console.log('Temp file exists:', fs.existsSync(tempFilePath));
          console.log('Temp file size:', fs.statSync(tempFilePath).size);
        } catch (e) {
          console.error('Error creating temp file:', e);
          reject(new Error(`Failed to create temp file: ${e.message}`));
          return;
        }
      }
      
      const jarPath = path.join(app.getAppPath(), 'resources', 'prueba_electron.jar');
      const command = `java -jar "${jarPath}" "${tempFilePath}"`;
      console.log('Executing command:', command);
      
      exec(command, (error, stdout, stderr) => {

        if (tempFilePath !== imagePath && tempFilePath.startsWith(os.tmpdir())) {
          try { 
            fs.unlinkSync(tempFilePath); 
            console.log('Temp file deleted');
          } catch (e) { 
            console.error('Error deleting temp file:', e); 
          }
        }
        

        console.log('Java process completed');
        if (error) {
          console.error('Java process error:', error);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.error('Java process stderr:', stderr);
          reject(new Error(stderr));
          return;
        }
        
        console.log('Java process stdout (first 500 chars):', stdout.substring(0, 500));
        
        try {
          const result = JSON.parse(stdout);
          console.log('Parsed JSON result:', result);
          resolve(result);
        } catch (e) {
          console.error('Error parsing JSON output:', e);
          console.error('Raw stdout:', stdout);
          reject(e);
        }
      });
    });
  });
});