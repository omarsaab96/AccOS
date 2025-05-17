import React, { createContext, useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

interface Account {
    id: number;
    name: string;
    created_on: string;
}

interface AccountsContextType {
    accountsList: Account[];
    activeAccount: Account | null;
    refreshAccounts: () => Promise<void>;
    addAccount: (name: string) => Promise<void>;
    updateAccount: (id: number, name: string) => Promise<void>;
    setActiveAccount: (acc: Account) => void;
    deleteAccount: (id: number) => Promise<Boolean>;
}

const AccountsContext = createContext<AccountsContextType>({
    accountsList: [],
    activeAccount: null,
    refreshAccounts: async () => { },
    addAccount: async () => { },
    updateAccount: async () => { },
    setActiveAccount: () => { },
    deleteAccount: async () => false
});

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const [accountsList, setAccountsList] = useState([]);
    const [activeAccount, setActiveAccount] = useState<Account | null>(null);

    // Load files on initial mount
    useEffect(() => {
        refreshAccounts();
    }, []);

    // Refresh the files directory contents
    const refreshAccounts = async () => {
        try {
            const accounts = await window.electron.accounts.getAllAccounts();
            setAccountsList(accounts);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const addAccount = async (name: string) => {
        try {
            const newacc = await window.electron.accounts.addAccount(name);
            refreshAccounts()
        } catch (error) {
            console.error('Error adding account:', error);
        }
    };

    const updateAccount = async (id: number, name: string) => {
        try {
            await window.electron.accounts.updateAccount(id, name);
            await refreshAccounts();
        } catch (error) {
            console.error('Error updating account:', error);
        }
    };

    const deleteAccount = async (id: number): Promise<boolean> => {
        try {
            await window.electron.accounts.deleteAccount(id);
            await refreshAccounts();

            // If the deleted account was active, unset it
            if (activeAccount?.id === id) {
                setActiveAccount(null);
            }

            return true;
        } catch (error) {
            console.error("Error deleting account:", error);
            return false;
        }
    };

    return (
        <AccountsContext.Provider
            value={{
                accountsList,
                activeAccount,
                refreshAccounts,
                addAccount,
                updateAccount,
                setActiveAccount,
                deleteAccount
            }}
        >
            {children}
        </AccountsContext.Provider>
    );
};

export const useAccounts = () => useContext(AccountsContext);