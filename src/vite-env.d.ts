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
    doctypes: {
      addDocType: (name_en: string, name_ar: string, type: string) => Promise<void>;
      getAllDocTypes: () => Promise<{ id: number; name_en: string; name_ar: string; type: string; }[]>;
      getDocTypeName: (id: number) => Promise<{ nameEn: string, nameAr: string }>;
    };
    documents: {
      addDocument: (name: string, docType: number, docNumber: number, data: { accountName: string | null; accountHelper: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; equivalent:string | null; }[], company: number) => Promise<number>;
      getAllDocuments: () => Promise<{ id: number; name: string; created_on: string; data: { accountName: string | null; accountHelper: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; equivalent:string | null; }[]; docType: number; docNumber: number, linked:boolean }[]>;
      getDocumentsByAccount: (id:number) => Promise<{ id: number; name: string; created_on: string; data: { accountName: string | null; accountHelper: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; equivalent:string | null; }[]; docType: number; docNumber: number, linked:boolean }[]>;
      readDoc: (id: number) => Promise<{ id: number; name: string; created_on: string; data: { accountName: string | null; accountHelper: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; equivalent:string | null; }[]; docType: number; docNumber: number, linked:boolean }>;
      updateDoc: (id: number, data: { accountName: string | null; accountHelper: string | null; accountNumber: string | null; credit: string | null; currency: string | null; debit: string | null; description: string | null; rate: string | null; }[]) => Promise<boolean>;
      deleteDocumentsByCompany: (id: number) => Promise<boolean>;
      generatePDF: () => void;
      printPDF: (html) => void;

    };
    accounts: {
      getAllAccounts: () => Promise<{ id: number; name: string; created_on: string, linked:boolean }>;
      addAccount: (name: string) => Promise<{ id: number; name: string; created_on: string, linked:boolean }>;
      updateAccount: (id: number, name: string) => Promise<boolean>;
      getAccountByID: (id: number) => Promise<{ id: number, name: string, created_on: string, linked:boolean }>;
      deleteAccount: (id: number) => Promise<boolean>;
    }

    api: {
      registerUser: (data: any) => Promise<any>;
      loginUser: (data: any) => Promise<any>;
    };
  };
}