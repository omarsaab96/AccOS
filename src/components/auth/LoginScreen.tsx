import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Lock, Mail, UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';


const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, switchToRegister } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError(t('Login.errors.emailAndPasswordEmpty'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (!success) {
        setError(t('Login.errors.invalidCredentials'));
      }
    } catch (err) {
      setError(t('Login.errors.loginError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4"
    >
      <div className="absolute top-4 ltr:right-4 rtl:left-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            {t('Common.languageToggle')}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>

      </div>

      <div className='flex flex-col w-full max-w-md'>
        {theme === 'dark' ? (
          <img className="m-auto mb-5" src="logoDark.png" alt="Logo" width="200px" height="72px" />
        ) : (
          <img className="m-auto mb-5" src="logo.png" alt="Logo" width="200px" height="72px" />
        )}


        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('Login.title')}
              </h1>
            </div>

            {error && (
              <motion.div
                className="flex items-center p-1.5 justify-between rounded-lg overflow-hidden font-medium mb-2 bg-red-500 bg-opacity-20 text-red-500"
                initial={{ opacity: 0, x: language === 'ar' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="relative flex items-center gap-2 ltr:pl-[15px] rtl:pr-[15px] text-sm before:absolute before:top-0 ltr:before:left-0 rtl:before:right-0 before:w-[5px] before:h-[100%] before:bg-red-600 before:rounded-lg">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                  {error}
                </div>
              </motion.div>




            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                  {t('Login.inputs.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ltr:pl-10 rtl:pr-10 w-full py-2 border border-gray-300 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md transition-colors"
                    placeholder={t('Login.inputs.emailPlaceholder')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                  {t('Login.inputs.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ltr:pl-10 rtl:pr-10 w-full py-2 border border-gray-300 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md transition-colors"
                    placeholder={t('Login.inputs.passwordPlaceholder')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <motion.button
                  type="submit"
                  className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin ltr:-ml-1 ltr:mr-2 rtl:-mr-1 rtl:ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('Login.ctas.loggingIn')}
                    </>
                  ) : (
                    t('Login.ctas.login')
                  )}
                </motion.button>
              </div>
            </form>


            <div className="mt-6">
              <button
                onClick={switchToRegister}
                className="w-full flex items-center gap-1 justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                <UserPlus size={16} />
                {t('Login.ctas.register')}
              </button>
            </div>
          </div>
        </motion.div>
      </div >


    </motion.div >
  );
};

export default LoginScreen;