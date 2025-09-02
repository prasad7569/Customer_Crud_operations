const express = require('express');
const router = express.Router();
const model = require('../models/customerModel');
const { body, validationResult } = require('express-validator');


const customerValidation = [
body('firstName').isLength({ min: 2 }).withMessage('First name min 2 chars'),
body('lastName').isLength({ min: 2 }).withMessage('Last name min 2 chars'),
body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
body('addresses').optional().isArray(),
body('addresses.*.line1').optional().isLength({ min: 5 }).withMessage('Address line1 min 5 chars'),
body('addresses.*.city').optional().notEmpty(),
body('addresses.*.state').optional().notEmpty(),
body('addresses.*.pincode').optional().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits')
];


router.post('/', customerValidation, (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
model.createCustomer(req.body, (err, result) => {
if (err) return res.status(500).json({ error: err.message });
model.getCustomerById(result.id, (err2, customer) => {
if (err2) return res.status(500).json({ error: err2.message });
res.status(201).json(customer);
});
});
});


router.get('/:id', (req, res) => {
model.getCustomerById(req.params.id, (err, customer) => {
if (err) return res.status(500).json({ error: err.message });
if (!customer) return res.status(404).json({});
res.json(customer);
});
});


router.put('/:id', customerValidation, (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
model.updateCustomer(req.params.id, req.body, (err) => {
if (err) return res.status(500).json({ error: err.message });
model.getCustomerById(req.params.id, (err2, customer) => {
if (err2) return res.status(500).json({ error: err2.message });
res.json(customer);
});
});
});


router.delete('/:id', (req, res) => {
model.deleteCustomer(req.params.id, (err) => {
if (err) return res.status(500).json({ error: err.message });
res.status(204).send();
});
});


router.get('/', (req, res) => {
const page = parseInt(req.query.page || '0');
const size = parseInt(req.query.size || '10');
const sort = req.query.sort || 'id';
model.listCustomers({ page, size, sort }, (err, result) => {
if (err) return res.status(500).json({ error: err.message });
res.json(result);
});
});

router.get('/search', (req, res) => {
const { city, state, pincode } = req.query;
const page = parseInt(req.query.page || '0');
const size = parseInt(req.query.size || '10');
model.searchCustomers({ city, state, pincode, page, size }, (err, result) => {
if (err) return res.status(500).json({ error: err.message });
res.json(result);
});
});


router.get('/with-multiple-addresses/list', (req, res) => {
model.customersWithMultipleAddresses((err, rows) => {
if (err) return res.status(500).json({ error: err.message });
res.json(rows);
});
});


module.exports = router;
