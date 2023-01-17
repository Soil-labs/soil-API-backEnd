const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  Node: {
    subNodes: async (parent, args, context, info) => {
      try {
        const subNodes_parent = parent.subNodes;

        //   nodeData = await Node.find({ _id: subNodes });
        nodeData = await Node.find({ _id: subNodes_parent }).select(
          "_id name node subNodes"
        );

        if (context.nodeTree == true) {
          const subNodes_parent_obj = subNodes_parent.reduce((obj, item) => {
            obj[item._id] = item.subNodes;
            return obj;
          }, {});

          let res_final = [];
          nodeData.forEach((node) => {
            res_final.push({
              ...node._doc,
              subNodes: subNodes_parent_obj[node._id],
            });
          });

          // console.log("res_final = ", res_final);

          // nodeData[0].subNodes = subNodes_parent[0].subNodes;
          // console.log("subNodes +++++++++= ", nodeData);
          // console.log("subNodes ---------= ", subNodes_parent[0].subNodes);
          // // return {
          // //   ...nodeData,
          // //   subNodes: subNodes[0].subNodes,
          // // };
          // // return subNodes;
          // return nodeData;
          return res_final;
        } else {
          nodeData = await Node.find({ _id: subNodes_parent }).select(
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
