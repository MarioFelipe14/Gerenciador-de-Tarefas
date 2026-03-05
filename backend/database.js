const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_FILE = path.join(__dirname, 'database.sqlite');
let db;

async function initDB() {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_FILE)) {
        const filebuffer = fs.readFileSync(DB_FILE);
        db = new SQL.Database(filebuffer);
    } else {
        db = new SQL.Database();
        // Create tables
        db.run(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT
            );
            CREATE TABLE tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT,
                description TEXT,
                status TEXT CHECK( status IN ('pending', 'in_progress', 'done') ) DEFAULT 'pending',
                priority TEXT CHECK( priority IN ('low', 'medium', 'high') ) DEFAULT 'medium',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
        `);
        saveDB();
    }
}

function saveDB() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
}

function getDB() {
    if (!db) throw new Error("Database not initialized");
    return db;
}

module.exports = { initDB, getDB, saveDB };
