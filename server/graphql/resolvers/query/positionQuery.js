const { Conversation } = require("../../../models/conversationModel");
const { Position } = require("../../../models/positionModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  findPosition: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findPosition > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("ID is required");

    try {
      // find conversaiotn
      let positionData = await Position.findOne({ _id: _id });

      if (!positionData) throw new ApolloError("Position not found");

      console.log("positionData = ", positionData);
      // sdf9

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPosition",
        { component: "positionQuery > findPosition" }
      );
    }
  },
  findPositions: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findPositions > args.fields = ", args.fields);

    let searchQuery_and = [];
    let searchQuery = {};

    if (_id) {
      searchQuery_and.push({ _id: _id });
    }

    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }
    try {
      let positionData = await Position.find(searchQuery);

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPositions",
        { component: "positionQuery > findPositions" }
      );
    }
  },
};
