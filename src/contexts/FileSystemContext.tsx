import React, { createContext, useState, useContext } from 'react';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  extension: string | null;
}

interface FileContent {
  path: string;
  content: string;
  isDirty: boolean;
}

interface FileSystemContextType {
  currentDirectory: string | null;
  directoryContents: FileItem[];
  recentFiles: string[];
  openFiles: FileContent[];
  activeFile: string | null;
  navigateToDirectory: (path: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  saveFile: (path: string, content: string) => Promise<boolean>;
  createFile: (directory: string, name: string) => Promise<string | null>;
  createDirectory: (parent: string, name: string) => Promise<string | null>;
  deleteFile: (path: string) => Promise<boolean>;
  refreshDirectory: () => Promise<void>;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  closeFile: (path: string) => void;
}

const FileSystemContext = createContext<FileSystemContextType>({
  currentDirectory: null,
  directoryContents: [],
  recentFiles: [],
  openFiles: [],
  activeFile: null,
  navigateToDirectory: async () => {},
  openFile: async () => {},
  saveFile: async () => false,
  createFile: async () => null,
  createDirectory: async () => null,
  deleteFile: async () => false,
  refreshDirectory: async () => {},
  setActiveFile: () => {},
  updateFileContent: () => {},
  closeFile: () => {},
});

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [directoryContents, setDirectoryContents] = useState<FileItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentFiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [openFiles, setOpenFiles] = useState<FileContent[]>([]);
  const [activeFile, setActiveFilePath] = useState<string | null>(null);

  // Navigate to a directory and load its contents
  const navigateToDirectory = async (path: string) => {
    try {
      if (!path) {
        path = await window.electron.dialog.openDirectory();
        if (!path) return; // User cancelled
      }
      
      const files = await window.electron.fs.readDirectory(path);
      setCurrentDirectory(path);
      setDirectoryContents(files);
    } catch (error) {
      console.error('Failed to navigate to directory:', error);
    }
  };

  // Refresh the current directory contents
  const refreshDirectory = async () => {
    if (currentDirectory) {
      try {
        const files = await window.electron.fs.readDirectory(currentDirectory);
        setDirectoryContents(files);
      } catch (error) {
        console.error('Failed to refresh directory:', error);
      }
    }
  };

  // Open a file for editing
  const openFile = async (path: string) => {
    try {
      if (!path) {
        path = await window.electron.dialog.openFile();
        if (!path) return; // User cancelled
      }
      
      // Check if file is already open
      if (openFiles.some(file => file.path === path)) {
        setActiveFilePath(path);
        return;
      }
      
      const content = await window.electron.fs.readFile(path);
      
      // Add to open files
      setOpenFiles(prev => [...prev, { path, content, isDirty: false }]);
      setActiveFilePath(path);
      
      // Update recent files
      updateRecentFiles(path);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  // Save file content
  const saveFile = async (path: string, content: string) => {
    try {
      await window.electron.fs.writeFile(path, content);
      
      // Update open files to mark file as not dirty
      setOpenFiles(prev => 
        prev.map(file => 
          file.path === path 
            ? { ...file, content, isDirty: false } 
            : file
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  };

  // Create a new file
  const createFile = async (directory: string, name: string) => {
    try {
      if (!directory) return null;
      
      const filePath = await window.electron.fs.createFile(directory, name);
      await refreshDirectory();
      return filePath;
    } catch (error) {
      console.error('Failed to create file:', error);
      return null;
    }
  };

  // Create a new directory
  const createDirectory = async (parent: string, name: string) => {
    try {
      if (!parent) return null;
      
      const dirPath = await window.electron.fs.createDirectory(parent, name);
      await refreshDirectory();
      return dirPath;
    } catch (error) {
      console.error('Failed to create directory:', error);
      return null;
    }
  };

  // Delete a file or directory
  const deleteFile = async (path: string) => {
    try {
      await window.electron.fs.deleteFile(path);
      
      // Remove from open files if it's open
      setOpenFiles(prev => prev.filter(file => file.path !== path));
      
      // If it was the active file, set a new active file
      if (activeFile === path) {
        const remaining = openFiles.filter(file => file.path !== path);
        setActiveFilePath(remaining.length > 0 ? remaining[0].path : null);
      }
      
      await refreshDirectory();
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  };

  // Set the active file
  const setActiveFile = (path: string) => {
    setActiveFilePath(path);
    updateRecentFiles(path);
  };

  // Update a file's content (without saving)
  const updateFileContent = (path: string, content: string) => {
    setOpenFiles(prev => 
      prev.map(file => 
        file.path === path 
          ? { ...file, content, isDirty: file.content !== content } 
          : file
      )
    );
  };

  // Close a file
  const closeFile = (path: string) => {
    setOpenFiles(prev => prev.filter(file => file.path !== path));
    
    // If we closed the active file, set a new active file
    if (activeFile === path) {
      const remaining = openFiles.filter(file => file.path !== path);
      setActiveFilePath(remaining.length > 0 ? remaining[0].path : null);
    }
  };

  // Update the recent files list
  const updateRecentFiles = (path: string) => {
    setRecentFiles(prev => {
      const newRecent = [path, ...prev.filter(p => p !== path)].slice(0, 10);
      localStorage.setItem('recentFiles', JSON.stringify(newRecent));
      return newRecent;
    });
  };

  return (
    <FileSystemContext.Provider
      value={{
        currentDirectory,
        directoryContents,
        recentFiles,
        openFiles,
        activeFile,
        navigateToDirectory,
        openFile,
        saveFile,
        createFile,
        createDirectory,
        deleteFile,
        refreshDirectory,
        setActiveFile,
        updateFileContent,
        closeFile,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => useContext(FileSystemContext);