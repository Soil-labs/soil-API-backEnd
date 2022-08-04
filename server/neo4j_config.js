let neo4j = require('neo4j-driver');

// neo4j connections
const driver = neo4j.driver(process.env.REACT_APP_NEO4J_DATABASE_ENDPOINT, neo4j.auth.basic("neo4j", process.env.REACT_APP_NEO4J_DATABASE_TOKEN), {/* encrypted: 'ENCRYPTION_OFF' */});

module.exports = { driver };