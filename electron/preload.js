const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => shell.openExternal(url),
  platform: process.platform,
  getApiBaseUrl: () => 'http://127.0.0.1:8000'
});
