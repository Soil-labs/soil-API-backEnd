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

        //  ----- save the info of the subNodes for -> for their subSubNodes -> or for info about open and level --------
        let subNodes_parent_obj;
        subNodes_parent_obj = subNodes_parent.reduce((obj, item) => {
          obj[item._id] = item;
          return obj;
        }, {});

        if (
          context.selectedNodes != undefined ||
          context.relatedNodes_obj != undefined ||
          context.nodeTree == true
        ) {
          // if there is info that we need to use on the nodeData then we will loop throw them
          nodeData = nodeData.map((node) => {
            let node_new = {};
            if (context.selectedNodes && context.selectedNodes[node._id]) {
              node_new.selected = true;
            }
            // from the related we take the started skills
            if (
              context.relatedNodes_obj &&
              context.relatedNodes_obj[node._id]
            ) {
              node_new.star = true;
            }

            // if it is a nodeTree then we should just use the subNodes that were given and not create new ones
            if (context.nodeTree == true) {
              node_new.subNodes = subNodes_parent_obj[node._id].subNodes;
            }
            // open or close for the realted nodes
            if (
              subNodes_parent_obj[node._id] &&
              subNodes_parent_obj[node._id].open == true
            ) {
              node_new.open = true;
            }
            // level of the node, for the color
            if (
              subNodes_parent_obj[node._id] &&
              subNodes_parent_obj[node._id].level
            ) {
              node_new.level = subNodes_parent_obj[node._id].level;
            }

            node_new._id = node._id;
            node_new.name = node.name;
            node_new.node = node.node;

            return node_new;
          });

          return nodeData;
        } else {
          return nodeData;
        }

        // if (context.selectedNodes) {
        //   nodeData = nodeData.map((node) => {
        //     if (context.selectedNodes[node._id]) {
        //       node.selected = true;
        //     }
        //     if (context.nodeTree == true) {
        //       node.subNodes = subNodes_parent_obj[node._id];
        //     }
        //     return node;
        //   });

        //   return nodeData;
        // } else if (context.relatedNodes_obj) {
        //   nodeData = nodeData.map((node) => {
        //     if (context.relatedNodes_obj[node._id]) {
        //       node.star = true;
        //     }
        //     if (context.nodeTree == true) {
        //       node.subNodes = subNodes_parent_obj[node._id];
        //     }
        //     return node;
        //   });

        //   return nodeData;
        // } else {
        //   return nodeData;
        // }

        // if (context.nodeTree == true) {
        //   const subNodes_parent_obj = subNodes_parent.reduce((obj, item) => {
        //     obj[item._id] = item.subNodes;
        //     return obj;
        //   }, {});

        //   let res_final = [];
        //   nodeData.forEach((node) => {
        //     res_final.push({
        //       ...node._doc,
        //       subNodes: subNodes_parent_obj[node._id],
        //     });
        //   });
        //   return res_final;
        // } else {
        //   if (context.selectedNodes) {
        //     nodeData = nodeData.map((node) => {
        //       if (context.selectedNodes[node._id]) {
        //         node.selected = true;
        //       }
        //       return node;
        //     });
        //     return nodeData;
        //   } else if (context.relatedNodes_obj) {
        //     nodeData = nodeData.map((node) => {
        //       if (context.relatedNodes_obj[node._id]) {
        //         node.star = true;
        //       }
        //       return node;
        //     });
        //     return nodeData;
        //   } else {
        //     return nodeData;
        //   }
        // }
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
