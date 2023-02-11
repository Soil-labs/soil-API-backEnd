const { Node } = require("../../../models/nodeModal");
const { ServerTemplate } = require("../../../models/serverModel");
const { ApolloError } = require("apollo-server-express");
const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID_f,
  makeConnection_neo4j,
} = require("../../../neo4j/func_neo4j");
const { combineResolvers } = require("graphql-resolvers");
const {
  IsAuthenticated,
  IsOnlyOperator,
} = require("../../../utils/authorization");

module.exports = {
  createNode: combineResolvers(
    IsAuthenticated,
    IsOnlyOperator,
    async (parent, args, context, info) => {
      const { node, name, subNodes, aboveNodes, state } = args.fields;
      console.log("Mutation > createNode > args.fields = ", args.fields);

      if (!name)
        throw new ApolloError("You need to specify the name of the node");
      // if (!node) throw new ApolloError( "You need to specify the type of the node");

      let fields = {
        name,
        registeredAt: new Date(),
      };

      if (subNodes) fields.subNodes = subNodes;
      if (aboveNodes) fields.aboveNodes = aboveNodes;
      if (node) fields.node = node;

      if (state) {
        fields = {
          ...fields,
          state,
        };
      } else {
        fields = {
          ...fields,
          state: "approved",
        };
      }

      fields = {
        ...fields,
        matchByServer_update: true,
      };

      console.log("fields = ", fields);

      try {
        let nodeData;

        nodeData = await Node.findOne({ name: fields.name });

        if (!nodeData) {
          nodeData = await new Node(fields);

          nodeData.save();

          // ----------------- Save the Server on the Skills -----------------
          let serverData = await ServerTemplate.find({});

          let serverID = [];
          serverData.map((server) => {
            serverID.push(server._id);
          });
          // ----------------- Save the Server on the Skills -----------------

          await createNode_neo4j_field({
            fields: {
              node: nodeData.node,
              _id: nodeData._id,
              serverID_code: "828",
              name: nodeData.name,
              serverID: serverID,
            },
          });
        } else {
          // if nodeData.subNodes don't include the new subNodes then add them
          if (!nodeData.subNodes.includes(fields.subNodes)) {
            nodeData.subNodes.push(fields.subNodes);
          }

          if (subNodes) {
            await Node.findOneAndUpdate(
              { _id: nodeData._id },
              {
                $set: {
                  subNodes: nodeData.subNodes,
                },
              },
              { new: true }
            );
          }

          if (!nodeData.aboveNodes.includes(fields.aboveNodes)) {
            nodeData.aboveNodes.push(fields.aboveNodes);
          }

          if (aboveNodes) {
            await Node.findOneAndUpdate(
              { _id: nodeData._id },
              {
                $set: {
                  aboveNodes: nodeData.aboveNodes,
                },
              },
              { new: true }
            );
          }
        }

        connect_node_to_subNode(nodeData, subNodes, 1);

        connect_node_to_aboveNode(nodeData, aboveNodes, 1);

        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }
    }
  ),

  relatedNode: combineResolvers(
    IsAuthenticated,
    IsOnlyOperator,
    async (parent, args, context, info) => {
      const { _id, relatedNode_id } = args.fields;
      console.log("Mutation > relatedNode > args.fields = ", args.fields);

      if (!_id)
        throw new ApolloError("You need to specify the _id of the node");
      if (!relatedNode_id)
        throw new ApolloError(
          "You need to specify the relatedNode_id of the node"
        );

      let nodeData = await Node.findOne({ _id });

      let relatedNodeData = await Node.findOne({ _id: relatedNode_id });

      try {
        await makeConnection_neo4j({
          node: [nodeData.node, relatedNodeData.node],
          id: [nodeData._id, relatedNodeData._id],
          connection: "related",
        });

        if (!nodeData.relatedNodes.includes(relatedNode_id)) {
          nodeData.relatedNodes.push(relatedNode_id);
        }

        await Node.findOneAndUpdate(
          { _id: nodeData._id },
          {
            $set: {
              relatedNodes: nodeData.relatedNodes,
            },
          },
          { new: true }
        );

        if (!relatedNodeData.relatedNodes.includes(_id)) {
          relatedNodeData.relatedNodes.push(_id);
        }

        await Node.findOneAndUpdate(
          { _id: relatedNodeData._id },
          {
            $set: {
              relatedNodes: relatedNodeData.relatedNodes,
            },
          },
          { new: true }
        );
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }

      return nodeData;
    }
  ),

  relatedNode_name: combineResolvers(
    IsAuthenticated,
    IsOnlyOperator,
    async (parent, args, context, info) => {
      const { name, relatedNode_name, weight, connection } = args.fields;
      console.log("Mutation > relatedNode_name > args.fields = ", args.fields);

      if (!name)
        throw new ApolloError("You need to specify the name of the node");
      if (!relatedNode_name)
        throw new ApolloError(
          "You need to specify the relatedNode_name of the node"
        );

      let nodeData = await Node.findOne({ name }).select(
        "name _id node relatedNodes"
      );

      let relatedNodeData = await Node.findOne({ name: relatedNode_name }).select(
        "name _id node relatedNodes"
      );

      let connection_n = connection.replace(" ", "_");

      console.log("res nodeData = ", nodeData);
      console.log("res relatedNodeData = ", relatedNodeData);
      console.log("connection_n = ", connection_n);
      try {
        if (weight) {
          await makeConnection_neo4j({
            node: [nodeData.node, relatedNodeData.node],
            id: [nodeData._id, relatedNodeData._id],
            connection: connection_n,
            weight: weight,
          });
        } else {
          await makeConnection_neo4j({
            node: [nodeData.node, relatedNodeData.node],
            id: [nodeData._id, relatedNodeData._id],
            connection: connection_n,
          });
        }
        console.log("phase 1= ", nodeData.relatedNodes, relatedNodeData._id);
        console.log(
          "phase 1= ",
          nodeData.relatedNodes,
          relatedNodeData._id,
          nodeData.relatedNodes.includes(relatedNodeData._id)
        );

        if (!nodeData.relatedNodes.includes(relatedNodeData._id)) {
          nodeData.relatedNodes.push(relatedNodeData._id);
        }
        console.log("phase 2= ");

        await Node.findOneAndUpdate(
          { _id: nodeData._id },
          {
            $set: {
              relatedNodes: nodeData.relatedNodes,
            },
          },
          { new: true }
        );

        if (!relatedNodeData.relatedNodes.includes(nodeData._id)) {
          relatedNodeData.relatedNodes.push(nodeData._id);
        }

        await Node.findOneAndUpdate(
          { _id: relatedNodeData._id },
          {
            $set: {
              relatedNodes: relatedNodeData.relatedNodes,
            },
          },
          { new: true }
        );
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }

      return nodeData;
    }
  ),
};

async function connect_node_to_subNode(nodeData, subNodes, weight = undefined) {
  if (subNodes && subNodes.length > 0) {
    let subNodesData = await Node.find({ _id: subNodes });
    for (let i = 0; i < subNodesData.length; i++) {
      if (!subNodesData[i].aboveNodes.includes(nodeData._id)) {
        subNodesData[i].aboveNodes.push(nodeData._id);

        await Node.findOneAndUpdate(
          { _id: subNodesData[i]._id },
          {
            $set: {
              aboveNodes: subNodesData[i].aboveNodes,
            },
          },
          { new: true }
        );

        if (weight) {
          makeConnection_neo4j({
            node: [nodeData.node, subNodesData[i].node],
            id: [nodeData._id, subNodesData[i]._id],
            connection: subNodesData[i].node,
            weight: weight,
          });
        } else {
          makeConnection_neo4j({
            node: [nodeData.node, subNodesData[i].node],
            id: [nodeData._id, subNodesData[i]._id],
            connection: subNodesData[i].node,
          });
        }
      }
    }
  }
}

async function connect_node_to_aboveNode(
  nodeData,
  aboveNodes,
  weight = undefined
) {
  if (aboveNodes && aboveNodes.length > 0) {
    let aboveNodesData = await Node.find({ _id: aboveNodes });
    for (let i = 0; i < aboveNodesData.length; i++) {
      if (!aboveNodesData[i].subNodes.includes(nodeData._id)) {
        aboveNodesData[i].subNodes.push(nodeData._id);

        await Node.findOneAndUpdate(
          { _id: aboveNodesData[i]._id },
          {
            $set: {
              subNodes: aboveNodesData[i].subNodes,
            },
          },
          { new: true }
        );

        if (weight) {
          makeConnection_neo4j({
            node: [aboveNodesData[i].node, nodeData.node],
            id: [aboveNodesData[i]._id, nodeData._id],
            connection: nodeData.node,
            weight: weight,
          });
        } else {
          makeConnection_neo4j({
            node: [aboveNodesData[i].node, nodeData.node],
            id: [aboveNodesData[i]._id, nodeData._id],
            connection: nodeData.node,
          });
        }
      }
    }
  }
}
