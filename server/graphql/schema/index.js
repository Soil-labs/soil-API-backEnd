const { gql } = require('apollo-server-express');
const query = require('./query.graphql');
const mutation = require('./mutation.graphql');
const userType = require('./user.graphql');
const errorType = require('./errors.graphql');

const typeDefs = gql`
  ${query}
  ${mutation}
  ${userType}
  ${errorType}

`;

module.exports = typeDefs;
