const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "db.sqlite");

console.log("✅ Using DB at:", dbPath);

const db = new sqlite3.Database(dbPath);

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    due_time TEXT,
    priority TEXT DEFAULT 'Low',
    status TEXT DEFAULT 'active'
  )
`);

module.exports = db;
