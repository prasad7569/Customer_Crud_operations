const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, 'customers.db');
const db = new sqlite3.Database(dbFile);

const init = () => {
db.serialize(() => {
db.run(`
CREATE TABLE IF NOT EXISTS customers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
firstName TEXT NOT NULL,
lastName TEXT NOT NULL,
phone TEXT NOT NULL
)
`);


db.run(`
CREATE TABLE IF NOT EXISTS addresses (
id INTEGER PRIMARY KEY AUTOINCREMENT,
customerId INTEGER NOT NULL,
line1 TEXT NOT NULL,
line2 TEXT,
city TEXT NOT NULL,
state TEXT NOT NULL,
pincode TEXT NOT NULL,
FOREIGN KEY(customerId) REFERENCES customers(id) ON DELETE CASCADE
)
`);
});
};

module.exports = { db, init };
