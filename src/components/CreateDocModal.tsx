import React, { useState, useEffect } from 'react';
import { FolderPen } from 'lucide-react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';



type AddDocumentResult = | { success: true; id: number } | { success: false; message: string };

type Props = { onClose: () => void; };

const CreateDocModal: React.FC<Props> = ({ onClose }) => {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [documentNameError, setDocumentNameError] = useState("");
    const [documentName, setDocumentName] = useState("");
    const [selectedDocType, setSelectedDocType] = useState(-1);
    const [docTypes, setDocTypes] = useState<any[]>([]);

    const { refreshDocuments, openDocument, docTypesCount } = useFileSystem();

    useEffect(() => {
        fetchDocTypes()
    }, [])

    //get all docTypes from db
    const fetchDocTypes = async () => {
        const result = await window.electron.doctypes.getAllDocTypes()
        setDocTypes(result)
    }

    //add new docType and document to db
    // const handleAddDocType = async () => {
    //     try {
    //         await window.electron.doctypes.addDocType(
    //             "test",
    //             "testAr",
    //             "general"
    //         );

    //         console.log("Document type added successfully");
    //         // Refresh your document types list if needed
    //         const updatedTypes = await window.electron.doctypes.getAllDocTypes();
    //         setDocTypes(updatedTypes);
    //     } catch (error) {
    //         console.error("Failed to add document type:", error);
    //         // Handle error (show toast, etc.)
    //     }
    // };

    const handleAddDocument = async (name: string, docType: number, docNumber: number, data: any, company: number): Promise<AddDocumentResult> => {
        try {
            const resp = await window.electron.documents.addDocument(name, docType, docNumber, data, company);

            return { success: true, id: resp };
        } catch (error) {
            console.error("Failed to add document type:", error);
            return { success: false, message: "Failed to add document" };
        }
    };

    const cancelShowDocTypesModal = () => {
        onClose();
        refreshDocuments()
        setSelectedDocType(-1)
        setDocumentName("")
    }

    const selectTemplate = (id: number) => {
        setSelectedDocType(prev => (prev === id ? -1 : id));
    };

    const getDocTypeByID = async (id: Number): Promise<any> => {
        try {
            const allDocTypes = await window.electron.doctypes.getAllDocTypes();
            return allDocTypes.find(docType => docType.id === id);
        } catch (error) {
            console.error('Failed to get docType by ID:', error);
            return undefined;
        }
    }

    const confirmCreateNewFile = async () => {
        const fileName = documentName;
        const docType = selectedDocType;
        const docNumber = docTypesCount[selectedDocType]?.count + 1 || 1;
        const company = -1;

        const data = [{
            "accountNumber": "",
            "accountName": "",
            "currency": "",
            "debit": "",
            "credit": "",
            "rate": "",
            "description": ""
        }]

        if (!fileName) {
            setDocumentNameError("Filename is required");
            return;
        }

        const result = await handleAddDocument(fileName, docType, docNumber, data, company);

        if (!result?.success) {
            setDocumentNameError(result?.message);
        } else {
            refreshDocuments();
            const addedID = result.id;

            setSelectedDocType(-1);
            setDocumentName("");
            setTimeout(() => {
                openDocument(addedID);
            }, 100);
            onClose();
        }
    };

    return (
        <div className="h-full flex flex-col justify-between text-gray-500 dark:text-gray-400">
            <div className="p-4">
                <h2 className="text-xl font-medium text-white mb-5">{t('CreateDocumentModal.title')}</h2>

                <p className="max-w-full mb-3 ltr:pl-[35px] rtl:pr-[35px] relative before:absolute before:content-['1'] before:font-medium before:text-white before:text-center before:leading-[24px] before:w-[24px]  before:h-[24px]  before:top-50 ltr:before:left-0 rtl:before:right-0 before:-translate-y-50 before:bg-blue-500 before:rounded-full">
                    {t('CreateDocumentModal.inputs.docnameLabel')}
                </p>
                <div className="relative mb-10">
                    <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                        <FolderPen size={18} className={`text-gray-400 ${documentNameError != "" ? 'text-red-500' : ''}`} />
                    </div>
                    <input
                        id="docName"
                        type="text"
                        value={documentName}
                        onChange={(e) => { setDocumentName(e.target.value); setDocumentNameError("") }}
                        className={`ltr:pl-10 rtl:pr-10 w-full py-2 border border-gray-300 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md transition-colors  ${documentNameError != "" ? 'text-red-500 dark:text-red-500 border-red-500 dark:border-red-500' : ''}`}
                        placeholder={t('CreateDocumentModal.inputs.docnameplaceHolder')}
                    />
                    {documentNameError != "" && <div className='absolute -bottom-4 text-xs text-red-500'>{documentNameError}</div>}
                </div>

                <p className="max-w-full mb-3 ltr:pl-[35px] rtl:pr-[35px] relative before:absolute before:content-['2'] before:font-medium before:text-white before:text-center before:leading-[24px] before:w-[24px]  before:h-[24px]  before:top-50 ltr:before:left-0 rtl:before:right-0 before:-translate-y-50 before:bg-blue-500 before:rounded-full">
                    {t('CreateDocumentModal.inputs.templateLabel')}
                </p>

                <div className='flex w-full flex-wrap gap-2'>
                    {docTypes?.map((docType, index) => (
                        <div key={docType.id || index} className='w-[calc(33.33%-6px)]'>
                            <div
                                className={`border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:dark:border-blue-500 transition rounded-lg p-4 cursor-pointer ${selectedDocType === docType.id ? '!border-blue-500 !dark:border-blue-500' : ''}`}
                                onClick={() => selectTemplate(docType.id)}
                            >
                                <p className="text-sm flex flex-col items-center font-medium">
                                    {language === 'ar' ? docType.nameAr : docType.nameEn}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-5 bg-white dark:bg-gray-800 justify-between items-center p-4">
                <motion.button
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors focus:outline-none"
                    onClick={() => cancelShowDocTypesModal()}
                    whileTap={{ scale: 0.95 }}
                >
                    {t('CreateDocumentModal.ctas.cancel')}
                </motion.button>

                <motion.button
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
                    onClick={() => confirmCreateNewFile()}
                    whileTap={{ scale: 0.95 }}
                    disabled={selectedDocType === -1 || documentName === ""}
                >
                    {t('CreateDocumentModal.ctas.create')}
                </motion.button>
            </div>
        </div>
    );
};

export default CreateDocModal;