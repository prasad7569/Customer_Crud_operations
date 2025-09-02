const { db } = require('../db');


function createCustomer(customer, callback) {
const { firstName, lastName, phone, addresses } = customer;
db.run(
`INSERT INTO customers (firstName, lastName, phone) VALUES (?, ?, ?)`,
[firstName, lastName, phone],
function (err) {
if (err) return callback(err);
const customerId = this.lastID;
if (!addresses || addresses.length === 0) return callback(null, { id: customerId });
const stmt = db.prepare(`INSERT INTO addresses (customerId, line1, line2, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?)`);
addresses.forEach(a => stmt.run(customerId, a.line1, a.line2 || '', a.city, a.state, a.pincode));
stmt.finalize(err2 => callback(err2, { id: customerId }));
}
);
}

function getCustomerById(id, callback) {
db.get(`SELECT * FROM customers WHERE id = ?`, [id], (err, customer) => {
if (err) return callback(err);
if (!customer) return callback(null, null);
db.all(`SELECT * FROM addresses WHERE customerId = ?`, [id], (err2, addresses) => {
if (err2) return callback(err2);
customer.addresses = addresses;
callback(null, customer);
});
});
}


function updateCustomer(id, customer, callback) {
const { firstName, lastName, phone, addresses } = customer;
db.run(
`UPDATE customers SET firstName = ?, lastName = ?, phone = ? WHERE id = ?`,
[firstName, lastName, phone, id],
function (err) {
if (err) return callback(err);
if (!addresses) return callback(null);
// Replace addresses: delete old, insert new
db.run(`DELETE FROM addresses WHERE customerId = ?`, [id], (err2) => {
if (err2) return callback(err2);
const stmt = db.prepare(`INSERT INTO addresses (customerId, line1, line2, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?)`);
addresses.forEach(a => stmt.run(id, a.line1, a.line2 || '', a.city, a.state, a.pincode));
stmt.finalize(err3 => callback(err3));
});
}
);
}

function deleteCustomer(id, callback) {
db.run(`DELETE FROM customers WHERE id = ?`, [id], function (err) {
callback(err);
});
}


function listCustomers({ page = 0, size = 10, sort = 'id' }, callback) {
const offset = page * size;
db.all(`SELECT * FROM customers ORDER BY ${sort} LIMIT ? OFFSET ?`, [size, offset], (err, rows) => {
if (err) return callback(err);
db.get(`SELECT COUNT(*) as count FROM customers`, [], (err2, countRow) => {
if (err2) return callback(err2);
callback(null, { content: rows, totalElements: countRow.count });
});
});
}


function searchCustomers({ city, state, pincode, page = 0, size = 10 }, callback) {
const offset = page * size;
if (city) {
db.all(`SELECT c.* FROM customers c JOIN addresses a ON c.id = a.customerId WHERE LOWER(a.city) = LOWER(?) GROUP BY c.id LIMIT ? OFFSET ?`, [city, size, offset], (err, rows) => {
if (err) return callback(err);
// count
db.get(`SELECT COUNT(DISTINCT c.id) as count FROM customers c JOIN addresses a ON c.id = a.customerId WHERE LOWER(a.city) = LOWER(?)`, [city], (err2, countRow) => callback(err2, { content: rows, totalElements: countRow.count }));
});
return;
}
if (state) {
db.all(`SELECT c.* FROM customers c JOIN addresses a ON c.id = a.customerId WHERE LOWER(a.state) = LOWER(?) GROUP BY c.id LIMIT ? OFFSET ?`, [state, size, offset], (err, rows) => {
if (err) return callback(err);
db.get(`SELECT COUNT(DISTINCT c.id) as count FROM customers c JOIN addresses a ON c.id = a.customerId WHERE LOWER(a.state) = LOWER(?)`, [state], (err2, countRow) => callback(err2, { content: rows, totalElements: countRow.count }));
});
return;
}
if (pincode) {
db.all(`SELECT c.* FROM customers c JOIN addresses a ON c.id = a.customerId WHERE a.pincode = ? GROUP BY c.id LIMIT ? OFFSET ?`, [pincode, size, offset], (err, rows) => {
if (err) return callback(err);
db.get(`SELECT COUNT(DISTINCT c.id) as count FROM customers c JOIN addresses a ON c.id = a.customerId WHERE a.pincode = ?`, [pincode], (err2, countRow) => callback(err2, { content: rows, totalElements: countRow.count }));
});
return;
}
// fallback
listCustomers({ page, size }, callback);
}


function customersWithMultipleAddresses(callback) {
db.all(`SELECT c.*, COUNT(a.id) as addrCount FROM customers c JOIN addresses a ON c.id = a.customerId GROUP BY c.id HAVING addrCount > 1`, [], (err, rows) => {
callback(err, rows);
});
}


module.exports = {
createCustomer,
getCustomerById,
updateCustomer,
deleteCustomer,
listCustomers,
searchCustomers,
customersWithMultipleAddresses
};