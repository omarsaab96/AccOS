import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Moon, Sun, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import Sidebar from './Sidebar';
import Editor from '../editor/Editor';
import FileTabs from '../editor/FileTabs';

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentDirectory, openFiles, activeFile } = useFileSystem();
  
  // Get file name from path
  const getFileName = (path: string | null) => {
    if (!path) return 'Untitled';
    const parts = path.split(/[\/\\]/);
    return parts[parts.length - 1];
  };

  const activeFileName = activeFile ? getFileName(activeFile) : '';
  
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
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <h1 className="text-lg font-medium truncate">
            {currentDirectory ? (
              <span title={currentDirectory}>{getFileName(currentDirectory)}</span>
            ) : (
              'File Editor'
            )}
            {activeFileName && (
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                — {activeFileName}
              </span>
            )}
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
            <button className="flex items-center space-x-1 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
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
          {sidebarOpen && <Sidebar />}
        </motion.div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Tabs */}
          {openFiles.length > 0 && (
            <FileTabs />
          )}
          
          {/* Editor Area */}
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <Editor />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium mb-2">No file open</h2>
                <p className="text-center max-w-md mb-8">
                  Open a file from the sidebar or use the "Open" button to start editing.
                </p>
                <button
                  onClick={() => useFileSystem().openFile('')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  Open File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AppLayout;