import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash, Check, AlertTriangle, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAccounts } from '../../contexts/AccountsContext';
import Swal from 'sweetalert2';
import { ipcRenderer } from 'electron';


const Editor: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { activeDoc, openDocuments, updateDocContent, saveDoc } = useFileSystem();
  const { activeAccount } = useAccounts();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isBalanced, setIsBalanced] = useState(true);

  const [docContent, setDocContent] = useState<any>(null);
  const [docTypeNameEn, setDocTypeNameEn] = useState("");
  const [docTypeNameAr, setDocTypeNameAr] = useState("");
  const [invalidRows, setInvalidRows] = useState<number[]>([]);
  const [rowRemove, setRowRemove] = useState(-1);

  const currentDoc = openDocuments.find(doc => doc.id === activeDoc);

  useEffect(() => {
    if (currentDoc) {
      try {
        const parsed =
          typeof currentDoc.data === 'string'
            ? JSON.parse(currentDoc.data)
            : currentDoc.data;
        setDocContent({ ...currentDoc, data: parsed });
      } catch (e) {
        console.error('Failed to parse document data:', e);
      }

      getDocTypeNames(currentDoc.docType);
    }
  }, [activeDoc, currentDoc]);

  //save keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDoc, docContent]);

  useEffect(() => {
    if (!docContent?.data) return;

    const totalDebit = calculateTotal("debit");
    const totalCredit = calculateTotal("credit");
    setIsBalanced(Math.abs(totalDebit - totalCredit) < 0.01);

    // Find all rows with both debit and credit filled
    const conflicts = docContent.data.reduce((acc: number[], row: any, index: number) => {
      if (row.debit && row.credit) acc.push(index);
      return acc;
    }, []);

    setInvalidRows(conflicts);

  }, [docContent?.data]);

  const getDocTypeNames = async (id: number) => {
    const result = await window.electron.doctypes.getDocTypeName(id)
    setDocTypeNameEn(result.nameEn);
    setDocTypeNameAr(result.nameAr);
  }

  const handleTableInputChange = (
    rowIndex: number,
    key: string,
    value: string
  ) => {
    if (!docContent) return;

    const updatedData = [...docContent.data];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [key]: value };

    const updatedDoc = { ...docContent, data: updatedData };
    setDocContent(updatedDoc);

    updateDocContent(activeDoc!, updatedDoc.data);
  };

  const handleAddRow = () => {
    if (!docContent) return;

    const newRow = {
      accountNumber: "",
      accountName: "",
      currency: "",
      debit: "",
      credit: "",
      rate: "",
      description: ""
    };

    const updatedData = [...docContent.data, newRow];
    const updatedDoc = { ...docContent, data: updatedData };

    setDocContent(updatedDoc);
    updateDocContent(activeDoc!, updatedDoc.data);
  }

  const handleSave = async () => {
    const isDarkMode = true

    if (!isBalanced || invalidRows.length != 0) {
      Swal.fire({
        title: t('Editor.popup.errorTitle'),
        text: t('Editor.popup.errorSubtitle'),
        icon: 'error',
        showConfirmButton: false,
        // confirmButtonText: t('Editor.popup.ctas.ok'),
        background: isDarkMode ? '#1f2937' : undefined, // Tailwind gray-800
        color: isDarkMode ? '#f9fafb' : undefined,      // Tailwind gray-50
        timer: 3000,
        timerProgressBar: true,
        // 🔥 Remove default styling
        buttonsStyling: false,

        // 🎨 Custom button classes
        customClass: {
          popup: 'rounded-xl shadow-xl',
          icon: 'text-xs',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md outline-none ltr:mr-[10px] rtl:ml-[10px]',
        },
        didOpen: () => {
          // Target the progress bar
          const progressBar = document.querySelector('.swal2-timer-progress-bar');
          if (progressBar) {
            progressBar.style.backgroundColor = '#3b82f6';
            // progressBar.style.height = '6px';
            progressBar.style.borderRadius = '4px';
          }
        }
      });
      return;
    }
    if (activeDoc != null && docContent != null) {
      setIsSaving(true);
      const response = await saveDoc(activeDoc, docContent.data);

      if (response) {
        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => {
          setIsSaved(false);
        }, 2000);
      } else {
        setIsSaved(false);
        setIsSaving(false);
      }

    }
  };

  const generatePDF = async () => {
    setIsPrinting(true);

    let errors = ``;

    if (!isBalanced) {
      errors += `
        <div class="error">
          <div style="">
            &#9888;
            ${t('Editor.errors.balance')}
          </div>
        </div>`;
    }

    if (invalidRows.length != 0) {
      errors += `<div class="error">
          <div>
            &#9888;
            ${t('Editor.errors.debitCredit')}
          </div>
        </div>` ;
    }

    errors += `<br>`;

    let header = `
    <table width="100%">
      <tr>
        <td style="vertical-align: middle;">
          <img src="http://localhost:5173/logo.png" alt="Logo" width="200" />
        </td>
        <td class="docinfo">
          <h2 style="margin: 0;">${language == 'ar' ? docTypeNameAr : docTypeNameEn}</h2>
        </td>
      </tr>

      <tr>
        <td colspan="2" style="height:50px;">
        </td>
      </tr>
      
      <tr>
        <td colspan="2">
          <b>${t('Editor.pdf.accountName')}</b>
           <span>${activeAccount.name}</span>
          <br>
          <b>${t('Editor.pdf.documentNumber')}</b>
          <span>${docContent.docNumber}</span>
         <br>
          <b>${t('Editor.pdf.date')}</b>
          <span>${docContent.created_on}</span>
        </td>
        
      </tr>
    </table>
    <br><br>
    `;

    let table = `
      <table class="table" width="100%">
        <thead>
          <tr>
            <th>${t('Editor.table.th.accountNumber')}</th>
            <th>${t('Editor.table.th.accountName')}</th>
            <th>${t('Editor.table.th.currency')}</th>
            <th>${t('Editor.table.th.debit')}</th>
            <th>${t('Editor.table.th.credit')}</th>
            <th>${t('Editor.table.th.rate')}</th>
            <th>${t('Editor.table.th.description')}</th>
          </tr>
        </thead>
        
        <tbody>
          ${docContent.data.map((row: any, rowIndex: number) =>
      `<tr>${Object.entries(row).map(([key, value], cellIndex) =>
        `<td class=${(invalidRows.includes(rowIndex) && (key === "debit" || key === "credit")) ? 'highlight' : ''}>${value}</td>`
      ).join('')
      }</tr>`
    ).join('')}

          <tr>
            <td colspan="3"></td>
            
            <td class=${!isBalanced ? 'highlight' : ''}>
              <div>
                ${calculateTotal("debit").toFixed(2)}
              </div>
            </td>
            
            <td class="px-1 p y-1 ${!isBalanced ? 'highlight' : ''}">
              <div>
                ${calculateTotal("credit").toFixed(2)}
              </div>
            </td>

            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>`;

    let rawhtml = `
      <style>

        ${language == 'ar' ? `
          *{
            direction: rtl;
            text-align: right;
          }
            body{
            font-family: "Rubik", sans-serif;
          }
          `: `
          body{
            font-family: "Roboto", sans-serif;
          }
          `}

        table, th, td {
          border-collapse:collapse;
        }

        table tr td.docinfo{
          vertical-align: middle;
        }
          
        table tr td.docinfo h2{
          ${language == 'ar' ? 'text-align:left;' : 'text-align:right;'}
        }
        
        .table tr th{
          background-color: #f3f4f6;
          color: #111827;
          font-weight:600;
          padding:10px;
          ${language == 'ar' ? 'text-align:right;' : 'text-align:left;'}
          
        }

        .table tr th:first-child{
          border-radius: 5px 0 0 5px;
        }

        .table tr th:last-child{
          border-radius: 0 5px 5px 0;
        }

        .table tr td{
          padding:10px;
          border-bottom:1px solid #e5e7eb;
        }

        .table tr td.highlight{
          background-color:#fcdada;
        }

        .error{
          padding:5px;
          border-radius:5px;
          font-weight:600;
          background-color:#fcdada;
          color:#ef4444;
          margin-bottom:10px;
          border-left:4px solid #ef4444;
        } 
      </style>
      ${header}
      ${errors}
      ${table}
    `;

    window.electron.documents.generatePDF(rawhtml);

    setTimeout(() => {
      setIsPrinting(false);
    }, 2000)
  };

  const handlePrint = async () => {
    setIsPrinting(true);

    let errors = ``;

    if (!isBalanced) {
      errors += `
        <div class="error">
          <div style="">
            &#9888;
            ${t('Editor.errors.balance')}
          </div>
        </div>`;
    }

    if (invalidRows.length != 0) {
      errors += `<div class="error">
          <div>
            &#9888;
            ${t('Editor.errors.debitCredit')}
          </div>
        </div>` ;
    }

    errors += `<br>`;

    let header = `
    <table width="100%">
      <tr>
        <td style="vertical-align: middle;">
          <img src="http://localhost:5173/logo.png" alt="Logo" width="200" />
        </td>
        <td class="docinfo">
          <h2 style="margin: 0;">${language == 'ar' ? docTypeNameAr : docTypeNameEn}</h2>
        </td>
      </tr>

      <tr>
        <td colspan="2" style="height:50px;">
        </td>
      </tr>
      
      <tr>
        <td colspan="2">
          <b>${t('Editor.pdf.accountName')}</b>
           <span>${activeAccount.name}</span>
          <br>
          <b>${t('Editor.pdf.documentNumber')}</b>
          <span>${docContent.docNumber}</span>
         <br>
          <b>${t('Editor.pdf.date')}</b>
          <span>${docContent.created_on}</span>
        </td>
        
      </tr>
    </table>
    <br><br>
    `;

    let table = `
      <table class="table" width="100%">
        <thead>
          <tr>
            <th>${t('Editor.table.th.accountNumber')}</th>
            <th>${t('Editor.table.th.accountName')}</th>
            <th>${t('Editor.table.th.currency')}</th>
            <th>${t('Editor.table.th.debit')}</th>
            <th>${t('Editor.table.th.credit')}</th>
            <th>${t('Editor.table.th.rate')}</th>
            <th>${t('Editor.table.th.description')}</th>
          </tr>
        </thead>
        
        <tbody>
          ${docContent.data.map((row: any, rowIndex: number) =>
      `<tr>${Object.entries(row).map(([key, value], cellIndex) =>
        `<td class=${(invalidRows.includes(rowIndex) && (key === "debit" || key === "credit")) ? 'highlight' : ''}>${value}</td>`
      ).join('')
      }</tr>`
    ).join('')}

          <tr>
            <td colspan="3"></td>
            
            <td class=${!isBalanced ? 'highlight' : ''}>
              <div>
                ${calculateTotal("debit").toFixed(2)}
              </div>
            </td>
            
            <td class="px-1 p y-1 ${!isBalanced ? 'highlight' : ''}">
              <div>
                ${calculateTotal("credit").toFixed(2)}
              </div>
            </td>

            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>`;

    let rawhtml = `
      <style>

        ${language == 'ar' ? `
          *{
            direction: rtl;
            text-align: right;
          }
            body{
            font-family: "Rubik", sans-serif;
          }
          `: `
          body{
            font-family: "Roboto", sans-serif;
          }
          `}

        table, th, td {
          border-collapse:collapse;
        }

        table tr td.docinfo{
          vertical-align: middle;
        }
          
        table tr td.docinfo h2{
          ${language == 'ar' ? 'text-align:left;' : 'text-align:right;'}
        }
        
        .table tr th{
          background-color: #f3f4f6;
          color: #111827;
          font-weight:600;
          padding:10px;
          ${language == 'ar' ? 'text-align:right;' : 'text-align:left;'}
          
        }

        .table tr th:first-child{
          border-radius: 5px 0 0 5px;
        }

        .table tr th:last-child{
          border-radius: 0 5px 5px 0;
        }

        .table tr td{
          padding:10px;
          border-bottom:1px solid #e5e7eb;
        }

        .table tr td.highlight{
          background-color:#fcdada;
        }

        .error{
          padding:5px;
          border-radius:5px;
          font-weight:600;
          background-color:#fcdada;
          color:#ef4444;
          margin-bottom:10px;
          border-left:4px solid #ef4444;
        } 
      </style>
      ${header}
      ${errors}
      ${table}
    `;

    try {
      const result = await window.electron.documents.printPDF(rawhtml);

      if (!result.success) {
        throw new Error(result.error || 'Printing failed');
      }
    } catch (error) {
      console.error('Print error:', error);
      // Show error to user
      Swal.fire({
        title: t('Print failed'),
        text: error.message,
        icon: 'error',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const removeRow = (index: number) => {
    setRowRemove(index)
  }

  const confirmRemoveRow = (index: number) => {
    if (!docContent) return;

    const updatedData = docContent.data.filter((_: any, i: number) => i !== index);
    const updatedDoc = { ...docContent, data: updatedData };

    setDocContent(updatedDoc);
    updateDocContent(activeDoc!, updatedData);
    setRowRemove(-1);
  };

  const cancelRemoveRow = () => {
    setRowRemove(-1)
  }

  const calculateTotal = (key: string) => {
    return docContent?.data?.reduce((sum: number, row: any) => {
      const value = parseFloat(row[key]);
      const rate = parseFloat(row.rate);

      // If currency is already USD, use 1 as rate
      const effectiveRate = row.currency === "USD" || isNaN(rate) ? 1 : rate;

      const usdValue = isNaN(value) ? 0 : value / effectiveRate;
      return sum + usdValue;
    }, 0);
  };

  if (activeDoc == null || !currentDoc || !docContent) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No doc selected
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="printable font-bold text-xs flex gap-5 text-gray-900 dark:text-blue-400">
          <div><span className="text-blue-600 dark:text-white">{language == 'ar' ? docTypeNameAr : docTypeNameEn}</span></div>
          <div className='flex items-center'>{t('Editor.header.documentNumber')}&nbsp;<span className="text-blue-600 dark:text-white">{docContent.docNumber}</span></div>
          <div className='flex items-center'>{t('Editor.header.date')}&nbsp;<span className="text-blue-600 dark:text-white">{docContent.created_on}</span></div>
        </div>

        <div className='flex gap-2 items-center'>
          <motion.button
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-75 disabled:hover:bg-blue-500 disabled:cursor-not-allowed"
            onClick={handlePrint}
            disabled={isPrinting}
            whileTap={{ scale: 0.95 }}
          >
            {isPrinting ? (
              <>
                <svg className="animate-spin ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zM6 17.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('Editor.ctas.printing')}
              </>
            ) : (
              <>
                <Printer size={16} />
                {t('Editor.ctas.print')}
              </>
            )}
          </motion.button>

          <motion.button
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-75 disabled:hover:bg-blue-500 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isSaving || !currentDoc.isDirty}
            whileTap={{ scale: 0.95 }}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zM6 17.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('Editor.ctas.saving')}
              </>
            ) : isSaved ? (
              <>
                <Check size={16} />
                {t('Editor.ctas.saved')}
              </>
            ) : (
              <>
                <Save size={16} />
                {t('Editor.ctas.save')}
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Table Editor */}
      <div className="printable p-2 overflow-auto">

        {!isBalanced && (
          <motion.div className="flex items-center p-1.5 justify-between rounded-lg overflow-hidden font-medium mb-2 bg-red-500 bg-opacity-20 text-red-500"
            initial={{ opacity: 0, x: language === 'ar' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative flex items-center gap-2 ltr:pl-[15px] rtl:pr-[15px] text-sm before:absolute before:top-0 ltr:before:left-0 rtl:before:right-0 before:w-[5px] before:h-[100%] before:bg-red-600 before:rounded-lg">
              <AlertTriangle size={18} strokeWidth={2.5} />
              {t('Editor.errors.balance')}
            </div>
            {/* <X size={18} className="font-bold cursor-pointer" strokeWidth={3.5} onClick={() => setIsBalanced(true)} /> */}
          </motion.div>
        )}

        {invalidRows.length != 0 && (
          <motion.div className="flex items-center p-1.5 justify-between rounded-lg overflow-hidden font-medium mb-2 bg-red-500 bg-opacity-20 text-red-500"
            initial={{ opacity: 0, x: language === 'ar' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative flex items-center gap-2 ltr:pl-[15px] rtl:pr-[15px] text-sm before:absolute before:top-0 ltr:before:left-0 rtl:before:right-0 before:w-[5px] before:h-[100%] before:bg-red-600 before:rounded-lg">
              <AlertTriangle size={18} strokeWidth={2.5} />
              {t('Editor.errors.debitCredit')}
            </div>
            {/* <X size={18} className="font-bold cursor-pointer" strokeWidth={3.5} onClick={() => setIsBalanced(true)} /> */}
          </motion.div>
        )}

        <table className="w-full text-sm ltr:text-left rtl:text-right">
          <thead>
            <tr className="text-gray-900 dark:text-blue-400 bg-gray-100 dark:bg-gray-800">
              <th className="notPrintable p-2 ltr:rounded-tl-lg ltr:rounded-bl-lg rtl:rounded-tr-lg rtl:rounded-br-lg "></th>
              <th className="p-2">{t('Editor.table.th.accountNumber')}</th>
              <th className="p-2">{t('Editor.table.th.accountName')}</th>
              <th className="p-2">{t('Editor.table.th.currency')}</th>
              <th className="p-2">{t('Editor.table.th.debit')}</th>
              <th className="p-2">{t('Editor.table.th.credit')}</th>
              <th className="p-2">{t('Editor.table.th.rate')}</th>
              <th className="p-2 ltr:rounded-tr-lg ltr:rounded-br-lg rtl:rounded-tl-lg rtl:rounded-bl-lg">{t('Editor.table.th.description')}</th>
            </tr>
          </thead>

          <tbody>
            {docContent.data.map((row: any, rowIndex: number) => {
              const isLast = rowIndex === docContent.data.length - 1;
              return (
                <tr key={rowIndex}
                  className={`border-b border-gray-200 dark:border-gray-800 relative ${isLast ? 'border-none' : ''}`}>
                  <td className="notPrintable px-1 py-2 ltr:pl-0 rtl:pr-0">
                    <motion.button
                      className="bg-gray-100 dark:bg-gray-800 rounded-lg border-none py-2 px-2 outline-none"
                      onClick={() => removeRow(rowIndex)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash size={12} className='opacity-50' />
                    </motion.button>

                    <div className={`absolute top-0 left-0 h-full px-1 py-2 rounded-lg transition-all w-full origin-left ${rowRemove == rowIndex ? ' scale-100 opacity-100 visible' : ' scale-0 opacity-0 invisible'}`}>
                      <div className='h-full bg-red-600 bg-opacity-50 backdrop-blur-sm flex justify-center items-center gap-2 rounded-lg text-center font-bold'>
                        <Trash size={14} />
                        {t('Editor.removeRow.title')}
                        <motion.button
                          className="px-2 py-0.25 rounded-lg bg-green-400 text-green-800"
                          onClick={() => confirmRemoveRow(rowIndex)}
                          whileTap={{ scale: 0.95 }}
                        >
                          {t('Editor.removeRow.yes')}
                        </motion.button>
                        <motion.button
                          className="px-2 py-0.25 rounded-lg bg-red-500 text-red-800"
                          onClick={() => cancelRemoveRow()}
                          whileTap={{ scale: 0.95 }}
                        >
                          {t('Editor.removeRow.no')}
                        </motion.button>

                      </div>
                    </div>
                  </td>

                  {Object.entries(row).map(([key, value], cellIndex) => (
                    <td key={cellIndex} className="px-1 py-2 ltr:last:pr-0 rtl:last:pl-0">
                      {key === "currency" ? (
                        <select
                          id="currencySelect"
                          className="bg-gray-100 dark:bg-gray-800 rounded-lg border-none w-full py-1 px-2 outline-none"
                          value={value ?? ""}
                          onChange={(e) => handleTableInputChange(rowIndex, key, e.target.value)}
                        >
                          <option value="LBP">LBP</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      ) : (
                        <input
                          className={`bg-gray-100 dark:bg-gray-800 rounded-lg border-none w-full py-1 px-2 outline-none ${(invalidRows.includes(rowIndex) && (key === "debit" || key === "credit")) ? 'bg-red-500/40 dark:bg-red-500/20 bg-opacity-50' : ''}`}
                          type="text"
                          value={value ?? ""}
                          onChange={(e) => handleTableInputChange(rowIndex, key, e.target.value)}
                        />
                      )}
                    </td>
                  ))}

                </tr>
              );
            })}

            <tr className="bg-gray-100 dark:bg-gray-800">
              <td colSpan="4" className="px-1 py-1 ltr:rounded-tl-lg ltr:rounded-bl-lg rtl:rounded-tr-lg rtl:rounded-br-lg">
                <motion.button
                  className="notPrintable flex items-center gap-[5px] bg-gray-100 dark:bg-gray-900 rounded-lg border-none py-1 px-2 outline-none text-xs"
                  onClick={handleAddRow}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={12} />
                  {t('Editor.ctas.addRow')}
                </motion.button>
              </td>

              <td className="px-1 p y-1">
                <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg border-none w-full py-1 px-2 outline-none ${!isBalanced ? 'bg-red-500/40 dark:bg-red-600/20 bg-opacity-50' : ''}`}>
                  {calculateTotal("debit").toFixed(2)}
                </div>
              </td>
              <td className="px-1 p y-1">
                <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg border-none w-full py-1 px-2 outline-none ${!isBalanced ? 'bg-red-500/40 dark:bg-red-600/20 bg-opacity-50' : ''}`}>
                  {calculateTotal("credit").toFixed(2)}
                </div>
              </td>
              <td colSpan="2" className='ltr:rounded-tr-lg ltr:rounded-br-lg rtl:rounded-tl-lg rtl:rounded-bl-lg'></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div >
  );
};

export default Editor;
