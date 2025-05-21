const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting complete build process...');

// Step 1: Clean everything
console.log('Cleaning old build files...');
try {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
    console.log('Removed dist directory');
  }
  if (fs.existsSync('./release')) {
    fs.rmSync('./release', { recursive: true, force: true });
    console.log('Removed release directory');
  }
} catch (e) {
  console.error('Error during cleanup:', e.message);
}

// Step 2: Build Electron TypeScript files
console.log('Building Electron TypeScript files...');
execSync('tsc -p electron/tsconfig.json', { stdio: 'inherit' });

// Step 3: Build React app
console.log('Building React application...');
execSync('tsc -b && vite build', { stdio: 'inherit' });

// Step 4: Prepare files for packaging
console.log('Preparing files for packaging...');

// Ensure resources directory exists in dist
if (!fs.existsSync('./dist/resources')) {
  fs.mkdirSync('./dist/resources', { recursive: true });
  console.log('Created resources directory in dist');
}

// Copy the JAR file to dist/resources
try {
  const jarSource = './resources/prueba_electron-1.0-SNAPSHOT.jar';
  const jarDest = './dist/resources/prueba_electron.jar';
  
  if (fs.existsSync(jarSource)) {
    fs.copyFileSync(jarSource, jarDest);
    console.log('Copied JAR file to dist/resources');
  } else {
    console.error('Error: JAR file not found at', jarSource);
  }
} catch (e) {
  console.error('Error copying JAR file:', e.message);
}

// Create a specialized main.js for the packaged app
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

  // In packaged app, the files are in the same directory
  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading from:', indexPath);
  
  mainWindow.loadURL(url.format({
    pathname: indexPath,
    protocol: 'file:',
    slashes: true,
  }));

  // For debugging
  // mainWindow.webContents.openDevTools();

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

const jarPath = path.join(__dirname, 'resources', 'prueba_electron.jar');

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

// Write the simplified main.js
fs.writeFileSync('./dist/main.js', mainJsContent);
console.log('Created specialized main.js for packaged app');

// Copy preload.js
try {
  fs.copyFileSync('./preload.js', './dist/preload.js');
  console.log('Copied preload.js to dist directory');
} catch (e) {
  console.error('Error copying preload.js:', e.message);
}

// Step 5: Build with electron-builder
console.log('Building with electron-builder...');
execSync('electron-builder --dir', { stdio: 'inherit' });

console.log('Build complete!');