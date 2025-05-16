import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash, Check, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFileSystem } from '../../contexts/FileSystemContext';


const Editor: React.FC = () => {
  const { activeDoc, openDocuments, updateDocContent, saveDoc } = useFileSystem();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isBalanced, setIsBalanced] = useState(true);

  const [docContent, setDocContent] = useState<any>(null);
  const [docTypeNameEn, setDocTypeNameEn] = useState("");
  const [docTypeNameAr, setDocTypeNameAr] = useState("");
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
        <div className="font-bold text-xs flex gap-5 text-gray-900 dark:text-blue-400">
          <div><span className="text-blue-600 dark:text-white">{docTypeNameEn}</span></div>
          <div>Document # <span className="text-blue-600 dark:text-white">{docContent.docNumber}</span></div>
          <div>Date <span className="text-blue-600 dark:text-white">{docContent.created_on}</span></div>
        </div>

        <motion.button
          className="flex items-center px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-75 disabled:hover:bg-blue-500 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving || !currentDoc.isDirty}
          whileTap={{ scale: 0.95 }}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zM6 17.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : isSaved ? (
            <>
              <Check size={16} className="mr-1" />
              Saved
            </>
          ) : (
            <>
              <Save size={16} className="mr-1" />
              Save
            </>
          )}
        </motion.button>
      </div>

      {/* Table Editor */}
      <div className="p-2 overflow-auto">
        {!isBalanced && (
          <div className="flex items-center p-1.5 justify-between rounded-lg overflow-hidden font-medium mb-2 bg-red-500 bg-opacity-20 text-red-500">
            <div className="relative flex items-center gap-2 pl-[15px] text-sm before:absolute before:top-0 before:left-0 before:w-[5px] before:h-[100%] before:bg-red-600 before:rounded-lg">
              <AlertTriangle size={18} strokeWidth={2.5} />
              Debit and Credit totals do not match.
            </div>
            <X size={18} className="font-bold cursor-pointer" strokeWidth={3.5} onClick={() => setIsBalanced(true)} />

          </div>

        )}

        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-900 dark:text-blue-400 bg-gray-100 dark:bg-gray-800">
              <th className="p-2 rounded-tl-lg rounded-bl-lg"></th>
              <th className="p-2">Acc #</th>
              <th className="p-2">Acc Name</th>
              <th className="p-2">Currency</th>
              <th className="p-2">Debit</th>
              <th className="p-2">Credit</th>
              <th className="p-2">Rate</th>
              <th className="p-2 rounded-tr-lg rounded-br-lg">Description</th>
            </tr>
          </thead>
          <tbody>
            {docContent.data.map((row: any, rowIndex: number) => {
              const isLast = rowIndex === docContent.data.length - 1;
              return (
                <tr key={rowIndex}
                  className={`border-b border-gray-200 dark:border-gray-800 relative ${isLast ? 'border-none' : ''}`}>
                  <td className="px-1 py-2 pl-0">
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
                        Are you sure?
                        <motion.button
                          className="px-2 py-0.25 rounded-lg bg-green-400 text-green-800"
                          onClick={() => confirmRemoveRow(rowIndex)}
                          whileTap={{ scale: 0.95 }}
                        >
                          Yes
                        </motion.button>
                        <motion.button
                          className="px-2 py-0.25 rounded-lg bg-red-500 text-red-800"
                          onClick={() => cancelRemoveRow()}
                          whileTap={{ scale: 0.95 }}
                        >
                          No
                        </motion.button>

                      </div>
                    </div>
                  </td>
                  {Object.entries(row).map(([key, value], cellIndex) => (
                    <td key={cellIndex} className="px-1 py-2 last:pr-0">
                      {key === "currency" ? (
                        <select
                          className="bg-gray-100 dark:bg-gray-800 rounded-lg border-none w-full py-1 px-2 outline-none"
                          value={value ?? ""}
                          onChange={(e) => handleTableInputChange(rowIndex, key, e.target.value)}
                        >
                          <option value="">-</option>
                          <option value="LBP">LBP</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      ) : (
                        <input
                          className="bg-gray-100 dark:bg-gray-800 rounded-lg border-none w-full py-1 px-2 outline-none"
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
              <td colSpan="4" className="px-1 py-1 rounded-tl-lg rounded-bl-lg">
                <motion.button
                  className="flex items-center gap-[5px] bg-gray-100 dark:bg-gray-900 rounded-lg border-none py-1 px-2 outline-none text-xs"
                  onClick={handleAddRow}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={12} />
                  Add row
                </motion.button>
              </td>
              <td className="px-1 p y-1">
                <div className='bg-gray-100 dark:bg-gray-900 rounded-lg border-none w-full py-1 px-2 outline-none'>
                  {calculateTotal("debit").toFixed(2)}
                </div>
              </td>
              <td className="px-1 p y-1">
                <div className='bg-gray-100 dark:bg-gray-900 rounded-lg border-none w-full py-1 px-2 outline-none'>
                  {calculateTotal("credit").toFixed(2)}
                </div>
              </td>
              <td colSpan="2" className='rounded-tr-lg rounded-br-lg'></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div >
  );
};

export default Editor;
