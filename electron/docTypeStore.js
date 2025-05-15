import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'docTypes.json')
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, { docTypes: [] })

export async function initDocTypesDB() {
    try {
        // Check if file exists, create if not
        try {
            await fs.access(dbPath)
        } catch {
            // Create directory if it doesn't exist
            await fs.mkdir(path.dirname(dbPath), { recursive: true })
            // Initialize with empty array
            await fs.writeFile(dbPath, JSON.stringify({ docTypes: [] }, null, 2))
        }

        await db.read()

        // Ensure data structure exists
        db.data ||= { docTypes: [] }

        await db.write()
    } catch (error) {
        console.error('Database initialization error:', error)
        throw error
    }
}

export async function getDocTypes() {
    try {
        await db.read()
        return db.data || []
    } catch (error) {
        console.error('Error getting docTypes:', error)
        throw error
    }
}

export async function addDocType(nameEn, nameAr) {
    try {
        await db.read()

        const id = db.data.length

        db.data.push({
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

export async function getDocTypeName(id) {
    try {
        await db.read()
        const docType = db.data.find(dt => dt.id === id)
        if (!docType) {
            throw new Error(`DocType with id ${id} not found`)
        }
        return {
            nameEn: docType.nameEn,
            nameAr: docType.nameAr
        }
    } catch (error) {
        console.error('Error getting docType name:', error)
        throw error
    }
}