/// <reference types="vite/client" />

interface Window {
  electron: {
    fs: {
      readDirectory: (path: string) => Promise<any[]>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<boolean>;
      createFile: (directory: string, fileName: string) => Promise<string>;
      createDirectory: (parentDir: string, dirName: string) => Promise<string>;
      deleteFile: (path: string) => Promise<boolean>;
      getStats: (path: string) => Promise<any>;
    };
    // dialog: {
    //   openDirectory: () => Promise<string | null>;
    //   openFile: () => Promise<string | null>;
    // };
    // app: {
    //   getVersion: () => Promise<string>;
    // };
    doc: {
      addDocType: (name_en: string, name_ar: string, type: string) => Promise<void>;
      getAllDocTypes: () => Promise<{ id: number; name_en: string; name_ar: string; type: string; }[]>;
      addDocument: (name: string, docType: number, docTypeNameEn: string, docTypeNameAr: string, data: { accountName: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; }[]) => Promise<number>;
      getAllDocuments: () => Promise<{ id: number; name: string; created_on: string; data: { accountName: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; }[]; docType: number; docTypeNameEn: stringr; docTypeNameAr: string; }[]>;
      readDoc: (id: number) => Promise<{ id: number; name: string; created_on: string; data: { accountName: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; }[]; docType: number; docTypeNameEn: stringr; docTypeNameAr: string; }>;
      updateDoc: (id: number, data: { accountName: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; }[]) => Promise<boolean>;
    };

    api: {
      registerUser: (data: any) => Promise<any>;
      loginUser: (data: any) => Promise<any>;
    };
  };
}