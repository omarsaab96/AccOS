import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'documents.json')
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, { documents: [] })

export async function initDocumentsDB() {
    try {
        // Check if file exists, create if not
        try {
            await fs.access(dbPath)
        } catch {
            // Create directory if it doesn't exist
            await fs.mkdir(path.dirname(dbPath), { recursive: true })
            // Initialize with empty array
            await fs.writeFile(dbPath, JSON.stringify({ documents: [] }, null, 2))
        }

        await db.read()

        // Ensure data structure exists
        db.data ||= { documents: [] }

        await db.write()
    } catch (error) {
        console.error('Database initialization error:', error)
        throw error
    }
}

export async function getAllDocuments() {
    try {
        await db.read()
        return db.data || []
    } catch (error) {
        console.error('Error getting documents:', error)
        throw error
    }
}

export async function getDocumentsByAccount(id) {
    if (id == -2) {
        return [];
    }

    try {
        await db.read();
        const allDocs = db.data || [];
        const filtered = allDocs.filter(doc => doc.company === id);
        return filtered;
    } catch (error) {
        console.error('Error getting documents:', error)
        throw error
    }
}

export async function addDocument(name, docType, docNumber, data, company) {
    try {
        await db.read()
        const id = db.data.length
        const created_on = new Date().toLocaleString('en-UK', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const linked = true;

        db.data.push({
            id,
            name,
            docType,
            docNumber,
            data,
            company,
            created_on,
            linked
        })

        await db.write()
        return id
    } catch (error) {
        console.error('Error creating document:', error)
        throw error
    }
}

export async function readDoc(id) {
    try {
        await db.read();
        const files = db.data || [];
        const doc = files.find(file => file.id === id);
        return doc || null;
    } catch (error) {
        console.error('Error reading document:', error)
        throw error
    }
}

export async function updateDoc(id, data) {
    try {
        const docs = await getAllDocuments();
        const index = docs.findIndex(doc => doc.id === id);

        if (index === -1) {
            throw new Error(`Document with id ${id} not found`);
        }

        // Update the document's data
        docs[index].data = data;

        db.data.files = docs;
        await db.write();

        return { success: true };
    } catch (error) {
        console.error('Error updating document:', error)
        throw error
    }
}

export async function deleteDocumentsByCompany(id) {
    try {
        await db.read();

        let updated = false;

        db.data.forEach(doc => {
            if (doc.company === id) {
                doc.linked = false;
                updated = true;
            }
        });

        if (!updated) {
            throw new Error(`No documents found for company ${id}`);
        }

        await db.write();
        return true;
    } catch (error) {
        console.error('Error unlinking documents by company:', error);
        return false;
    }
}
