const { gql } = require('apollo-server-express');
const query = require('./query.graphql');
const mutation = require('./mutation.graphql');
const userType = require('./user.graphql');
const memberType = require('./member.graphql');
const projectType = require('./project.graphql');
const skillsType = require('./skills.graphql');
const tweetType = require('./tweet.graphql');
const errorType = require('./errors.graphql');

const typeDefs = gql`
  ${query}
  ${mutation}
  ${userType}
  ${skillsType}
  ${memberType}
  ${projectType}
  ${tweetType}
  ${errorType}

`;

module.exports = typeDefs;
