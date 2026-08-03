const { contextBridge, ipcRenderer } = require('electron');

let commandHandler = null;
let openFileHandler = null;
const pendingCommands = [];
const pendingFiles = [];

ipcRenderer.on('desktop:command', (_event, command) => {
  if (commandHandler) commandHandler(command);
  else pendingCommands.push(command);
});

ipcRenderer.on('desktop:open-file', (_event, file) => {
  if (openFileHandler) openFileHandler(file);
  else pendingFiles.push(file);
});

contextBridge.exposeInMainWorld('htmlDesignerDesktop', Object.freeze({
  isDesktop: true,
  openHtml: () => ipcRenderer.invoke('desktop:open-html'),
  readHtml: (token) => ipcRenderer.invoke('desktop:read-html', token),
  writeHtml: (token, html) => ipcRenderer.invoke('desktop:write-html', token, html),
  saveHtml: (payload) => ipcRenderer.invoke('desktop:save-html', payload),
  onCommand: (callback) => {
    if (typeof callback !== 'function') return;
    commandHandler = callback;
    pendingCommands.splice(0).forEach(callback);
  },
  onOpenFile: (callback) => {
    if (typeof callback !== 'function') return;
    openFileHandler = callback;
    pendingFiles.splice(0).forEach(callback);
  },
}));
