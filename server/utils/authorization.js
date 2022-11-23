const { ForbiddenError } = require("apollo-server-express");
const { skip } = require("graphql-resolvers");


const IsAuthenticated = (parent, args, { user }) =>
  user ? skip : new ForbiddenError("Not authenticated as user.");

module.exports = { IsAuthenticated };
