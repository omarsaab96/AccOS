import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PanelLeftOpen, PanelLeftClose, Moon, Sun, ChevronDown, LogOut, FilePlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import Sidebar from './Sidebar';
import Editor from '../editor/Editor';
import FileTabs from '../editor/FileTabs';
import CreateDocModal from '../createDocModal';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFileName, setActiveFileName] = useState('');
  const [showDocTypesModal, setShowDocTypesModal] = useState(false);

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeDoc, openDocuments, getDocumentById } = useFileSystem();

  useEffect(() => {
    const fetchFileName = async () => {
      if (activeDoc != null) {
        const name = await getFileName(activeDoc);
        setActiveFileName(name);
      } else {
      }
    };

    fetchFileName();
  }, [activeDoc]);

  // Get file name from path
  const getFileName = async (id: number | null) => {
    if (!id) return 'Untitled';
    const docname = await getDocumentById(id);
    return docname?.name ?? 'Untitled';
  };

  const createNewFile = () => {
    setShowDocTypesModal(true)
  }

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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-4 p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>

          <h1 className="text-lg font-medium truncate">
            {/* {currentDirectory ? (
              <span title={currentDirectory}>{getFileName(currentDirectory)}</span>
            ) : (
              'accos'
            )}
            {activeFileName && (
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                — {activeFileName}
              </span>
            )} */}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="relative group">
            <button className="flex items-center space-x-1 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 outline-none">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0).toUpperCase() || 'null'}
              </div>
              <span className="text-sm hidden sm:inline">{user?.name}</span>
              <ChevronDown size={14} />
            </button>

            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 hidden group-hover:block">
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.div
          className="border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden"
          initial={{ width: sidebarOpen ? 250 : 0 }}
          animate={{ width: sidebarOpen ? 250 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {sidebarOpen && <Sidebar onOpenCreateDocModal={() => setShowDocTypesModal(true)} />}
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden">
            {showDocTypesModal &&

              < CreateDocModal onClose={() => setShowDocTypesModal(false)} />
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
                <h2 className="text-xl font-medium mb-2">No Open Documents</h2>
                <p className="text-center max-w-md mb-8">
                  Open a document from the sidebar or create a new one.
                </p>

                <motion.button
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none"
                  onClick={() => createNewFile()}
                  whileTap={{ scale: 0.95 }}
                >
                  <FilePlus size={20} className="mr-1" />
                  Create New Document
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AppLayout;

