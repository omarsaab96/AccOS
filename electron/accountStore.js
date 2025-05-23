import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const chartOfAccountsTemplateEN = path.join(__dirname, 'files', 'chartOfAccounts.json');
const chartOfAccountsTemplateAR = path.join(__dirname, 'files', 'chartOfAccounts-ar.json');
const chartOfAccountsPerAccount = path.join(__dirname, 'files', 'accounts');


const dbPath = path.join(__dirname, 'accounts.json')
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, [])

export async function initAccountsDB() {
    try {
        try {
            await fs.access(dbPath)
        } catch {
            await fs.mkdir(path.dirname(dbPath), { recursive: true })
            await fs.writeFile(dbPath, JSON.stringify([], null, 2));
        }

        await db.read()

        // ✅ this ensures structure is there before writing
        db.data ||= []

        await db.write()
    } catch (error) {
        console.error('Database initialization error:', error)
        throw error
    }
}

export async function getAllAccounts() {
    try {
        await db.read()

        return (db.data || []).filter(account => account.linked !== false);
    } catch (error) {
        console.error('Error getting accounts:', error)
        throw error
    }
}

export async function addAccount(name) {
    try {
        await db.read();
        // Auto-increment ID based on accounts length
        const id = db.data.length;
        const created_on = new Date().toLocaleString('en-UK', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const linked = true;

        const newAcc = { id, name, created_on, linked };

        db.data.push(newAcc);

        await db.write()

        const destinationPathEN = path.join(chartOfAccountsPerAccount, `coaen_${id}.json`);
        const destinationPathAR = path.join(chartOfAccountsPerAccount, `coaar_${id}.json`);

        // await fs.mkdir(chartOfAccountsPerAccount, { recursive: true });

        try {
            await fs.copyFile(chartOfAccountsTemplateEN, destinationPathEN);
            await fs.copyFile(chartOfAccountsTemplateAR, destinationPathAR);
            console.log('Files copied successfully.');
        } catch (err) {
            console.error('Error copying chart files:', err);
        }

        return newAcc
    } catch (error) {
        console.error('Error creating account:', error)
        throw error
    }
}

export async function updateAccount(id, name) {
    try {
        const accounts = await getAllAccounts();
        const index = accounts.findIndex(doc => doc.id === id);

        if (index === -1) {
            throw new Error(`Account not found`);
        }

        // Update the account's name
        accounts[index].name = name;

        db.data = accounts;
        await db.write();

        return { success: true };
    } catch (error) {
        console.error('Error updating accounts:', error)
        throw error
    }
}

export async function getAccountByID(id) {
    try {
        await db.read()
        const account = db.data.find(a => a.id === id)
        if (!account) {
            throw new Error(`Account with id ${id} not found`)
        }
        return account;
    } catch (error) {
        console.error('Error getting account:', error)
        throw error
    }
}

export async function deleteAccount(id) {
    try {
        await db.read();

        const account = db.data.find(acc => acc.id === id);
        if (!account) {
            throw new Error(`Account with id ${id} not found`);
        }

        account.linked = false;
        await db.write();

        return true;
    } catch (error) {
        console.error('Error unlinking account:', error);
        return false;
    }
}