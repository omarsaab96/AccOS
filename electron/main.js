import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import ExcelJS from 'exceljs';
import { initDocTypesDB, addDocType, getDocTypes, getDocTypeName } from './docTypeStore.js';
import { initDocumentsDB, addDocument, getAllDocuments, getDocumentsByAccount, readDoc, updateDoc, deleteDocumentsByCompany } from './documentStore.js';
import { initAccountsDB, getAllAccounts, addAccount, updateAccount, getAccountByID, deleteAccount } from './accountStore.js';

dotenv.config();

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
const chartOfAccountsPerAccount = path.join(__dirname, 'files', 'accounts');

let mainWindow;

async function initializeApp() {
  try {
    await initDocTypesDB();
    await initDocumentsDB();
    await initAccountsDB();
    console.log('LocalDB initialized');

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    await createWindow();
  } catch (error) {
    console.error('Application initialization failed:', error);
    app.quit();
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/favicon.png'),
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
app.whenReady().then(initializeApp);

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

// IPC handler for Auth
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

//IPC handler for DocTypes
ipcMain.handle('doctypes:addDocType', async (_, name_en, name_ar) => {
  await addDocType(name_en, name_ar)
})

ipcMain.handle('doctypes:getAllDocTypes', async () => {
  return await getDocTypes()
})

ipcMain.handle('doctypes:getDocTypeName', async (_, id) => {
  return await getDocTypeName(id)
})

//IPC handler for Documents
ipcMain.handle('documents:addDocument', async (_, name, docType, docNumber, data, company) => {
  return await addDocument(name, docType, docNumber, data, company)
})

ipcMain.handle('documents:getAllDocuments', async () => {
  return await getAllDocuments()
})

ipcMain.handle('documents:getDocumentsByAccount', async (_, id) => {
  return await getDocumentsByAccount(id)
})

ipcMain.handle('documents:readDoc', async (_, id) => {
  return await readDoc(id)
})

ipcMain.handle('documents:updateDoc', async (_, id, data) => {
  return await updateDoc(id, data)
})

ipcMain.handle('documents:deleteDocumentsByCompany', async (_, id) => {
  return await deleteDocumentsByCompany(id)
})

//IPC handler for Accounts
ipcMain.handle('accounts:getAllAccounts', async () => {
  const accounts = await getAllAccounts();
  return accounts;
})

ipcMain.handle('accounts:addAccount', async (_, name) => {
  return await addAccount(name)
})

ipcMain.handle('accounts:updateAccount', async (_, id, name) => {
  return await updateAccount(id, name)
})

ipcMain.handle('accounts:getAccountByID', async (_, id) => {
  return await getAccountByID(id)
})

ipcMain.handle('accounts:deleteAccount', async (_, id) => {
  return await deleteAccount(id)
})

//IPC handler for Generate PDF
ipcMain.on('documents:generate-pdf', async (event, htmlContent) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
    },
  });

  // Wrap HTML with a minimal document
  const fullHTML = `
    <html>
      <head>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
      </head>
      <body>${htmlContent}</body>
    </html>
  `;

  try {
    await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(fullHTML));

    const pdfBuffer = await printWindow.webContents.printToPDF({
      marginsType: 1,
      printBackground: true,
      pageSize: 'A4',
    });

    const { filePath } = await dialog.showSaveDialog(printWindow, {
      title: 'Save PDF File',
      defaultPath: 'document.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (filePath) {
      await fs.writeFile(filePath, pdfBuffer);
      console.log('PDF saved from div content!');
    }

    printWindow.close();

    shell.openPath(filePath);

  } catch (error) {
    console.error('Failed to generate PDF from div:', error);
  }
});

//IPC handler for Print PDF
ipcMain.handle('documents:printPDF', async (event, htmlContent) => {
  console.log('Starting print process...'); // Debug log
  let printWindow;

  try {
    printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        offscreen: true,
        nodeIntegration: false,
        contextIsolation: true
      },
    });

    console.log('Created print window'); // Debug log

    const fullHTML = `
      <html>
        <head>
          <meta charset="utf-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
        </head>
        <body>${htmlContent}</body>
      </html>
    `;

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`);
    console.log('HTML loaded in print window'); // Debug log

    // Wait for content to load
    await printWindow.webContents.executeJavaScript(`
      Promise.all(Array.from(document.images).map(img =>
        img.complete ? Promise.resolve() :
        new Promise(resolve => {
          img.onload = img.onerror = resolve;
        })
      ));
    `);

    console.log('Initiating print...'); // Debug log
    await printWindow.webContents.print({
      silent: false,
      printBackground: true,
      pageSize: 'A4',
    });

    console.log('Print completed successfully'); // Debug log
    return { success: true };
  } catch (error) {
    console.error('Print error in main process:', error); // Debug log
    return { success: false, error: error.message };
  } finally {
    // if (printWindow && !printWindow.isDestroyed()) {
    //   printWindow.close();
    // }
    console.log('Print window cleaned up'); // Debug log
  }
});

//IPC handler for export to Excel
ipcMain.handle('documents:exportToExcel', async (event, data) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Document');

    // Set RTL if Arabic
    if (data.language === 'ar') {
      worksheet.views = [{
        rightToLeft: true
      }];
    }

    // Merge cells for logo and title
    worksheet.mergeCells('A1:C4');
    worksheet.mergeCells('D1:I4');

    // Add logo image
    try {
      const imageId = workbook.addImage({
        filename: path.join(__dirname, 'assets', 'logo.png'),
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: {
          col: 0.1,
          row: 0.5
        },
        ext: { width: 180, height: 54 }
      });
    } catch (imageError) {
      console.warn('Could not add image:', imageError);
    }


    const titleCell = worksheet.getCell('D1');
    titleCell.value = data.metadata.title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = {
      horizontal: data.language === 'ar' ? 'left' : 'right',
      vertical: 'middle',
      wrapText: true
    };

    // Set column widths
    // worksheet.columns = [
    //   { width: 15 }, // Account #
    //   { width: 10 }, // Account Helper
    //   { width: 20 }, // Account Name
    //   { width: 10 }, // Currency
    //   { width: 15 }, // Debit
    //   { width: 15 }, // Credit
    //   { width: 10 }, // Rate
    //   { width: 15 }, // Equivalent
    //   { width: 25 }  // Description
    // ];

    // Document info starting at row 5
    let currentRow = 7;

    // Add document info (3 rows)
    const addInfoRow = (label, value) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true };
      row.getCell(3).value = value;
      row.alignment = {
        horizontal: data.language === 'ar' ? 'right' : 'left'
      };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.mergeCells(`C${currentRow}:I${currentRow}`);
      currentRow++;
    };

    addInfoRow(data.language === 'ar' ? 'اسم الحساب' : 'Account Name', data.metadata.accountName);
    addInfoRow(data.language === 'ar' ? 'رقم المستند' : 'Document #', data.metadata.documentNumber + "");
    addInfoRow(data.language === 'ar' ? 'التاريخ' : 'Date', data.metadata.date);
    currentRow += 3; // Add 3 empty rows after info

    // Add error messages if any exist
    if (data.errors.length > 0) {
      data.errors.forEach(error => {
        const errorRow = worksheet.getRow(currentRow++);



        errorRow.getCell(1).value = ` !  ${error.msg}`;
        worksheet.mergeCells(`A${errorRow.number}:I${errorRow.number}`);

        // Style error row
        errorRow.font = { bold: true, color: { argb: 'FFFF0000' } };
        errorRow.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE0E0' }
          };
          cell.alignment = {
            horizontal: data.language === 'ar' ? 'right' : 'left',
            readingOrder: data.language === 'ar' ? 'rtl' : 'ltr' 
          };
        });
      });
      currentRow++; // Add empty row after errors
    }


    const headerRow = worksheet.getRow(currentRow++);
    headerRow.values = data.headers;

    // Style headers
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

    });


    // Process error highlights
    const debitcreditError = data.errors.find(error => error.id === 'debitcredit');
    const rateError = data.errors.find(error => error.id === 'rate');
    const debitCreditRowsArray = debitcreditError?.rows || [];
    const rateErrorRowsArray = rateError?.rows || [];

    // Add data rows with error highlighting
    data.rows.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);

      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' }
        };

        // Highlight debit/credit errors (adjust column numbers for RTL)
        const debitCol = 5;
        const creditCol = 6;
        const rateCol = 7;

        if (debitCreditRowsArray.includes(index) &&
          (colNumber === debitCol || colNumber === creditCol)) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE0E0' }
          };
        }

        // Highlight rate errors
        if (rateErrorRowsArray.includes(index) && colNumber === rateCol) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE0E0' }
          };
        }
      });
    });

    // Add totals row
    const totalsData = [
      '', '', '', '',
      data.totals.debit,
      data.totals.credit,
      '', '', ''
    ];

    const totalRow = worksheet.addRow(totalsData);

    // Style totals row
    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' }
      };

      // Highlight balance errors
      const debitCol = 5;
      const creditCol = 6;

      if (data.errors.some(error => error.id === 'balance') &&
        (colNumber === debitCol || colNumber === creditCol)) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE0E0' }
        };
      }
    });

    // Show save dialog
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Excel File',
      defaultPath: `${data.metadata.title.replace(/\s+/g, '_')}_${data.metadata.documentNumber}.xlsx`,
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Save canceled by user' };
    }

    // Save and open the file
    await workbook.xlsx.writeFile(filePath);
    shell.openPath(filePath);

    return { success: true, path: filePath };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: error.message };
  }
});

//IPC handler for ChartOfAccounts
ipcMain.handle('chartOfAccounts:getChartOfAccountsByAccountId', async (_, id) => {
  try {
    const filePathEN = path.join(chartOfAccountsPerAccount, `coaen_${id}.json`);
    const filePathAR = path.join(chartOfAccountsPerAccount, `coaar_${id}.json`);

    // Ensure files exist
    await fs.access(filePathEN);
    await fs.access(filePathAR);

    // Read contents
    const [enContent, arContent] = await Promise.all([
      fs.readFile(filePathEN, 'utf-8'),
      fs.readFile(filePathAR, 'utf-8')
    ]);

    return {
      en: JSON.parse(enContent),
      ar: JSON.parse(arContent)
    };
  } catch (error) {
    console.error(`Failed to read chart of accounts for account ID ${id}:`, error);
    return { error: `Chart of accounts not found for account ID ${id}` };
  }
})


//IPC handler for Files
ipcMain.handle('fs:readDirectory', async (event, dirPath) => {
  const absolutePath = path.resolve(dirPath);
  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  return entries.map(entry => ({
    name: entry.name,
    isDirectory: entry.isDirectory(),
    path: path.join(absolutePath, entry.name)
  }));
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

ipcMain.handle('fs:createFile', async (_, directoryPath, fileName, docType) => {
  const filePath = path.join(directoryPath, fileName);

  if (fsSync.existsSync(filePath)) {
    return { success: false, message: "File already exists! Change document name." };
  }

  const data = `{
    "doctype": "${docType}",
    "format": "json",
    "created_on": "${new Date().toLocaleString('en-UK', { day: '2-digit', month: '2-digit', year: 'numeric' })}",
    "data": []
  }`;

  try {
    await fs.writeFile(filePath, data, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Error creating file:', error);
    return { success: false, message: error.message || "Unknown error" };
  }
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