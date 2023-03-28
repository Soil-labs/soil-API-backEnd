const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  endorseNode: {
    node:  async (parent, args, context, info) => {
      try {
        const nodeID = parent.nodeID;
        const nodeData = await Node.findOne({ _id: nodeID });
        return nodeData;
      } catch (err) {
        throw new ApolloError(err.message, err.extensions?.code || "endorser", {
          component: "memberResolver > endorser",
          user: context.req.user?._id,
        });
      }
    },
  },
  Endorsement: {
    userSend: async (parent, args, context, info) => {
      try {
        const userSend = parent.userSend;

        const memberData = await Members.findOne({ _id: userSend });

        return memberData;
      } catch (error) {
        throw new ApolloError(error);
      }
    },
    userReceive: async (parent, args, context, info) => {
      try {
        const userReceive = parent.userReceive;

        const memberData = await Members.findOne({ _id: userReceive });

        return memberData;
      } catch (error) {
        throw new ApolloError(error);
      }
    },
    nodes: async (parent, args, context, info) => {
      try {

        return parent.endorseNodes
      } catch (error) {
        throw new ApolloError(error);
      }
    },
  },
};
