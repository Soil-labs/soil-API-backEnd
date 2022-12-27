const { GrantTemplate } = require("../../../models/grantModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  findGrants: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findGrants > args.fields = ", args.fields);

    try {
      let grantData;

      if (_id) {
        grantData = await GrantTemplate.find({ _id: _id });
      } else {
        grantData = await GrantTemplate.find({});
      }

      console.log("grantData = ", grantData);

      return grantData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
};
