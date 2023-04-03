const { EndorsementLink } = require("../../../models/endorsementLinkModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  findEndorsementLink: async (parent, args, context, info) => {
    const { _id, serverID } = args.fields;
    console.log("Query > findEndorsementLink > args.fields = ", args.fields);

    try {
      let endorsementData;

      if (_id) {
        endorsementData = await EndorsementLink.find({ _id: _id });
      } else if (serverID) {
        endorsementData = await EndorsementLink.find({ serverID: serverID });
      } else {
        endorsementData = await EndorsementLink.find({});
      }

      console.log("endorsementData = ", endorsementData);

      return endorsementData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "endorsementQuery > findEndorsementLink" }
      );
    }
  },
};
