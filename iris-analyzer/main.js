"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
let mainWindow;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../index.html'),
            protocol: 'file:',
            slashes: true,
        }));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
const jarPath = path.join(electron_1.app.getAppPath(), 'resources', 'prueba_electron.jar');
electron_1.ipcMain.handle('process-iris-image', async (event, imagePath) => {
    return new Promise((resolve, reject) => {
        if (imagePath.startsWith('data:')) {
            const base64Data = imagePath.split(',')[1];
            const tempFilePath = path.join(os.tmpdir(), `temp-iris-${Date.now()}.png`);
            fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
            imagePath = tempFilePath;
        }
        (0, child_process_1.exec)(`java -jar "${jarPath}" "${imagePath}"`, (error, stdout, stderr) => {
            if (imagePath.startsWith(os.tmpdir())) {
                try {
                    fs.unlinkSync(imagePath);
                }
                catch (e) { /* ignorar errores */ }
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
            }
            catch (e) {
                console.error('Error analizando la salida JSON:', e);
                reject(e);
            }
        });
    });
});
