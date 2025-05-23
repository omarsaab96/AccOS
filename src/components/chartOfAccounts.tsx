import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useAccounts } from '../contexts/AccountsContext';
import { Plus, Minus } from 'lucide-react';


interface AccountNode {
    id: string;
    name: string;
    subAccounts?: AccountNode[];
}

const ChartOfAccounts: React.FC = () => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { activeAccount } = useAccounts();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [chartOfAccountEN, setChartOfAccountEN] = useState<AccountNode[]>([]);
    const [chartOfAccountAR, setChartOfAccountAR] = useState<AccountNode[]>([]);

    useEffect(() => {
        const getChartOfAccountsByAccountId = async (id: number) => {
            try {
                const chartOfAccounts = await window.electron.chartOfAccounts.getChartOfAccountsByAccountId(id);
                setChartOfAccountEN(chartOfAccounts.en);
                setChartOfAccountAR(chartOfAccounts.ar);
            } catch (error) {
                console.error('Error fetching chart of accounts:', error);
            }
        };

        if (activeAccount) {
            getChartOfAccountsByAccountId(activeAccount.id);
        }
    }, [activeAccount]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const renderAccountRow = (account: AccountNode, depth = 0) => {
        const hasChildren = account.subAccounts && account.subAccounts.length > 0;
        const isExpanded = expandedIds.has(account.id);
        const currentData = language === 'ar' ? chartOfAccountAR : chartOfAccountEN;

        return (
            <React.Fragment key={account.id}>
                <tr className={`border-b border-gray-200 dark:border-gray-700 ${depth == 0 ? 'font-medium text-md' : (`${depth == 1 ? 'font-normal text-sm' : 'font-thin text-sm'}`) }  ${depth > 0 ? 'bg-gray-100 dark:bg-gray-800/50' : ''}`}>
                    <td className="py-2 px-4"
                        style={{ [language === 'ar' ? 'paddingRight' : 'paddingLeft']: `${depth * 24 + (hasChildren ? 0 : 24)}px` }}
                    >
                        <div className="flex items-center">
                            {hasChildren ? (
                                <>
                                    {isExpanded ? (
                                        <button
                                            onClick={() => toggleExpand(account.id)}
                                            className="p-1 ltr:mr-2 rtl:ml-2 rounded-md text-gray-500 dark:text-gray-400 bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                                            title="Collapse"
                                        >
                                            <Minus size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => toggleExpand(account.id)}
                                            className="p-1 ltr:mr-2 rtl:ml-2 rounded-md text-gray-500 dark:text-gray-400 bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                                            title="Expand"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className='ltr:mr-1.5 rtl:ml-1.5'></div>
                            )}
                            <div className='rtl:text-right'>
                                <span className={`font-normal text-blue-500 bg-blue-500/20 rounded-md px-1 ${depth == 0 ? 'py-0.15' : 'py-0.5' } inline-block min-w-[30px] text-center ltr:mr-2 rtl:ml-2`}>
                                    {account.id}
                                </span>
                                {account.name}
                            </div>
                        </div>
                    </td>
                    <td className="py-3 px-4">
                        {/* Add additional columns/data here */}
                    </td>
                </tr>
                {
                    isExpanded && hasChildren && account.subAccounts?.map(child =>
                        renderAccountRow(child, depth + 1)
                    )
                }
            </React.Fragment >
        );
    };

    return (
        <div className="h-full overflow-auto flex flex-col ">
            <div className="p-4">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-5">
                    {t('ChartOfAccounts.title')}
                </h2>
                <p className="max-w-full mb-10 text-gray-500 dark:text-gray-400">
                    {t('ChartOfAccounts.intro')}
                </p>


                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {(language === 'ar' ? chartOfAccountAR : chartOfAccountEN).map(account =>
                                renderAccountRow(account)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChartOfAccounts;