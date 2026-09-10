require('dotenv').config();
const PinataClient = require('@pinata/sdk');
const pinata = new PinataClient(process.env.PINATA_KEY, process.env.PINATA_SECRET);

pinata.testAuthentication()
    .then(result => console.log('Pinata connected:', result))
    .catch(err => console.error('Pinata failed:', err.message));