const { ErrorLog } = require("../../../models/error");

const { ApolloError } = require("apollo-server-express");

const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");
const { ACCESS_LEVELS } = require("../../../auth/constants");

module.exports = {
  errors: combineResolvers(
    IsAuthenticated,

    async (parent, args, context, info) => {
      const { _id, errorType } = args.fields;
      console.log("Query > errors > args.fields = ", args.fields);

      if (
        !context.user ||
        context.user.accessLevel > ACCESS_LEVELS.OPERATOR_ACCESS
      )
        return [];

      try {
        let errorsData;

        if (_id) {
          errorsData = await ErrorLog.find({ _id: _id });
        } else if (errorType) {
          errorsData = await ErrorLog.find({ errorType: errorType });
        } else {
          errorsData = await ErrorLog.find({});
        }

        return errorsData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "errorQuery > errors" }
        );
      }
    }
  ),
};
