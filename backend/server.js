const express = require('express');
const cors = require('cors');
const { init } = require('./db');
const customerRouter = require('./controllers/customerController');


const app = express();
app.use(cors());
app.use(express.json());


init();


app.use('/api/customers', customerRouter);


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));