import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Plus, ChevronDown, ChevronUp, Table, File } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAccounts } from '../../contexts/AccountsContext';
import { useTheme } from '../../contexts/ThemeContext';
import Select from 'react-select';


type Props = {
  onOpenCreateDocModal: () => void;
  onOpenCreateAccountModal: () => void;
  onOpenChartOfAccountsTab: () => void;
  onOpenDocumentsTab: () => void;
};


const Sidebar: React.FC<Props> = ({ onOpenCreateDocModal, onOpenCreateAccountModal, onOpenChartOfAccountsTab, onOpenDocumentsTab }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { documentsList, refreshDocuments, openDocument } = useFileSystem();
  const { refreshAccounts, activeAccount, setActiveAccount, accountsList } = useAccounts();

  const [expanded, setExpanded] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showChartOfAccounts, setShowChartOfAccounts] = useState(false);


  const menuList = [
    { 'icon': <Table size={16} />, 'label': t('Sidebar.menu.chartOfAccounts'), 'link': onOpenChartOfAccountsTab },
    { 'icon': <File size={16} />, 'label': t('Sidebar.menu.documents'), 'link': onOpenDocumentsTab }
  ]

  useEffect(() => {
    if (!hasInitialized && Object.keys(documentsList).length > 0) {
      const defaultExpanded: Record<string, boolean> = {};
      Object.keys(documentsList).forEach((docType) => {
        defaultExpanded[docType] = false;
      });
      setExpanded(defaultExpanded);
      setHasInitialized(true);
    }
  }, [documentsList, hasInitialized]);

  useEffect(() => {
    refreshDocuments()
  }, [activeAccount]);

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
      {/* Accounts */}
      {accountsList.length > 0 && (
        <div className="p-4 ltr:pr-2 rtl:pl-2 border-b border-gray-200 dark:border-gray-800">
          <div className='flex items-center justify-between mb-2'>
            <h2 className="font-bold text-sm">{t('Sidebar.accounts.title')}</h2>

            <div className="flex gap-1">
              <button
                onClick={() => refreshAccounts()}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={() => onOpenCreateAccountModal()}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                title="Refresh"
              >
                <Plus size={16} />
              </button>
            </div>

          </div>

          <div className='ltr:pr-2 rtl:pl-2'>
            <Select
              options={accountsList.map(acc => ({
                value: acc.id,
                label: acc.name,
              }))}
              value={
                activeAccount
                  ? { value: activeAccount.id, label: activeAccount.name }
                  : null
              }
              onChange={selected => {
                const selectedAccount = accountsList.find(acc => acc.id === selected?.value);
                if (selectedAccount) {
                  setActiveAccount(selectedAccount);
                }
              }}
              placeholder={t('Sidebar.accounts.selectAccount')}
              isSearchable
              className="text-sm"
              styles={{
                control: (base: any) => ({
                  ...base,
                  backgroundColor: theme == 'dark' ? '#1f2937' : 'white', // gray-800 or white
                  borderColor: theme == 'dark' ? '#374151' : '#d1d5db',   // gray-700 or gray-300
                  borderRadius: '0.375rem',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: theme == 'dark' ? '#4b5563' : '#9ca3af', // gray-600 or gray-400
                  },
                  cursor: 'pointer'
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  backgroundColor: theme == 'dark' ? '#1f2937' : 'white', // gray-800 or white
                  margin: 0,
                  padding: 0
                }),
                singleValue: (base: any) => ({
                  ...base,
                  color: theme === 'dark' ? '#ffffff' : '#111827', // This controls selected option text
                }),
                input: (base: any) => ({
                  ...base,
                  color: theme === 'dark' ? '#ffffff' : '#111827', // This controls typing color
                }),
                indicatorSeparator: (base: any) => ({
                  ...base,
                  display: 'none',
                }),
                dropdownIndicator: (base: any) => ({
                  ...base,
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  '&:hover': {
                    color: theme === 'dark' ? '#f9fafb' : '#111827',
                  },
                }),
                option: (base: any, state: any) => ({
                  ...base,
                  padding: '2px 10px',
                  cursor: 'pointer',
                  backgroundColor: state.isFocused
                    ? (theme === 'dark' ? '#374151' : '#e5e7eb')
                    : (theme === 'dark' ? '#1f2937' : 'white'),
                })
              }}
            />
          </div>
        </div>
      )}

      {/* MENU */}
      <div className="menuContainer">
        <div className="p-4 ltr:pr-2 rtl:pl-2 flex items-center justify-between">
          <h2 className="font-bold text-sm">{t('Sidebar.menu.title')}</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="">
            {menuList.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t('Sidebar.menu.noMenu')}
              </div>
            ) : (
              <div>
                {menuList.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => item.link()}
                    className='px-4 p-2 flex items-baseline justify-between gap-3 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 font-normal'
                  >
                    <div className="flex items-center gap-[10px]">
                      {item.icon} {item.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENTS */}
      <div className="documentsContainer">
        {/* Head */}
        <div className="p-4 ltr:pr-2 rtl:pl-2 flex items-center justify-between">
          <h2 className="font-bold text-sm">{t('Sidebar.documents.title')}</h2>

          <div className="flex gap-1">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="">
            {Object.keys(documentsList).length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                {t('Sidebar.documents.noDocuments')}
              </div>
            ) : (
              Object.entries(documentsList).map(([docType, docs]) => (
                <div key={docType}>
                  <div
                    className='px-4 p-2 flex items-baseline justify-between gap-3 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 font-normal'
                    onClick={() =>
                      setExpanded(prev => ({
                        ...prev,
                        [docType]: !prev[docType],
                      }))
                    }
                  >
                    <div className="flex items-baseline gap-[10px]">
                      {t('Doctypes.' + docType.replaceAll(" ", ""))} <span className='text-blue-600 dark:text-blue-500 font-normal text-sm shrink-0'>{docs.length}</span>
                    </div>

                    {expanded[docType] == true ? (
                      <ChevronUp size={15} className="translate-y-[2px]" />
                    ) : (
                      <ChevronDown size={15} className="translate-y-[2px] shrink-0" />
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
      </div>

    </div >
  );
};

export default Sidebar;