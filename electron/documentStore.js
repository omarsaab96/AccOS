import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'docTypes.json')
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, { docTypes: [], files: [] })

export async function initDB() {
    try {
        // Check if file exists, create if not
        try {
            await fs.access(dbPath)
        } catch {
            // Create directory if it doesn't exist
            await fs.mkdir(path.dirname(dbPath), { recursive: true })
            // Initialize with empty array
            await fs.writeFile(dbPath, JSON.stringify({ docTypes: [], files: [] }, null, 2))
        }

        await db.read()

        // Ensure data structure exists
        db.data ||= { docTypes: [], files: [] }

        await db.write()
    } catch (error) {
        console.error('Database initialization error:', error)
        throw error
    }
}

export async function getDocTypes() {
    try {
        await db.read()
        return db.data?.docTypes || []
    } catch (error) {
        console.error('Error getting docTypes:', error)
        throw error
    }
}

export async function addDocType(nameEn, nameAr) {
    try {
        await db.read()

        const id = db.data.docTypes.length

        db.data.docTypes.push({
            id,
            nameEn,
            nameAr
        })

        await db.write()
        return id
    } catch (error) {
        console.error('Error adding docType:', error)
        throw error
    }
}

export async function getAllDocuments() {
    try {
        await db.read()
        return db.data?.files || []
    } catch (error) {
        console.error('Error getting documents:', error)
        throw error
    }
}

export async function addDocument(name, docType, docTypeNameEn, docTypeNameAr, data) {
    try {
        await db.read()
        const id = db.data.files.length
        const created_on = new Date().toLocaleString('en-UK', { day: '2-digit', month: '2-digit', year: 'numeric' })

        db.data.files.push({
            id,
            name,
            docType,
            docTypeNameEn,
            docTypeNameAr,
            data,
            created_on
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
        const files = db.data?.files || [];
        const doc = files.find(file => file.id === id);
        return doc || null;
    } catch (error) {
        console.error('Error getting documents:', error)
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
        console.error('Error getting documents:', error)
        throw error
    }
}