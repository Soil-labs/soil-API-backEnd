const { Chats } = require("../../../models/chatsModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  findChat: async (parent, args, context, info) => {
    const { _id, threadID } = args.fields;
    console.log("Query > findChat > args.fields = ", args.fields);

    if (!_id && !threadID)
      throw new ApolloError("The _id or the threadID is required");

    try {
      let searchTerm = {};
      if (_id) {
        searchTerm = { _id: _id };
      } else if (threadID) {
        searchTerm = { threadID: threadID };
      }

      const chat = await Chats.findOne(searchTerm);
      return chat;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "findChat", {
        component: "chatQuery > findChat",
      });
    }
  },
};
