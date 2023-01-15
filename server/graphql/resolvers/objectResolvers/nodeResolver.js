const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  Node: {
    subNodes: async (parent, args, context, info) => {
      try {
        const subNodes = parent.subNodes;

        //   nodeData = await Node.find({ _id: subNodes });
        nodeData = await Node.find({ _id: subNodes }).select(
          "_id name node subNodes"
        );

        if (context.selectedNodes) {
          nodeData = nodeData.map((node) => {
            if (context.selectedNodes[node._id]) {
              node.selected = true;
            }
            return node;
          });
          return nodeData;
        } else if (context.relatedNodes_obj) {
          nodeData = nodeData.map((node) => {
            if (context.relatedNodes_obj[node._id]) {
              node.star = true;
            }
            return node;
          });
          return nodeData;
        } else {
          return nodeData;
        }
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
    aboveNodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const aboveNodes = parent.aboveNodes;

        nodeData = await Node.find({ _id: aboveNodes }).select("_id name node");

        if (context.selectedNodes) {
          nodeData = nodeData.map((node) => {
            if (context.selectedNodes[node._id]) {
              node.selected = true;
            }
            return node;
          });
          return nodeData;
        } else {
          return nodeData;
        }

        return nodeData;
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
    relatedNodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const relatedNodes = parent.relatedNodes;

        nodeData = await Node.find({ _id: relatedNodes }).select(
          "_id name node"
        );

        if (context.selectedNodes) {
          nodeData = nodeData.map((node) => {
            if (context.selectedNodes[node._id]) {
              node.selected = true;
            }
            return node;
          });
          return nodeData;
        } else {
          return nodeData;
        }

        return nodeData;
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
  },
};
