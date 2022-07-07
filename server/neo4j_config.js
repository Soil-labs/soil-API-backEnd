let neo4j = require('neo4j-driver');

// neo4j connections
const driver = neo4j.driver("bolt://3.86.252.82:7687", neo4j.auth.basic("neo4j", "sections-winches-nonavailability"), {/* encrypted: 'ENCRYPTION_OFF' */});

const session = driver.session({database:"neo4j"});

module.exports = { session };