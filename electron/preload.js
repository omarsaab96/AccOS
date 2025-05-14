const { contextBridge, ipcRenderer } = require('electron/renderer')


// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  fs: {
    readDirectory: (path) => ipcRenderer.invoke('fs:readDirectory', path),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
    createFile: (directory, fileName, docType) => ipcRenderer.invoke('fs:createFile', directory, fileName, docType),
    createDirectory: (parentDir, dirName) => ipcRenderer.invoke('fs:createDirectory', parentDir, dirName),
    deleteFile: (path) => ipcRenderer.invoke('fs:deleteFile', path),
    getStats: (path) => ipcRenderer.invoke('fs:getStats', path),
  },
  doc: {
    addDocType: (name_en, name_ar, type) => ipcRenderer.invoke('doc:addDocType', name_en, name_ar),
    getAllDocTypes: () => ipcRenderer.invoke('doc:getAllDocTypes'),
    addDocument: (name, docType, docTypeNameEn, docTypeNameAr, data) => ipcRenderer.invoke('doc:addDocument', name, docType, docTypeNameEn, docTypeNameAr, data),
    getAllDocuments: () => ipcRenderer.invoke('doc:getAllDocuments'),
    readDoc: (id) => ipcRenderer.invoke('doc:readDoc', id),
    updateDoc: (id, data) => ipcRenderer.invoke('doc:updateDoc', id, data),
  }
  // dialog: {
  //   openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  //   openFile: () => ipcRenderer.invoke('dialog:openFile'),
  // },
  // app: {
  //   getVersion: () => ipcRenderer.invoke('app:getVersion'),
  // }
});

contextBridge.exposeInMainWorld('api', {
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
});
