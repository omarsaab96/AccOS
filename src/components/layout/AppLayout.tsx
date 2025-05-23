import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PanelLeftOpen, PanelLeftClose, Moon, Sun, ChevronDown, LogOut, FilePlus, Building, Building2, Trash, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useAccounts } from '../../contexts/AccountsContext';
import Sidebar from './Sidebar';
import Editor from '../editor/Editor';
import FileTabs from '../editor/FileTabs';
import ChartOfAccounts from '../chartOfAccounts';
import CreateDocModal from '../createDocModal';
import CreateAccountModal from '../createAccountModal';
import { useTranslation } from 'react-i18next';

const AppLayout: React.FC = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openCreateNewAccountModal, setOpenCreateNewAccountModal] = useState(false);
  const [activeFileName, setActiveFileName] = useState('');
  const [showDocTypesModal, setShowDocTypesModal] = useState(false);
  const [docsCounts, setDocsCounts] = useState<Record<number, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [openChartOfAccountsTab, setOpenChartOfAccountsTab] = useState(false);
  const [onOpenDocumentsTab, setOpenDocumentsTab] = useState(false);


  const [rowRemove, setRowRemove] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { activeDoc, openDocuments, getDocumentById, getDocsNumber, deleteDocumentsByCompany } = useFileSystem();
  const { refreshAccounts, deleteAccount, accountsList, activeAccount, setActiveAccount } = useAccounts();

  useEffect(() => {
    refreshAccounts();
  }, []);

  useEffect(() => {
    const fetchFileName = async () => {
      if (activeDoc != null) {
        const name = await getFileName(activeDoc);
        setActiveFileName(name);
      }
    };

    fetchFileName();
  }, [activeDoc]);

  useEffect(() => {
    const loadDocsCounts = async () => {
      setLoadingCounts(true);
      try {
        const counts: Record<number, number> = {};
        for (const account of accountsList) {
          try {
            counts[account.id] = await getDocsNumber(account.id);
          } catch (error) {
            console.error(`Failed to get count for account ${account.id}:`, error);
            counts[account.id] = 0; // Default value on error
          }
        }
        setDocsCounts(counts);
      } finally {
        setLoadingCounts(false);
      }
    };

    if (accountsList.length > 0) {
      loadDocsCounts();
    }
  }, [accountsList]);

  const getFileName = async (id: number | null) => {
    if (!id) return 'Untitled';
    const docname = await getDocumentById(id);
    return docname?.name ?? 'Untitled';
  };

  const createNewFile = () => {
    setShowDocTypesModal(true);
  };

  const handleCreateNewAccount = () => {
    setOpenCreateNewAccountModal(true);
  };

  const selectAccount = (id: number) => {
    const account = accountsList.find(a => a.id === id);
    if (account) setActiveAccount(account);
  };

  const removeRow = (index: number) => {
    setRowRemove(index);
  };

  const confirmRemoveRow = async (id: number) => {
    const success = await deleteAccount(id);
    if (success) {
      const success2 = await deleteDocumentsByCompany(id);
      if (success2) {
        setRowRemove(-1);
      }
    }
  };

  const cancelRemoveRow = () => {
    setRowRemove(-1);
  };

  const filteredAccounts = accountsList.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* App Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 z-10 select-none">
        <div className="flex items-center">
          {activeAccount &&
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ltr:mr-4 rtl:ml-4 rtl:rotate-180 p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
          }

          <h1 className="text-lg font-medium truncate">
            {theme === 'dark' ? (
              <img className="" src="logoDark.png" alt="Logo" width="100px" height="36px" />
            ) : (
              <img className="" src="logo.png" alt="Logo" width="100px" height="36px" />
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              {t('Common.languageToggle')}
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>

          <div className="relative group after:absolute after:top-100 after:left-0 after:right-0 after:w-full after:h-[10px]">
            <button className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 outline-none">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0).toUpperCase() || 'null'}
              </div>
              <span className="text-sm hidden sm:inline">{user?.name}</span>
              <ChevronDown size={14} />
            </button>

            <div className="absolute ltr:right-0 rtl:left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 hidden group-hover:block">
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                <LogOut size={16} className="ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
                {t('Common.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {!activeAccount ? (
        accountsList.length === 0 ? (
          openCreateNewAccountModal ? (
            <CreateAccountModal onClose={() => setOpenCreateNewAccountModal(false)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Building2 size={35} />
              </div>
              <h2 className="text-xl font-medium mb-2">{t('Accounts.noAccounts.title')}</h2>
              <p className="text-center max-w-md mb-8">
                {t('Accounts.noAccounts.subtitle')}
              </p>

              <motion.button
                className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none"
                onClick={() => handleCreateNewAccount()}
                whileTap={{ scale: 0.95 }}
              >
                <Building size={20} />
                {t('Accounts.noAccounts.cta')}
              </motion.button>
            </div>
          )
        ) : (
          <div className="h-full overflow-auto flex flex-col justify-between text-gray-500 dark:text-gray-400">
            <div className="p-4">
              <h2 className="text-xl font-medium text-white mb-5">
                {t('Accounts.title')}
              </h2>
              <p className="max-w-full mb-8">
                {t('Accounts.subtitle')}
              </p>

              <div className="mb-4 relative">
                <Search size={20} className='absolute top-[50%] -translate-y-[50%] ltr:left-2 rtl:right-2' />
                <input
                  type="text"
                  placeholder={t('Accounts.search.placeholder')}
                  className="w-full p-2 ltr:pl-10 rtl:pr-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredAccounts.length !== 0 && (
                <table className="w-full text-sm ltr:text-left rtl:text-right">
                  <thead>
                    <tr className="text-gray-900 dark:text-blue-400 bg-gray-100 dark:bg-gray-800">
                      <th className="p-2 ltr:rounded-tl-lg ltr:rounded-bl-lg rtl:rounded-tr-lg rtl:rounded-br-lg"></th>
                      <th className="p-2">{t('Accounts.table.th.accountName')}</th>
                      <th className="p-2">{t('Accounts.table.th.numberOfDocuments')}</th>
                      <th className="p-2 ltr:rounded-tr-lg ltr:rounded-br-lg rtl:rounded-tl-lg rtl:rounded-bl-lg">{t('Accounts.table.th.createdOn')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchTerm.trim() === '' && accountsList?.map((account: any, rowIndex: number) => {
                      const isLast = rowIndex === accountsList.length - 1;
                      return (
                        <tr key={rowIndex}
                          className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-200/70 dark:hover:bg-gray-800/30 transition-colors duration-150 relative ${isLast ? 'border-none' : ''}`}
                        >
                          <td className="px-1 py-1.5 ltr:pl-0 rtl:pr-0g">
                            <motion.button
                              className="bg-gray-100 dark:bg-gray-800 rounded-lg border-none py-2 px-2 outline-none"
                              onClick={() => removeRow(rowIndex)}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash size={12} className='opacity-50' />
                            </motion.button>

                            <div className={`absolute top-0 left-0 h-full px-1 py-2 rounded-lg transition-all w-full origin-left ${rowRemove === rowIndex ? ' scale-100 opacity-100 visible' : ' scale-0 opacity-0 invisible'}`}>
                              <div className='h-full text-[#111827] dark:text-white bg-red-600 bg-opacity-50 backdrop-blur-sm flex justify-center items-center gap-2 rounded-lg text-center font-bold'>
                                <Trash size={14} />
                                {t('Accounts.removeRow.title')}
                                <motion.button
                                  className="px-2 py-0.25 rounded-lg bg-green-400 text-green-800"
                                  onClick={() => confirmRemoveRow(account.id)}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {t('Accounts.removeRow.yes')}
                                </motion.button>
                                <motion.button
                                  className="px-2 py-0.25 rounded-lg bg-red-500 text-red-800"
                                  onClick={() => cancelRemoveRow()}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {t('Accounts.removeRow.no')}
                                </motion.button>
                              </div>
                            </div>
                          </td>

                          <td className="px-1 py-1.5 cursor-pointer" onClick={() => selectAccount(account.id)}>
                            {account.name}
                          </td>
                          <td className="px-1 py-1.5 cursor-pointer" onClick={() => selectAccount(account.id)}>
                            {loadingCounts ? '...' : (docsCounts[account.id] || 0)}
                          </td>
                          <td className="px-1 py-1.5 ltr:pr-0 rtl:pl-0 cursor-pointer" onClick={() => selectAccount(account.id)}>
                            {account.created_on}
                          </td>
                        </tr>
                      );
                    })}

                    {searchTerm.trim() !== '' && filteredAccounts?.map((account: any, rowIndex: number) => {
                      const isLast = rowIndex === accountsList.length - 1;
                      return (
                        <tr key={rowIndex}
                          className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-200/70 dark:hover:bg-gray-800/30 transition-colors duration-150 relative ${isLast ? 'border-none' : ''}`}
                        >
                          <td className="px-1 py-1.5 ltr:pl-0 rtl:pr-0g">
                            <motion.button
                              className="bg-gray-100 dark:bg-gray-800 rounded-lg border-none py-2 px-2 outline-none"
                              onClick={() => removeRow(rowIndex)}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash size={12} className='opacity-50' />
                            </motion.button>

                            <div className={`absolute top-0 left-0 h-full px-1 py-2 rounded-lg transition-all w-full origin-left ${rowRemove === rowIndex ? ' scale-100 opacity-100 visible' : ' scale-0 opacity-0 invisible'}`}>
                              <div className='h-full text-[#111827] dark:text-white bg-red-600 bg-opacity-50 backdrop-blur-sm flex justify-center items-center gap-2 rounded-lg text-center font-bold'>
                                <Trash size={14} />
                                {t('Accounts.removeRow.title')}
                                <motion.button
                                  className="px-2 py-0.25 rounded-lg bg-green-400 text-green-800"
                                  onClick={() => confirmRemoveRow(account.id)}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {t('Accounts.removeRow.yes')}
                                </motion.button>
                                <motion.button
                                  className="px-2 py-0.25 rounded-lg bg-red-500 text-red-800"
                                  onClick={() => cancelRemoveRow()}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {t('Accounts.removeRow.no')}
                                </motion.button>
                              </div>
                            </div>
                          </td>

                          <td className="px-1 py-1.5 cursor-pointer" onClick={() => selectAccount(account.id)}>
                            {account.name}
                          </td>
                          <td className="px-1 py-1.5 cursor-pointer" onClick={() => selectAccount(account.id)}>
                            {loadingCounts ? '...' : (docsCounts[account.id] || 0)}
                          </td>
                          <td className="px-1 py-1.5 ltr:pr-0 rtl:pl-0 cursor-pointer" onClick={() => selectAccount(account.id)}>
                            {account.created_on}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {filteredAccounts.length === 0 && (
                <div className="w-100 text-center">
                  {t('Accounts.search.noResults')}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <motion.div
            className="ltr:border-r rtl:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden"
            initial={{ width: sidebarOpen ? 250 : 0 }}
            animate={{ width: sidebarOpen ? 250 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {sidebarOpen &&
              <Sidebar
                onOpenCreateDocModal={() => setShowDocTypesModal(true)}
                onOpenCreateAccountModal={() => setOpenCreateNewAccountModal(true)}
                onOpenChartOfAccountsTab={() => setOpenChartOfAccountsTab(true)}
                onOpenDocumentsTab={() => setOpenChartOfAccountsTab(false)}
              />
            }
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {openChartOfAccountsTab ? (
              <ChartOfAccounts />
            ) : (
              <div className="flex-1 overflow-hidden">
                {openCreateNewAccountModal &&
                  <CreateAccountModal onClose={() => setOpenCreateNewAccountModal(false)} />
                }
                {showDocTypesModal &&
                  <CreateDocModal onClose={() => setShowDocTypesModal(false)} />
                }

                {activeDoc != null ? (
                  <>
                    {/* File Tabs */}
                    {openDocuments.length > 0 && (
                      <FileTabs />
                    )}

                    <Editor />
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-medium mb-2">{t('NoOpenDocuments.title')}</h2>
                    <p className="text-center max-w-md mb-8">
                      {t('NoOpenDocuments.subtitle')}
                    </p>

                    <motion.button
                      className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none"
                      onClick={() => createNewFile()}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FilePlus size={20} />
                      {t('NoOpenDocuments.cta')}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AppLayout;