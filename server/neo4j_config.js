let neo4j = require('neo4j-driver');
require("dotenv").config();

// neo4j connections
console.log("process.env.REACT_APP_NEO4J_DATABASE_ENDPOINT = " , process.env.REACT_APP_NEO4J_DATABASE_ENDPOINT)
console.log("REACT_APP_NEO4J_DATABASE_TOKEN = " , process.env.REACT_APP_NEO4J_DATABASE_TOKEN)
const driver = neo4j.driver(process.env.REACT_APP_NEO4J_DATABASE_ENDPOINT, neo4j.auth.basic("neo4j", process.env.REACT_APP_NEO4J_DATABASE_TOKEN), {/* encrypted: 'ENCRYPTION_OFF' */});

module.exports = { driver };