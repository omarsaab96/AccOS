import React, { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFileSystem } from '../../contexts/FileSystemContext';

// This is a simplified editor component.
// In a real app, you would use Monaco Editor or CodeMirror
const Editor: React.FC = () => {
  const { activeFile, openFiles, updateFileContent, saveFile } = useFileSystem();
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Find the currently active file
  const currentFile = openFiles.find(file => file.path === activeFile);
  
  // Update textarea value when active file changes
  useEffect(() => {
    if (textareaRef.current && currentFile) {
      textareaRef.current.value = currentFile.content;
    }
  }, [activeFile, currentFile]);
  
  // Handle file content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFile) {
      updateFileContent(activeFile, e.target.value);
    }
  };
  
  // Handle save
  const handleSave = async () => {
    if (activeFile && currentFile) {
      setIsSaving(true);
      await saveFile(activeFile, currentFile.content);
      setIsSaving(false);
    }
  };

  // Keyboard shortcut for save (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, currentFile]);
  
  // If no file is active, show a message
  if (!activeFile || !currentFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No file selected
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col relative">
      {/* Editor header with file info */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{currentFile.path.split(/[\/\\]/).pop()}</span>
          {currentFile.isDirty && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(unsaved changes)</span>
          )}
        </div>
        
        <motion.button
          className="flex items-center px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving || !currentFile.isDirty}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      
      {/* Editor textarea */}
      <textarea
        ref={textareaRef}
        className="flex-1 w-full p-4 font-mono text-sm focus:outline-none resize-none bg-white dark:bg-gray-900 dark:text-gray-100"
        defaultValue={currentFile.content}
        onChange={handleChange}
        spellCheck={false}
      ></textarea>
    </div>
  );
};

export default Editor;