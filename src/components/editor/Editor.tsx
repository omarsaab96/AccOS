import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFileSystem } from '../../contexts/FileSystemContext';

const Editor: React.FC = () => {
  const { activeDoc, openDocuments, updateDocContent, saveDoc } = useFileSystem();
  const [isSaving, setIsSaving] = useState(false);
  const [docContent, setDocContent] = useState<any>(null);

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
    }
  }, [activeDoc, currentDoc]);

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

  const handleSave = async () => {
    if (activeDoc!=null && docContent!=null) {
      setIsSaving(true);
      await saveDoc(activeDoc, docContent.data);
      setIsSaving(false);
    }
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
          <div><span className="text-blue-600 dark:text-white">{docContent.docTypeNameEn}</span></div>
          <div>Document # <span className="text-blue-600 dark:text-white">1</span></div>
          <div>Date <span className="text-blue-600 dark:text-white">{docContent.created_on}</span></div>
        </div>

        <motion.button
          className="flex items-center px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving || !currentDoc.isDirty}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zM6 17.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
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
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-900 dark:text-blue-400 bg-gray-100 dark:bg-gray-800">
              <th className="p-2 rounded-tl-lg rounded-bl-lg">Acc #</th>
              <th className="p-2">Acc Name</th>
              <th className="p-2">Currency</th>
              <th className="p-2">Debit</th>
              <th className="p-2">Credit</th>
              <th className="p-2">Rate</th>
              <th className="p-2 rounded-tr-lg rounded-br-lg">Description</th>
            </tr>
          </thead>
          <tbody>
            {docContent.data.map((row: any, rowIndex: number) => (
              <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-800 ">
                {Object.entries(row).map(([key, value], cellIndex) => (
                  <td key={cellIndex} className="px-1 py-2 first:pl-0 last:pr-0">
                    <input
                      className="bg-gray-100 dark:bg-gray-800 rounded-lg border-none w-full py-1 px-2 outline-none"
                      type="text"
                      value={value ?? '-'}
                      onChange={(e) => handleTableInputChange(rowIndex, key, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Editor;
