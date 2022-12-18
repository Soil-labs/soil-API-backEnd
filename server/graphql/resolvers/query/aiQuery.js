const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  findMessage: async (parent, args, context, info) => {
    const { discordID } = args.fields;
    console.log("Query > findMessage > args.fields = ", args.fields);

    if (!discordID) throw new ApolloError("The discordID is required");

    try {
      const aiData = await AI.find({ creator: discordID });

      console.log("creator message data :", aiData);

      return aiData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMessage",
        {
          component: "aiQuery > findMessage",
        }
      );
    }
  },
};
