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
  doctypes: {
    addDocType: (name_en, name_ar, type) => ipcRenderer.invoke('doctypes:addDocType', name_en, name_ar),
    getAllDocTypes: () => ipcRenderer.invoke('doctypes:getAllDocTypes'),
    getDocTypeName: (id) => ipcRenderer.invoke('doctypes:getDocTypeName', id),
  },
  documents: {
    addDocument: (name, docType, docNumber, data, company) => ipcRenderer.invoke('documents:addDocument', name, docType, docNumber, data, company),
    getAllDocuments: () => ipcRenderer.invoke('documents:getAllDocuments'),
    getDocumentsByAccount: (id) => ipcRenderer.invoke('documents:getDocumentsByAccount',id),
    readDoc: (id) => ipcRenderer.invoke('documents:readDoc', id),
    updateDoc: (id, data) => ipcRenderer.invoke('documents:updateDoc', id, data),
    deleteDocumentsByCompany:(id) => ipcRenderer.invoke('documents:deleteDocumentsByCompany', id),
  },
  accounts: {
    getAllAccounts: () => ipcRenderer.invoke('accounts:getAllAccounts'),
    addAccount: (name) => ipcRenderer.invoke('accounts:addAccount', name),
    updateAccount: (id, name) => ipcRenderer.invoke('accounts:updateAccount', id, name),
    getAccountByID: (id) => ipcRenderer.invoke('accounts:getAccountByID', id),
    deleteAccount: (id) => ipcRenderer.invoke('accounts:deleteAccount', id),
  }
});

contextBridge.exposeInMainWorld('api', {
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  loginUser: (data) => ipcRenderer.invoke('login-user', data),
});
