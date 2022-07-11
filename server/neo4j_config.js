let neo4j = require('neo4j-driver');

// neo4j connections
const driver = neo4j.driver("neo4j+s://16837b5d.databases.neo4j.io", neo4j.auth.basic("neo4j", "J-YcKQl98fR6HTEBjm_HZKg_jQWZNCF3Zteast3G9cg"), {/* encrypted: 'ENCRYPTION_OFF' */});

const session = driver.session({database:"neo4j"});

module.exports = { session };