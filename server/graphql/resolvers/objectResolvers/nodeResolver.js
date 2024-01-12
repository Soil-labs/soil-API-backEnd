const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { Node } = require("../../../models/nodeModal");
const { CardMemory } = require("../../../models/cardMemoryModel");


const { ApolloError } = require("apollo-server-express");

module.exports = {
  Node: {
    subNodes: async (parent, args, context, info) => {
      try {
        const subNodes_parent = parent.subNodes;
        // console.log("subNodes_parent = ", subNodes_parent);

        //   nodeData = await Node.find({ _id: subNodes });
        nodeData = await Node.find({ _id: subNodes_parent }).select(
          "_id name node subNodes aboveNodes"
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
          let nodeDataRes = [];
          // if there is info that we need to use on the nodeData then we will loop throw them
          for (i = 0; i < nodeData.length; i++) {
            // nodeData = nodeData.forEach((node) => {
            const node = nodeData[i];
            let node_new = {};
            // console.log("node = ", subNodes_parent_obj[node._id]);
            // console.log("change = ", subNodes_parent_obj[node._id]);
            console.log(
              "change = ",
              node._id,
              subNodes_parent_obj[node._id].level,
              subNodes_parent_obj[node._id].level == undefined,
              node.node != "skill",
              node.node
            );
            if (
              subNodes_parent_obj[node._id] &&
              subNodes_parent_obj[node._id].level == undefined &&
              node.node != "skill"
            ) {
              console.log("change = - -- -- -- - ---  ", node._id);
              continue;
            }
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

            // return node_new;
            nodeDataRes.push(node_new);
          }

          return nodeDataRes;
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
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    aboveNodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const aboveNodes = parent.aboveNodes;

        // console.log("aboveNodes = ", parent);

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
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    categoryNodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const categoryNodes = parent.categoryNodes;

        // console.log("categoryNodes = ", parent);

        nodeData = await Node.find({ _id: categoryNodes }).select("_id name node");

        

        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    groupNodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const groupNodes = parent.groupNodes;

        // console.log("groupNodes = ", parent);

        nodeData = await Node.find({ _id: groupNodes }).select("_id name node");

        

        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
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
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    connectedCardMemories: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const connectedCardMemories = parent.connectedCardMemories;


        return connectedCardMemories;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  ConnectedCardMemory: {
    card: async (parent, args, context, info) => {

      try {
        const cardID = parent.cardID;

        cardMemoryData = await CardMemory.findOne({ _id: cardID })

        

        return cardMemoryData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }

    }
  },
  ConnectedNodes: {
    node: async (parent, args, context, info) => {

      try {
        const nodeID = parent.nodeID;

        // console.log("nodeID = ", nodeID)

        nodeData = await Node.findOne({ _id: nodeID })

        

        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }

    }
  },
  GraphNeighborType: {
    node: async (parent, args, context, info) => {

      try {
        const nodeID = parent.nodeID;

        // console.log("nodeID = ", nodeID)
        // console.log("parent = ", parent)

        nodeData = await Node.findOne({ _id: nodeID }).select('-graphNeighbors -match_v2_update -match_v2')

        

        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }

    },
    weightSeparate: async (parent, args, context, info) => {

      try {
        let weightSeparate = parent.weightSeparate;

        // console.log("nodeID = ", nodeID)
        console.log("parent wi = ", parent)

        // take only the nodesID
        weightSeparateIDs = weightSeparate.map((item) => {
          return item.nodeID;
        });
        
        
        nodeData = await Node.find({ _id: { $in: weightSeparateIDs } }).select('-graphNeighbors -match_v2_update -match_v2')


        console.log("nodeData = ", nodeData)

        for (i = 0; i < weightSeparate.length; i++) {
          weightSeparate[i].node = nodeData[i];
        }

        

        return weightSeparate;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }

    }
  },
  ShowMembersConnectedToNodesOutput: {
    member: async (parent, args, context, info) => {

      try {
        const memberID = parent.memberID;

        memberData = await Members.findOne({ _id: memberID })        

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    primitiveCardMemInput: async (parent, args, context, info) => {

      try {

        return parent.nodeInput;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  PrimitiveCardType: {
    nodeInput: async (parent, args, context, info) => {

      try {

        nodeData = await Node.findOne({ _id: parent.nodeInputID}).select('-graphNeighbors -match_v2_update -match_v2')

        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    neighborNodeWithMemOutput: async (parent, args, context, info) => {

      try {

        return parent.neighborNodeWithMem;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  CardMemoryOutputType: {
    cardMemory: async (parent, args, context, info) => {

      try {
        const cardMemoryID = parent.cardMemoryID;

        if (cardMemoryID!=null){

          cardMemoryData = await CardMemory.findOne({ _id: cardMemoryID})

          if (cardMemoryData)
            return cardMemoryData;
        }

      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  NodeOutputType: {
    node: async (parent, args, context, info) => {

      try {
        const nodeOutputID =  parent.nodeOutputID;

        if (nodeOutputID != null) {
          nodeData = await Node.findOne({ _id: parent.nodeOutputID}).select('-graphNeighbors -match_v2_update -match_v2')

          if (nodeData)
            return nodeData;
        }

      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  NeighborNodeWithMem: {
    nodeOutput: async (parent, args, context, info) => {

      try {
        const neighborNodeID =  parent.neighborNodeID;

        if (neighborNodeID != null) {
          nodeData = await Node.findOne({ _id: parent.neighborNodeID}).select('-graphNeighbors -match_v2_update -match_v2')

          if (nodeData)
            return nodeData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    cardMemoryOutput: async (parent, args, context, info) => {

      try {
        const cardMemoryID = parent.cardMemoryID;

        if (cardMemoryID!=null){

          cardMemoryData = await CardMemory.findOne({ _id: cardMemoryID})

          if (cardMemoryData)
            return cardMemoryData;
        }

      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  ConnectMemoriesToKnowledgeGraph_V2Output: {
    userConnectedToKG: async (parent, args, context, info) => {

      try {
        // console.log("parent = ", parent)

        const userConnectedToKGID = parent.userConnectedToKGID;

        if (userConnectedToKGID == null){
          return null;
        }
        memberData = await Members.findOne({ _id: userConnectedToKGID })  

        if (memberData == null){
          return null;
        }

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
    positionConnectedToKG: async (parent, args, context, info) => {

      try {
        // console.log("parent = ", parent)

        const positionConnectedToKGID = parent.positionConnectedToKGID;

        if (positionConnectedToKGID == null){
          return null;
        }
        positionData = await Position.findOne({ _id: positionConnectedToKGID })  

        if (positionData == null){
          return null;
        }

        return positionData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "nodeResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
};
