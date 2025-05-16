import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

type Props = { onOpenCreateDocModal: () => void; };


const Sidebar: React.FC<Props> = ({ onOpenCreateDocModal }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { documentsList, refreshDocuments, openDocument } = useFileSystem();

  const [expanded, setExpanded] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && Object.keys(documentsList).length > 0) {
      const defaultExpanded: Record<string, boolean> = {};
      Object.keys(documentsList).forEach((docType) => {
        defaultExpanded[docType] = true;
      });
      setExpanded(defaultExpanded);
      setHasInitialized(true);
    }
  }, [documentsList, hasInitialized]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03, // time between items
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: language === 'ar' ? 10 : -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sidebar Header with Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-bold text-sm">{t('Sidebar.title')}</h2>

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
        <div className="">
          {documentsList.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              {t('Sidebar.noDocuments')}
            </div>
          ) : (

            Object.entries(documentsList).map(([docType, docs]) => (
              <div key={docType} className='border-b dark:border-gray-800'>
                <div
                  className='px-4 p-2 flex items-baseline justify-between gap-3 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 font-medium'
                  onClick={() =>
                    setExpanded(prev => ({
                      ...prev,
                      [docType]: !prev[docType],
                    }))
                  }
                >
                  <div className="flex items-center gap-[10px]">
                    {t('Doctypes.'+docType.replace(" ",""))} <span className='text-blue-600 dark:text-blue-500 font-normal text-sm'>{docs.length}</span>
                  </div>

                  {expanded[docType] == true ? (
                    <ChevronUp size={15} className="translate-y-[2px]" />
                  ) : (
                    <ChevronDown size={15} className="translate-y-[2px]" />
                  )}

                </div>

                {expanded[docType] && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="outline-none last:mb-5"
                  >
                    {docs.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="hover:bg-gray-200 dark:hover:bg-gray-800 outline-none"
                      >
                        <motion.div
                          variants={itemVariants}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-1 text-sm cursor-pointer flex items-center outline-none gap-2"
                          onClick={() => openDocument(item.id)}
                        >
                          <FileText size={14} className="flex-shrink-0 text-gray-500 dark:text-gray-400" />
                          <span className="truncate">{item.name}</span>
                        </motion.div>
                      </div>
                    ))}

                  </motion.div>
                )}
              </div>
            ))


          )}
        </div>
      </div>
    </div >
  );
};

export default Sidebar;