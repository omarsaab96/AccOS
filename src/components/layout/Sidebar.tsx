import React, { useState } from 'react';
import { FolderOpen, RefreshCw, Plus, Clock, Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { 
    currentDirectory, 
    directoryContents, 
    navigateToDirectory, 
    openFile,
    recentFiles,
    refreshDirectory,
    createFile,
    createDirectory
  } = useFileSystem();
  
  const [showRecent, setShowRecent] = useState(true);
  const [newItemType, setNewItemType] = useState<null | 'file' | 'directory'>(null);
  const [newItemName, setNewItemName] = useState('');
  
  // Get file/folder name from path
  const getNameFromPath = (path: string) => {
    const parts = path.split(/[\/\\]/);
    return parts[parts.length - 1];
  };
  
  const handleCreateItem = async () => {
    if (!currentDirectory || !newItemName.trim()) return;
    
    if (newItemType === 'file') {
      await createFile(currentDirectory, newItemName);
    } else if (newItemType === 'directory') {
      await createDirectory(currentDirectory, newItemName);
    }
    
    setNewItemType(null);
    setNewItemName('');
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sidebar Header with Actions */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-medium text-sm">Explorer</h2>
        
        <div className="flex space-x-1">
          <button 
            onClick={() => navigateToDirectory('')}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            title="Open Folder"
          >
            <FolderOpen size={16} />
          </button>
          
          {currentDirectory && (
            <>
              <button 
                onClick={() => refreshDirectory()}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              
              <button 
                onClick={() => setNewItemType(prev => prev ? null : 'file')}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                title="New File"
              >
                <Plus size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Create New Item Form */}
      {newItemType && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium mb-1">
            New {newItemType === 'file' ? 'File' : 'Folder'}
          </div>
          <div className="flex">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={newItemType === 'file' ? 'filename.txt' : 'folder name'}
              autoFocus
            />
            <button
              onClick={handleCreateItem}
              className="px-2 py-1 bg-blue-500 text-white text-sm rounded-r-md hover:bg-blue-600 focus:outline-none"
            >
              Create
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Files Section */}
        <div className="py-2">
          <div
            className="px-4 py-1 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={() => setShowRecent(!showRecent)}
          >
            <div className="flex items-center">
              {showRecent ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="ml-1 text-sm font-medium">Recent Files</span>
            </div>
            <Clock size={14} />
          </div>
          
          {showRecent && (
            <div className="mt-1">
              {recentFiles.length === 0 ? (
                <div className="px-8 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  No recent files
                </div>
              ) : (
                recentFiles.map((filePath) => (
                  <div 
                    key={filePath}
                    className="px-8 py-1.5 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer flex items-center truncate"
                    onClick={() => openFile(filePath)}
                    title={filePath}
                  >
                    <FileText size={14} className="mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                    <span className="truncate">{getNameFromPath(filePath)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Current Directory */}
        {currentDirectory ? (
          <div className="py-2">
            <div className="px-4 py-1 flex items-center">
              <ChevronDown size={16} />
              <span className="ml-1 text-sm font-medium truncate" title={currentDirectory}>
                {getNameFromPath(currentDirectory)}
              </span>
            </div>
            
            <div className="mt-1">
              {directoryContents.length === 0 ? (
                <div className="px-8 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  Empty folder
                </div>
              ) : (
                directoryContents.map((item) => (
                  <motion.div 
                    key={item.path}
                    className="px-8 py-1.5 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer flex items-center truncate"
                    onClick={() => item.isDirectory ? navigateToDirectory(item.path) : openFile(item.path)}
                    title={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.isDirectory ? (
                      <Folder size={14} className="mr-2 flex-shrink-0 text-blue-500" />
                    ) : (
                      <FileText size={14} className="mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 px-4">
            <FolderOpen size={32} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No folder open. Click the folder icon above to open a directory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;