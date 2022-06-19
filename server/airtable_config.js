const Airtable = require('airtable')


const base = new Airtable({ apiKey: process.env.REACT_APP_AIRTABLE_TOKEN}).base(process.env.REACT_APP_AIRTABLE_ID);



module.exports = base;
