const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  Graph: {
    nodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const nodes = parent.nodes;

        if (context.body.variables.fields.showAvatar == true) {
          node_obj_memb = {};
          nodesSearch = [];
          nodes.forEach((node, idx) => {
            console.log("node = ", node);

            if (node.type == "Member") {
              node_obj_memb[node._id] = {
                info: node,
                pos: idx,
              };
              nodesSearch.push(node._id);
            }
          });
          console.log("nodesSearch = ", nodesSearch);

          nodeData = await Members.find({ _id: nodesSearch }).select(
            "_id discordAvatar"
          );

          console.log("nodeData = ", nodeData);

          // nodes.forEach((node) => {
          for (i = 0; i < nodeData.length; i++) {
            const node = nodeData[i];
            console.log("node = ", node);
            console.log("node_obj_memb[node._id] = ", node_obj_memb[node._id]);

            if (node_obj_memb[node._id]) {
              nodes[node_obj_memb[node._id].pos].avatar = node.discordAvatar;
            }
          }
          console.log("nodes = ", nodes);

          return nodes;
        } else {
          return nodes;
        }

        // console.log(context);
        // console.log(context.body);
        // console.log(context.body.variables);
        // console.log(context.body.variables.fields);

        // console.log("nodes = ", nodes);

        // if (context.body.variables.fields.showAvatar == true) {
        //   if (no)
        // } else {
        //   return nodes;
        // }
        // return nodes;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "Graph_Show_avatar_Error",
          {
            component: "userResolver > GraphVisual > avatar",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
};
