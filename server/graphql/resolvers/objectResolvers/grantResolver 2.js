const { Node } = require("../../../models/nodeModal");
const { ApolloError } = require("apollo-server-express");
const { RoleTemplate } = require("../../../models/roleTemplateModal");
const { Members } = require("../../../models/membersModel");

module.exports = {
  GrantTemplate: {
    nodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const nodes = parent.nodes;

        // console.log("nodes ----= " , nodes)

        nodesID = [];
        nodes.forEach((node) => {
          nodesID.push(node._id);
        });

        // console.log("nodesID = " , nodesID)

        const nodesData = await Node.find({ _id: nodesID });

        let res = [];
        nodesData.forEach((node) => {
          res.push({
            nodeData: node,
          });
        });

        // console.log("nodesData = " , nodesData)

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
    membersApplied: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const membersApplied = parent.membersApplied;

        const memberData = await Members.find({ _id: membersApplied });

        return memberData;
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
