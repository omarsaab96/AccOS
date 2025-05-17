import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FileSystemProvider } from './contexts/FileSystemContext';
import { AccountsProvider } from './contexts/AccountsContext';
import LoginScreen from './components/auth/LoginScreen';
import RegisterScreen from './components/auth/RegisterScreen';
import AppLayout from './components/layout/AppLayout';

function AppContent() {
  const { isAuthenticated, loading, showRegister } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-400 dark:bg-blue-600 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <FileSystemProvider>
          <AppLayout />
        </FileSystemProvider>
      ) : showRegister ? (
        <RegisterScreen />
      ) : (
        <LoginScreen />
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AccountsProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AccountsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;