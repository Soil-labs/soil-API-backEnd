const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { CardMemory } = require("../../../models/cardMemoryModel");


const { ApolloError } = require("apollo-server-express");

module.exports = {
  KeywordValue: {
    node: async (parent, args, context, info) => {
      try {
        const nodeID = parent.nodeID

        console.log("nodeID = " , nodeID)

        const nodeData = await Node.findOne({ _id: nodeID }).select('_id name node subNodes aboveNodes categoryNodes groupNodes');

        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "KeywordValue",
          {
            component: "userResolver > KeywordValue",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  CardMemoriesUsedType: {
    cardMemory: async (parent, args, context, info) => {
      try {
        const {cardMemoryID} = parent

        const cardMemoryData = await CardMemory.findOne({ _id: cardMemoryID })

        return cardMemoryData;
      } catch (err) {
        console.log("err = ", err)
        throw new ApolloError(
          err.message,
          err.extensions?.code || "CardMemoriesUsedType",
          {
            component: "aiResolver > CardMemoriesUsedType",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
};
