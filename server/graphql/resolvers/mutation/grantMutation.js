const { GrantTemplate } = require("../../../models/grantModel");
const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");

const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID_f,
  makeConnection_neo4j,
} = require("../../../neo4j/func_neo4j");

const { ApolloError } = require("apollo-server-express");

const { combineResolvers } = require("graphql-resolvers");
const {
  IsAuthenticated,
  IsOnlyOperator,
} = require("../../../utils/authorization");

module.exports = {
  updateGrant: combineResolvers(
    IsAuthenticated,
    IsOnlyOperator,
    async (parent, args, context, info) => {
      const {
        _id,
        name,
        description,
        smallDescription,
        tags,
        requirments,
        applicationProcess,
        difficulty,
        distributed,
        maxDistributed,
        resources,
        amount,
        avatar,
        serverID,
      } = args.fields;
      console.log("Mutation > updateGrant > args.fields = ", args.fields);

      let fields = {};

      if (_id) fields._id = _id;
      if (name) fields.name = name;
      if (description) fields.description = description;
      if (smallDescription) fields.smallDescription = smallDescription;
      if (tags) fields.tags = tags;
      if (applicationProcess) fields.applicationProcess = applicationProcess;
      if (requirments) fields.requirments = requirments;
      if (difficulty) fields.difficulty = difficulty;
      if (distributed) fields.distributed = distributed;
      if (maxDistributed) fields.maxDistributed = maxDistributed;
      if (resources) fields.resources = resources;
      if (amount) fields.amount = amount;
      if (avatar) fields.avatar = avatar;
      if (serverID) fields.serverID = serverID;

      try {
        let grantData;
        if (_id) {
          grantData = await GrantTemplate.findOne({ _id: _id });
          if (!grantData) {
            grantData = await new GrantTemplate(fields);
            grantData.save();

            await createNode_neo4j({
              node: "Grant",
              id: grantData._id,
              name: grantData.name,
              serverID: grantData.serverID,
            });
          } else {
            grantData = await GrantTemplate.findOneAndUpdate(
              { _id: grantData._id },
              {
                $set: fields,
              },
              { new: true }
            );

            updateNode_neo4j_serverID_f({
              node: "Grant",
              id: grantData._id,
              serverID: grantData.serverID,
            });
          }
        } else {
          grantData = await new GrantTemplate(fields);
          grantData.save();

          await createNode_neo4j({
            node: "Grant",
            id: grantData._id,
            name: grantData.name,
            serverID: grantData.serverID,
          });
        }

        return grantData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }
    }
  ),
  applyGrant: combineResolvers(
    IsAuthenticated,
    IsOnlyOperator,
    async (parent, args, context, info) => {
      const { memberID, grantID } = args.fields;
      console.log("Mutation > applyGrant > args.fields = ", args.fields);

      if (!grantID) throw new ApolloError("grantID is required");
      if (!memberID) throw new ApolloError("memberID is required");

      let fields = {};

      if (memberID) fields.memberID = memberID;
      if (grantID) fields.grantID = grantID;

      try {
        let grantData = await GrantTemplate.findOne({ _id: grantID });
        let memberData = await Members.find({ _id: memberID });

        if (!grantData) throw new ApolloError("Grant Don't Exist");
        if (!memberData) throw new ApolloError("Member Don't exist");

        console.log("grantData = ", grantData);
        console.log("memberData = ", memberData);

        if (!grantData.membersApplied.includes(memberID.toString())) {
          grantData.membersApplied.push(memberID.toString());
        }

        await GrantTemplate.findOneAndUpdate(
          { _id: grantData._id },
          { $set: { membersApplied: grantData.membersApplied } },
          { new: true }
        );

        // console.log("memberID = ", memberID);

        return grantData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }
    }
  ),
  addNodesToGrant: combineResolvers(
    IsAuthenticated,
    IsOnlyOperator,
    async (parent, args, context, info) => {
      const { grantID, nodesID } = args.fields;

      console.log("Mutation > addNodesToGrant > args.fields = ", args.fields);

      if (!grantID) throw new ApolloError("grantID is required");

      try {
        let grantData = await GrantTemplate.findOne({ _id: grantID });
        let nodesData = await Node.find({ _id: nodesID });

        console.log("grantData = ", grantData);
        console.log("nodesData = ", nodesData);

        // check if the nodes are already in the member (grantData.nodes)
        let nodesDataOriginalArray = grantData.nodes.map(function (item) {
          return item._id.toString();
        });

        let nodesIDArray = nodesID.map(function (item) {
          return item.toString();
        });

        let differenceNodes = nodesIDArray.filter(
          (x) => !nodesDataOriginalArray.includes(x)
        );
        console.log("differenceNodes = ", differenceNodes);

        if (differenceNodes.length > 0) {
          let nodesDataNew = [];
          for (let i = 0; i < differenceNodes.length; i++) {
            let nodeID = differenceNodes[i];
            let nodeData = nodesData.find(
              (x) => x._id.toString() == nodeID.toString()
            );
            nodesDataNew.push(nodeData);
            grantData.nodes.push({ _id: nodeID });
          }

          console.log("nodesDataNew = ", nodesDataNew);
          console.log("grantData.nodes = ", grantData.nodes);

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodesDataNew.length; i++) {
            let nodeNow = nodesDataNew[i];
            makeConnection_neo4j({
              node: ["Grant", nodeNow.node],
              id: [grantData._id, nodeNow._id],
              connection: "connection",
            });

            // changeMatchByServer(nodeNow, grantData);
          }
        }

        grantData2 = await GrantTemplate.findOneAndUpdate(
          { _id: grantID },
          {
            $set: {
              nodes: grantData.nodes,
            },
          },
          { new: true }
        );

        return grantData2;
        // return {};
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > findMember" }
        );
      }
    }
  ),
  updateNodesToGrant: combineResolvers(
    IsAuthenticated,
    IsOnlyOperator,
    async (parent, args, { user }, info) => {
      console.log(
        "Mutation > updateNodesToGrant > args.fields = ",
        args.fields
      );
      let { grantID, nodesID, nodesID_level, nodeType } = args.fields;

      if (!grantID) throw new ApolloError("The grant ID is required");

      let grantData = await GrantTemplate.findOne({ _id: grantID }).select(
        "_id nodes"
      );

      if (!grantData) throw new ApolloError("The grant does not exist");

      if (!(nodesID == undefined || nodesID_level == undefined))
        throw new ApolloError(
          "you need to use nodesID or nodesID_level, you cant use both"
        );

      try {
        let nodesID_level_obj = {};
        if (nodesID == undefined) {
          nodesID = nodesID_level.map((item) => item.nodeID);

          // change nodesID_level from array of objects to an object
          for (let i = 0; i < nodesID_level.length; i++) {
            let item = nodesID_level[i];
            nodesID_level_obj[item.nodeID] = item;
          }
        }
        console.log("nodesID_level_obj = ", nodesID_level_obj);

        let nodesData = await Node.find({ _id: nodesID }).select(
          "_id name node match_v2_update"
        );

        console.log("nodesData = ", nodesData);
        // sdf;

        // ---------- All nodes should be equal to nodeType or else throw error -----------
        let nodesID_array = [];
        nodesData.forEach((node) => {
          nodesID_array.push(node._id.toString());
          if (node.node != nodeType) {
            throw new ApolloError(
              "All nodes should be equal to nodeType, problem on nodeID = " +
                node._id +
                " with name = " +
                node.name +
                " and node = " +
                node.node +
                ""
            );
          }
        });
        // ---------- All nodes should be equal to nodeType or else throw error -----------

        let nodes_grant_obj = {};
        for (let i = 0; i < grantData.nodes.length; i++) {
          let item = grantData.nodes[i];
          nodes_grant_obj[item._id] = item;
        }
        console.log("nodes_grant_obj = ", nodes_grant_obj);

        // check if the nodes are already in the grant (grantData.nodes)
        let nodesID_grant = grantData.nodes.map(function (item) {
          return item._id.toString();
        });

        // --------- Separate all the Nodes, and the nodeTypes ----------------
        let nodeData_grant_all = await Node.find({
          _id: nodesID_grant,
        }).select("_id name node");

        // console.log("nodeData_member_all = ", nodeData_member_all);
        // // sdf;

        let nodeData_grant_type = [];
        let nodeID_grant_type = [];
        let nodeID_grant_all = [];
        nodeData_grant_all.forEach((node, idx) => {
          nodeID_grant_all.push(node._id.toString());

          if (nodes_grant_obj[node._id] && nodesID_level_obj[node._id]) {
            if (
              nodes_grant_obj[node._id].level ==
                nodesID_level_obj[node._id].level &&
              nodes_grant_obj[node._id].orderIndex ==
                nodesID_level_obj[node._id].orderIndex
            ) {
              if (node.node == nodeType) {
                nodeData_grant_type.push(node);
                nodeID_grant_type.push(node._id.toString());
              }
            }
          } else {
            if (node.node == nodeType) {
              nodeData_grant_type.push(node);
              nodeID_grant_type.push(node._id.toString());
            }
          }

          nodeData_grant_all[idx] = {
            ...nodeData_grant_all[idx]._doc,
            ...nodes_grant_obj[node._id.toString()]._doc,
            ...nodesID_level_obj[node._id.toString()],
          };
        });

        // asfd;

        console.log("nodesID_array = ", nodesID_array);
        console.log("nodeID_grant_type = ", nodeID_grant_type);

        console.log("nodeData_grant_all = ", nodeData_grant_all);
        // asdf;

        // --------- Separate all the Nodes, and the nodeTypes ----------------

        // asdf;

        /// --------------- Add Nodes that Don't exist already on the grant for this specific type of node ----------------
        let differenceNodes = nodesID_array.filter(
          (x) => !nodeID_grant_type.includes(x)
        );
        console.log("differenceNodes = ", differenceNodes);

        // asf;
        if (differenceNodes.length > 0) {
          let nodesDataNew = [];
          for (let i = 0; i < differenceNodes.length; i++) {
            let nodeID = differenceNodes[i];
            let nodeData = nodesData.find(
              (x) => x._id.toString() == nodeID.toString()
            );

            if (nodesID_level != undefined) {
              // caluclate the skill level and add it to the nodes for the next phase
              let nodeNow_weight = await calculate_skill_level(
                nodesID_level_obj[nodeID]
              );

              nodesDataNew.push({
                ...nodeData._doc,
                weight: nodeNow_weight.weight_total,
              });
              nodeData_grant_all.push({
                _id: nodeID,
                orderIndex: nodeNow_weight.orderIndex,
                level: nodeNow_weight.level,
                weight: nodeNow_weight.weight_total,
                aboveNodes: nodesID_level_obj[nodeID].aboveNodes,
              });
            } else {
              nodesDataNew.push(nodeData);
              nodeData_grant_all.push({ _id: nodeID });
            }
          }

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodesDataNew.length; i++) {
            let nodeNow = nodesDataNew[i];

            if (nodeNow.weight != undefined) {
              makeConnection_neo4j({
                node: [nodeNow.node, "Grant"],
                id: [nodeNow._id, grantData._id],
                connection: "connection",
                weight: nodeNow.weight.toFixed(3),
              });
            } else {
              makeConnection_neo4j({
                node: [nodeNow.node, "Grant"],
                id: [nodeNow._id, grantData._id],
                connection: "connection",
              });
            }

            //changeMatchByServer(nodeNow, grantData);
          }
        }
        /// --------------- Add Nodes that Don't exist already on the member for this specific type of node ----------------

        // -------------- Remove the Nodes that are not in the nodesID_array ----------------
        let nodesExistGrantAndNode = nodeID_grant_type.filter((x) =>
          nodesID_array.includes(x)
        );
        console.log("nodesExistGrantAndNode = ", nodesExistGrantAndNode);

        let nodeExistOnlyGrant = nodeID_grant_type.filter(
          (x) => !nodesID_array.includes(x)
        );
        console.log("nodeExistOnlyGrant = ", nodeExistOnlyGrant);
        console.log("nodeID_grant_type = ", nodeID_grant_type);
        console.log("nodesID_array = ", nodesID_array);

        if (nodeExistOnlyGrant.length > 0) {
          nodeData_grant_all = nodeData_grant_all.filter(
            (element) => !nodeExistOnlyGrant.includes(element._id.toString())
          );

          console.log("nodeData_grant_all = ", nodeData_grant_all);

          console.log("nodeExistOnlyGrant = ", nodeExistOnlyGrant);

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodeExistOnlyGrant.length; i++) {
            let nodeNow = { _id: nodeExistOnlyGrant[i] };
            deleteConnectionANYBetweenNodes_neo4j({
              nodeID_1: grantData._id,
              nodeID_2: nodeNow._id,
            });

            //changeMatchByServer(nodeNow, grantData);
          }
        }
        // -------------- Remove the Nodes that are not in the nodesID_array ----------------

        console.log("nodeData_grant_all = ", nodeData_grant_all);
        // asdf;

        const grantData2 = await GrantTemplate.findOneAndUpdate(
          { _id: grantID },
          {
            $set: {
              nodes: nodeData_grant_all,
            },
          },
          { new: true }
        );
        return grantData2;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "grantMutation",
          { component: "grantMutation > updateNodesToGrant" }
        );
      }
    }
  ),
};

// create async function that will change matchByServer
const changeMatchByServer = async (nodeNow, memberData) => {
  // find all the Nodes that need to change around the nodeNow
  // console.log("nodeNow = " , nodeNow)
  let allNodesDistanceR = await findAllNodesDistanceRfromNode_neo4j({
    nodeID: nodeNow._id,
  });

  // console.log("allNodesDistanceR = " , allNodesDistanceR)
  // console.log("change = " , change)

  // find all the node data from the allNodesDistanceR and then loop throw them
  let allNodesDistanceR_Data = await Node.find({ _id: allNodesDistanceR });

  // loop throw all the nodes and change the matchByServer
  for (let i = 0; i < allNodesDistanceR_Data.length; i++) {
    let node_n = allNodesDistanceR_Data[i];

    // // / ---------- Change matchByServer -----------
    // let matchByServer = node_n.matchByServer;

    // console.log("serverID_n ----------= ", memberData.serverID);

    // for (let i = 0; i < memberData.serverID.length; i++) {
    //   let serverID_n = memberData.serverID[i];

    //   console.log("node_n = ", node_n);
    //   console.log("matchByServer = ", matchByServer);

    //   if (matchByServer === undefined) {
    //     matchByServer = [
    //       {
    //         serverID: serverID_n,
    //         match: {
    //           recalculateProjectRoles: true,
    //           distanceProjectRoles: [],

    //           recalculateMembers: true,
    //           distanceMembers: [],
    //         },
    //       },
    //     ];
    //   } else {
    //     // find the position serverID_n exist on matchByServer dictionary
    //     let position = matchByServer.findIndex((x) => x.serverID == serverID_n);

    //     if (position === -1) {
    //       // if it does not exist, add it
    //       matchByServer.push({
    //         serverID: serverID_n,
    //         match: {
    //           recalculateProjectRoles: true,
    //           distanceProjectRoles: [],

    //           recalculateMembers: true,
    //           distanceMembers: [],
    //         },
    //       });
    //     } else {
    //       // if it exist, change it
    //       matchByServer[position].match.recalculateProjectRoles = true;
    //       matchByServer[position].match.recalculateMembers = true;
    //     }
    //   }
    // }
    // // ---------- Change matchByServer -----------

    // Update the node
    let nodeData3 = await Node.findOneAndUpdate(
      { _id: node_n._id },
      {
        $set: {
          // matchByServer_update: true,
          // matchByServer: matchByServer,
          match_v2_update: {
            member: true,
            projectRole: true,
          },
        },
      },
      { new: true }
    );
  }
};
