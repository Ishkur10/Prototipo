const fs = require('fs');
const path = require('path');

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}


['main.js', 'preload.js'].forEach(file => {
  if (fs.existsSync(`./${file}`)) {
    fs.copyFileSync(`./${file}`, `./dist/${file}`);
    console.log(`Copied ${file} to dist directory`);
  } else {
    console.error(`Error: ${file} not found in root directory`);
  }
});

const mainJsContent = `
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // This is the critical part - handle path resolution differently in packaged app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, we need to find index.html relative to the current file
    const indexPath = path.join(__dirname, 'index.html');
    console.log('Loading from:', indexPath);
    
    mainWindow.loadURL(url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true,
    }));
  }

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

const jarPath = path.join(app.getAppPath(), 'resources', 'prueba_electron.jar');

ipcMain.handle('process-iris-image', async (event, imagePath) => {
  return new Promise((resolve, reject) => {
    if (imagePath.startsWith('data:')) {
      const base64Data = imagePath.split(',')[1];
      const tempFilePath = path.join(os.tmpdir(), \`temp-iris-\${Date.now()}.png\`);
      
      fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
      imagePath = tempFilePath;
    }
    
    console.log('Processing image with Java:', imagePath);
    console.log('Using JAR at:', jarPath);
    
    exec(\`java -jar "\${jarPath}" "\${imagePath}"\`, (error, stdout, stderr) => {
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
`;

fs.writeFileSync('./dist/main.js', mainJsContent);
console.log('Created updated main.js in dist directory');

try {
  fs.copyFileSync('./dist/index.html', './dist/index.html');
  console.log('Ensured index.html is at the correct location');
} catch (e) {
  console.error('Error copying index.html:', e.message);
}