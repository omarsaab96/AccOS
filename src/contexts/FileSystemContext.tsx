import React, { createContext, useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '../contexts/AccountsContext';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  extension: string | null;
}

interface DocItem {
  id: number;
  name: string;
  created_on: string;
  data: {
    accountName: string | null;
    accountNumber: string | null;
    credit: string | null;
    currency: string | null;
    debit: string | null;
    description: string | null;
    rate: string | null;
  }[];
  docType: number;
  docTypeNameEn: string;
  docTypeNameAr: string;
}

interface FileContent {
  path: string;
  content: string;
  isDirty: boolean;
}

interface DocumentContent {
  id: number;
  name: string;
  created_on: string;
  data: {
    accountName: string | null;
    accountNumber: string | null;
    credit: string | null;
    currency: string | null;
    debit: string | null;
    description: string | null;
    rate: string | null;
  }[];
  docType: number;
  docNumber: number,
  isDirty: boolean;
}

interface FileSystemContextType {
  directoryContents: FileItem[];
  documentsList: DocItem[];
  openFiles: FileContent[];
  openDocuments: DocumentContent[];
  activeFile: string | null;
  activeDoc: number | null;
  docTypesCount: any[];
  openFile: (path: string) => Promise<void>;
  openDocument: (id: number) => Promise<void>;
  saveFile: (path: string, content: string) => Promise<boolean>;
  saveDoc: (id: number, data: any) => Promise<boolean>;
  refreshDirectory: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  setActiveFile: (path: string) => void;
  setActiveDoc: (id: number) => void;
  updateFileContent: (path: string, content: string) => void;
  updateDocContent: (id: number, data: any) => void;
  getDocumentById: (id: number) => Promise<DocItem | undefined>;
  getDocsNumber: (id: number) => Promise<number>;
  deleteDocumentsByCompany: (id: number) => Promise<boolean>;
  closeFile: (path: string) => void;
  closeDoc: (id: number) => Promise<boolean>;
}

const FileSystemContext = createContext<FileSystemContextType>({
  directoryContents: [],
  documentsList: [],
  openFiles: [],
  openDocuments: [],
  activeFile: null,
  activeDoc: null,
  docTypesCount: [],
  openFile: async () => { },
  openDocument: async () => { },
  saveFile: async () => false,
  saveDoc: async () => false,
  refreshDirectory: async () => { },
  refreshDocuments: async () => { },
  setActiveFile: () => { },
  setActiveDoc: () => { },
  updateFileContent: () => { },
  updateDocContent: () => { },
  getDocumentById: async () => undefined,
  getDocsNumber: async () => 0,
  deleteDocumentsByCompany: () => false,
  closeFile: () => { },
  closeDoc: async () => false,
});

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [directoryContents, setDirectoryContents] = useState<FileItem[]>([]);
  const [documentsList, setDocumentsList] = useState<DocItem[]>([]);
  const [openFiles, setOpenFiles] = useState<FileContent[]>([]);
  const [openDocuments, setOpenDocuments] = useState<DocumentContent[]>([]);
  const [activeFile, setActiveFilePath] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<number | null>(null);
  const [docTypesCount, setDocTypesCount] = useState([]);
  const { activeAccount } = useAccounts();

  // Load files on initial mount
  useEffect(() => {
    // refreshDirectory();
    refreshDocuments();
  }, []);

  // Refresh the files directory contents
  const refreshDirectory = async () => {
    try {
      const files = await window.electron.fs.readDirectory('files');
      setDirectoryContents(files.filter(file => !file.isDirectory));
    } catch (error) {
      console.error('Failed to refresh directory:', error);
    }
  };

  // Refresh the documents list
  const refreshDocuments = async () => {
    setDocumentsList([]);
    try {
      if(!activeAccount) return;
      const docs = await window.electron.documents.getDocumentsByAccount(activeAccount.id);
      const groupedByDoctype = {};

      for (const doc of docs) {
        const docTypeName = await window.electron.doctypes.getDocTypeName(doc.docType);
        if (!groupedByDoctype[docTypeName.nameEn]) {
          groupedByDoctype[docTypeName.nameEn] = [];
        }
        groupedByDoctype[docTypeName.nameEn].push(doc);
      }

      setDocumentsList(groupedByDoctype);

      // Compute counts
      const docTypesCount = Object.entries(groupedByDoctype).map(([name, docs]) => ({
        name,
        count: docs.length
      }));

      setDocTypesCount(docTypesCount);

    } catch (error) {
      console.error('Failed to refresh documents list:', error);
    }
  };

  // Get documents Count by account
  const getDocsNumber = async (id: number): Promise<number> => {
    try {
      const docs = await window.electron.documents.getDocumentsByAccount(id);
      return docs.length;
    } catch (error) {
      console.error('Failed to refresh documents list:', error);
      return 0;
    }
  };

  // Open a file for editing
  const openFile = async (path: string) => {
    try {
      // Check if file is already open
      if (openFiles.some(file => file.path === path)) {
        setActiveFilePath(path);
        return;
      }

      const content = await window.electron.fs.readFile(path);

      // Add to open files
      setOpenFiles(prev => [...prev, { path, content, isDirty: false }]);
      setActiveFilePath(path);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  // Open a document for editing
  const openDocument = async (id: number) => {
    try {
      if (openDocuments.some(doc => doc.id === id)) {
        setActiveDoc(id);
        return;
      }

      const content = await window.electron.documents.readDoc(id);

      if (!content || typeof content.id !== 'number') {
        console.error('Invalid document content received.');
        return;
      }

      const doc: DocumentContent = {
        id: content.id,
        name: content.name,
        created_on: content.created_on,
        data: content.data,
        docType: content.docType,
        docNumber: content.docNumber,
        isDirty: false
      }

      // Add to open documents
      setOpenDocuments(prev => [...prev, doc]);
      setActiveDoc(id);

    } catch (error) {
      console.error('Failed to open document:', error);
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

  // Save doc content
  const saveDoc = async (id: number, data: any) => {
    try {
      await window.electron.documents.updateDoc(id, data);

      // Update open files to mark file as not dirty
      setOpenDocuments(prev =>
        prev.map(doc =>
          doc.id === id
            ? { ...doc, data, isDirty: false }
            : doc
        )
      );

      return true;
    } catch (error) {
      console.error('Failed to save doc:', error);
      return false;
    }
  };

  // Set the active file
  const setActiveFile = (path: string) => {
    setActiveFilePath(path);
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

  // Update a file's content (without saving)
  const updateDocContent = (id: number, data: any) => {
    setOpenDocuments(prev =>
      prev.map(doc =>
        doc.id === id
          ? { ...doc, data, isDirty: doc.data !== data }
          : doc
      )
    );
  };

  const getDocumentById = async (id: number): Promise<DocItem | undefined> => {
    try {
      const allDocs = await window.electron.documents.getAllDocuments();
      return allDocs.find(doc => doc.id === id);
    } catch (error) {
      console.error('Failed to get document by ID:', error);
      return undefined;
    }
  };
  
  const deleteDocumentsByCompany = async (id: number): Promise<Boolean> => {
    try {
      const response = await window.electron.documents.deleteDocumentsByCompany(id);
      return response;
    } catch (error) {
      console.error('Failed to get documents of account: '+id, error);
      return false;
    }
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

  // Close a doc
  const closeDoc = async (id: number) => {
    const docToBeClosed = openDocuments.find(doc => doc.id === id);

    const isDarkMode = true

    if (docToBeClosed?.isDirty) {
      const result = await Swal.fire({
        title: t('Editor.popup.title'),
        text: t('Editor.popup.subtitle'),
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: t('Editor.popup.ctas.saveAndClose'),
        denyButtonText: t('Editor.popup.ctas.closeWithoutSaving'),
        cancelButtonText: t('Editor.popup.ctas.cancel'),
        background: isDarkMode ? '#1f2937' : undefined, // Tailwind gray-800
        color: isDarkMode ? '#f9fafb' : undefined,      // Tailwind gray-50

        // 🔥 Remove default styling
        buttonsStyling: false,

        // 🎨 Custom button classes
        customClass: {
          popup: 'rounded-xl shadow-xl',
          icon: 'text-xs',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md outline-none ltr:mr-[10px] rtl:ml-[10px]',
          denyButton: 'bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md outline-none ltr:mr-[10px] rtl:ml-[10px]',
          cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium px-3 py-1.5 rounded-md outline-none',
        },
      });

      if (result.isConfirmed) {
        const success = await saveDoc(id, docToBeClosed.data);
        if (!success) return false;
      } else if (result.isDismissed) {
        return false;
      }
    }

    setOpenDocuments(prev => {
      const updatedDocs = prev.filter(doc => doc.id !== id);
      if (activeDoc === id) {
        setActiveDoc(updatedDocs.length > 0 ? updatedDocs[0].id : null);
      }
      return updatedDocs;
    });

    return true;
  };

  return (
    <FileSystemContext.Provider
      value={{
        directoryContents,
        documentsList,
        openFiles,
        openDocuments,
        activeFile,
        activeDoc,
        docTypesCount,
        openFile,
        openDocument,
        saveFile,
        saveDoc,
        refreshDirectory,
        refreshDocuments,
        setActiveFile,
        setActiveDoc,
        updateFileContent,
        updateDocContent,
        getDocumentById,
        getDocsNumber,
        deleteDocumentsByCompany,
        closeFile,
        closeDoc,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => useContext(FileSystemContext);