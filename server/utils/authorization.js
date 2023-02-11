const { ForbiddenError } = require("apollo-server-express");
const { skip } = require("graphql-resolvers");
const { ACCESS_LEVELS, OPERATORS } = require("../auth/constants");

const IsAuthenticated = (parent, args, { user }) =>
  user ? skip : new ForbiddenError("Not authenticated as user.");


const IsOnlyOperator = (parent, args, { user }) => {
  user.accessLevel == ACCESS_LEVELS.OPERATOR_ACCESS ? skip : new ForbiddenError("Not authorized") ;
};

module.exports = { IsAuthenticated, IsOnlyOperator };
