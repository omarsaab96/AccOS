import React, { useState, useEffect } from 'react';
import { FolderPen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useAccounts } from '../contexts/AccountsContext';

type AddAccountResult = | { success: true; acc: { id: number, name: string, created_on: string } } | { success: false; message: string };

type Props = { onClose: () => void; };

const CreateAccountModal: React.FC<Props> = ({ onClose }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [accountNameError, setAccountNameError] = useState("");
    const [accountName, setAccountName] = useState("");

    const { refreshAccounts, setActiveAccount, accountsList } = useAccounts();

    const handleAddAccount = async (name: string): Promise<AddAccountResult> => {
        try {
            const resp = await window.electron.accounts.addAccount(name);

            return { success: true, acc: resp };
        } catch (error) {
            console.error("Failed to add account:", error);
            return { success: false, message: "Failed to add account" };
        }
    };

    const cancelShowAccountModal = () => {
        onClose();
        refreshAccounts()
        setAccountName("")
    }

    const confirmCreateNewAccount = async () => {
        if (!accountName) {
            setAccountNameError("Account name is required");
            return;
        }

        const result = await handleAddAccount(accountName);

        // console.log(result)

        if (!result?.success) {
            setAccountNameError(result?.message);
        } else {
            await refreshAccounts();
            setAccountName("");
            setActiveAccount(result.acc)
            onClose();
        }
    };

    return (
        <div className="h-full flex flex-col justify-between text-gray-500 dark:text-gray-400">
            <div className="p-4">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-5">{t('CreateAccountModal.title')}</h2>

                <p className="max-w-full mb-3 ltr:pl-[35px] rtl:pr-[35px] relative before:absolute before:content-['1'] before:font-medium before:text-white before:text-center before:leading-[24px] before:w-[24px]  before:h-[24px]  before:top-50 ltr:before:left-0 rtl:before:right-0 before:-translate-y-50 before:bg-blue-500 before:rounded-full">
                    {t('CreateAccountModal.inputs.accountNameLabel')}
                </p>
                <div className="relative mb-10">
                    <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                        <FolderPen size={18} className={`text-gray-400 ${accountNameError != "" ? 'text-red-500' : ''}`} />
                    </div>
                    <input
                        id="docName"
                        type="text"
                        value={accountName}
                        onChange={(e) => { setAccountName(e.target.value); setAccountNameError("") }}
                        className={`ltr:pl-10 rtl:pr-10 w-full py-2 border border-gray-300 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md transition-colors  ${accountNameError != "" ? 'text-red-500 dark:text-red-500 border-red-500 dark:border-red-500' : ''}`}
                        placeholder={t('CreateAccountModal.inputs.accountNameplaceHolder')}
                    />
                    {setAccountNameError != "" && <div className='absolute -bottom-4 text-xs text-red-500'>{accountNameError}</div>}
                </div>


            </div>

            <div className="flex gap-5 bg-white dark:bg-gray-800 justify-between items-center p-4">
                <motion.button
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors focus:outline-none"
                    onClick={() => cancelShowAccountModal()}
                    whileTap={{ scale: 0.95 }}
                >
                    {t('CreateAccountModal.ctas.cancel')}
                </motion.button>

                <motion.button
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
                    onClick={() => confirmCreateNewAccount()}
                    whileTap={{ scale: 0.95 }}
                    disabled={accountName === ""}
                >
                    {t('CreateAccountModal.ctas.create')}
                </motion.button>
            </div>
        </div>
    );
};

export default CreateAccountModal;