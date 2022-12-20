const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  findMessage: async (parent, args, context, info) => {
    const { discordID, serverID } = args.fields;
    console.log("Query > findMessage > args.fields = ", args.fields);

    if (!discordID && !serverID)
      throw new ApolloError("The discordID or serverID is required");

    try {
      let searchTerm = {};

      if (discordID && serverID) {
        searchTerm = { creator: discordID, serverID: serverID };
      } else if (discordID) {
        searchTerm = { creator: discordID };
      } else if (serverID) {
        searchTerm = { serverID: serverID };
      }

      const aiData = await AI.find(searchTerm);

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
