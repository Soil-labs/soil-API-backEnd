const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  endorseNode: {
    node: async (parent, args, context, info) => {
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
        return parent.endorseNodes;
      } catch (error) {
        throw new ApolloError(error);
      }
    },
  },
  EndorsementLink: {
    memberInfo: async (parent, args, context, info) => {
      try {
        const memberID = parent.memberID;

        const memberData = await Members.findOne({ _id: memberID });

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    nodes: async (parent, args, context, info) => {
      // console.log("parent = ", parent);

      try {
        const nodes = parent.nodes;

        const nodesData = await Node.find({ _id: nodes });

        let res = [];
        nodesData.forEach((node) => {
          res.push({
            nodeData: node,
          });
        });

        // console.log("nodesData = ", nodesData);

        return res;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > nodes",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
};
