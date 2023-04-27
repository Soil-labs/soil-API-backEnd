const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

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
};
