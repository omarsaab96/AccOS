import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFileSystem } from '../../contexts/FileSystemContext';

const FileTabs: React.FC = () => {
  const { openDocuments, activeDoc, setActiveDoc, closeDoc } = useFileSystem();
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Disable browser's auto-scroll on middle-click
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;

    const preventMiddleClickScroll = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    el.addEventListener('mousedown', preventMiddleClickScroll, { passive: false });

    return () => {
      el.removeEventListener('mousedown', preventMiddleClickScroll);
    };
  }, []);

  // Get file name from path
  const getFileName = (path: string) => {
    const parts = path.split(/[\/\\]/);
    return parts[parts.length - 1];
  };

  // Handle middle-click (mouse wheel click) event to close tab
  const handleMiddleClick = (e: React.MouseEvent, docId: number) => {
    if (e.button === 1) { // 1 indicates the middle mouse button
      e.preventDefault(); // Prevent scroll behavior
      closeDoc(docId);
    }
  };

  return (
    <div
      ref={tabsContainerRef}
      className="border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 overflow-x-auto whitespace-nowrap p-2 flex">
      {openDocuments.map((doc) => {
        const isActive = activeDoc === doc.id;
        const fileName = doc.name;

        return (
          <motion.div
            key={doc.id}
            className={`
              inline-flex items-center pl-[10px] pr-[30px] pt-[2px] pb-[6px] text-sm rounded-md mr-1 leading-1 cursor-pointer select-none relative
              ${isActive
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                : 'bg-gray-200 dark:bg-gray-750 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-650'}
              ${doc.isDirty ? 'italic' : ''}
            `}
            onClick={() => setActiveDoc(doc.id)}
            onAuxClick={(e) => handleMiddleClick(e, doc.id)} // Middle-click handler
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span title={doc.name} className="max-w-xs truncate">{fileName}</span>
            {doc.isDirty && (
              <span className="ml-1.5 text-gray-500 dark:text-gray-400 text-xs">●</span>
            )}
            <button
              className="absolute top-[50%] -translate-y-[50%] right-[10px] w-[15px] h-[15px] outline-none text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                closeDoc(doc.id);
              }}
            >
              <X size={15} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FileTabs;