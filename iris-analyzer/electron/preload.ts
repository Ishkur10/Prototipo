import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  processIrisImage: (imagePath: string) => ipcRenderer.invoke('process-iris-image', imagePath),
});

contextBridge.exposeInMainWorld('diagnostics', {
  testJavaBackend: () => ipcRenderer.invoke('test-java-backend'),
});