import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFileSystem } from '../../contexts/FileSystemContext';

const FileTabs: React.FC = () => {
  const { openFiles, activeFile, setActiveFile, closeFile } = useFileSystem();
  
  // Get file name from path
  const getFileName = (path: string) => {
    const parts = path.split(/[\/\\]/);
    return parts[parts.length - 1];
  };
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 overflow-x-auto whitespace-nowrap px-1 py-1 flex">
      {openFiles.map((file) => {
        const isActive = activeFile === file.path;
        const fileName = getFileName(file.path);
        
        return (
          <motion.div
            key={file.path}
            className={`
              inline-flex items-center px-3 py-1.5 text-sm rounded-md mr-1 cursor-pointer select-none
              ${isActive 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-200 dark:bg-gray-750 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-650'}
              ${file.isDirty ? 'italic' : ''}
            `}
            onClick={() => setActiveFile(file.path)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span title={file.path} className="max-w-xs truncate">{fileName}</span>
            {file.isDirty && (
              <span className="ml-1.5 text-gray-500 dark:text-gray-400 text-xs">●</span>
            )}
            <button
              className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
            >
              <X size={14} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FileTabs;