import React, { createContext, useState, useContext, useEffect } from 'react';

// Define types for our authentication context
interface User {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (name: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchToRegister: () => void;
  switchToLogin: () => void;
  showRegister: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: () => { },
  switchToRegister: () => { },
  switchToLogin: () => { },
  showRegister: false,
});

interface StoredUser extends User {
  password: string;
}

// Mock user storage
// const getUsersFromStorage = (): Record<string, StoredUser> => {
//   const users = localStorage.getItem('registeredUsers');
//   return users ? JSON.parse(users) : {};
// };

// const saveUsersToStorage = (users: Record<string, StoredUser>) => {
//   localStorage.setItem('registeredUsers', JSON.stringify(users));
// };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // Check for saved session on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await window.api.loginUser({ email, password });
    if (response.success) {
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    const response = await window.api.registerUser({ name, email, phone, password });
    if (response.success) {
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const switchToRegister = () => setShowRegister(true);
  const switchToLogin = () => setShowRegister(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        switchToRegister,
        switchToLogin,
        showRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);