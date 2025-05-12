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
    dialog: {
      openDirectory: () => Promise<string | null>;
      openFile: () => Promise<string | null>;
    };
    app: {
      getVersion: () => Promise<string>;
    };
  };
}