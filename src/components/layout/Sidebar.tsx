import React from 'react';
import { FileText, RefreshCw, Plus } from 'lucide-react';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { motion } from 'framer-motion';

type Props = { onOpenCreateDocModal: () => void; };


const Sidebar: React.FC<Props> = ({ onOpenCreateDocModal }) => {
  const { documentsList, refreshDocuments, openDocument } = useFileSystem();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sidebar Header with Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-medium text-sm">Documents</h2>

        <div className="flex space-x-1">
          <button
            onClick={() => refreshDocuments()}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => onOpenCreateDocModal()}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            title="Refresh"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {documentsList.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              No Documents found
            </div>
          ) : (
            documentsList.map((item, index) => (
              <motion.div
                key={item.id || index}
                className="px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer flex items-center"
                onClick={() => openDocument(item.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FileText size={14} className="mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="truncate">{item.name}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;