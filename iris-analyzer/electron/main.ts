import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

let mainWindow: BrowserWindow | null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {

    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    mainWindow.loadURL(
      url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

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


const jarPath = path.join(app.getAppPath(), 'resources', 'prueba_electron.jar');

ipcMain.handle('process-iris-image', async (event, imagePath) => {
  return new Promise((resolve, reject) => {
    if (imagePath.startsWith('data:')) {

      const base64Data = imagePath.split(',')[1];
      const tempFilePath = path.join(os.tmpdir(), `temp-iris-${Date.now()}.png`);
      
      fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
      imagePath = tempFilePath;
    }
    
    exec(`java -jar "${jarPath}" "${imagePath}"`, (error, stdout, stderr) => {
      if (imagePath.startsWith(os.tmpdir())) {
        try { fs.unlinkSync(imagePath); } catch (e) { /* ignorar errores */ }
      }
      
      if (error) {
        console.error('Error ejecutando el JAR:', error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error('Error en la salida del JAR:', stderr);
        reject(new Error(stderr));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        console.error('Error analizando la salida JSON:', e);
        reject(e);
      }
    });
  });
});