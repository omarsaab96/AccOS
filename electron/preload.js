const { contextBridge, ipcRenderer } = require('electron/renderer')


// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // fs: {
  //   readDirectory: (path) => ipcRenderer.invoke('fs:readDirectory', path),
  //   readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  //   writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
  //   createFile: (directory, fileName) => ipcRenderer.invoke('fs:createFile', directory, fileName),
  //   createDirectory: (parentDir, dirName) => ipcRenderer.invoke('fs:createDirectory', parentDir, dirName),
  //   deleteFile: (path) => ipcRenderer.invoke('fs:deleteFile', path),
  //   getStats: (path) => ipcRenderer.invoke('fs:getStats', path),
  // },
  // dialog: {
  //   openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  //   openFile: () => ipcRenderer.invoke('dialog:openFile'),
  // },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  }
});

contextBridge.exposeInMainWorld('api', {
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
});