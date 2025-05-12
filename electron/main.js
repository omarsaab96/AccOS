import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
});

const User = mongoose.model('User', userSchema);


// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#FFFFFF'
  });

  // Load the Vite dev server or the built files
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Event when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
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

// IPC handler for registration
ipcMain.handle('register-user', async (event, userData) => {
  console.log(userData)
  const existing = await User.findOne({ email: userData.email });
  if (existing) return { success: false, message: 'Account already exists' };

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = new User({
    ...userData,
    password: hashedPassword
  });

  await newUser.save();

  const { password, _id, ...rest } = newUser.toObject();

  return { success: true, user: { _id: _id.toString(), ...rest } };
});

ipcMain.handle('login-user', async (event, { email, password }) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, message: 'Invalid credentials' };

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return { success: false, message: 'Invalid credentials' };

  const userObj = user.toObject();
  userObj._id = userObj._id.toString(); // Force string conversion
  delete userObj.password;

  return { success: true, user: userObj };

});


// ipcMain.handle('dialog:openDirectory', async () => {
//   const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
//     properties: ['openDirectory']
//   });

//   if (canceled) return null;
//   return filePaths[0];
// });

// ipcMain.handle('dialog:openFile', async () => {
//   const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
//     properties: ['openFile'],
//     filters: [
//       { name: 'Text Files', extensions: ['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css'] },
//       { name: 'All Files', extensions: ['*'] }
//     ]
//   });

//   if (canceled) return null;
//   return filePaths[0];
// });

// ipcMain.handle('fs:readDirectory', async (_, directoryPath) => {
//   try {
//     const items = await fs.readdir(directoryPath, { withFileTypes: true });
//     const files = items.map(item => ({
//       name: item.name,
//       path: path.join(directoryPath, item.name),
//       isDirectory: item.isDirectory(),
//       extension: item.isDirectory() ? null : path.extname(item.name)
//     }));

//     // Sort directories first, then files
//     return files.sort((a, b) => {
//       if (a.isDirectory && !b.isDirectory) return -1;
//       if (!a.isDirectory && b.isDirectory) return 1;
//       return a.name.localeCompare(b.name);
//     });
//   } catch (error) {
//     console.error('Error reading directory:', error);
//     throw error;
//   }
// });

// ipcMain.handle('fs:readFile', async (_, filePath) => {
//   try {
//     const content = await fs.readFile(filePath, 'utf-8');
//     return content;
//   } catch (error) {
//     console.error('Error reading file:', error);
//     throw error;
//   }
// });

// ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
//   try {
//     await fs.writeFile(filePath, content, 'utf-8');
//     return true;
//   } catch (error) {
//     console.error('Error writing file:', error);
//     throw error;
//   }
// });

// ipcMain.handle('fs:createFile', async (_, directoryPath, fileName) => {
//   try {
//     const filePath = path.join(directoryPath, fileName);
//     await fs.writeFile(filePath, '', 'utf-8');
//     return filePath;
//   } catch (error) {
//     console.error('Error creating file:', error);
//     throw error;
//   }
// });

// ipcMain.handle('fs:createDirectory', async (_, parentDirectory, directoryName) => {
//   try {
//     const directoryPath = path.join(parentDirectory, directoryName);
//     await fs.mkdir(directoryPath);
//     return directoryPath;
//   } catch (error) {
//     console.error('Error creating directory:', error);
//     throw error;
//   }
// });

// ipcMain.handle('fs:deleteFile', async (_, filePath) => {
//   try {
//     await fs.unlink(filePath);
//     return true;
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     throw error;
//   }
// });

// ipcMain.handle('fs:getStats', async (_, filePath) => {
//   try {
//     const stats = await fs.stat(filePath);
//     return {
//       size: stats.size,
//       created: stats.birthtime,
//       modified: stats.mtime,
//       isDirectory: stats.isDirectory(),
//     };
//   } catch (error) {
//     console.error('Error getting file stats:', error);
//     throw error;
//   }
// });