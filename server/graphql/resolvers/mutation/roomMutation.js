const { Rooms } = require("../../../models/roomsModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Skills } = require("../../../models/skillsModel");
const { ApolloError } = require("apollo-server-express");

const {
  createNode_neo4j,
  makeConnection_neo4j,
  updateNode_neo4j_serverID,
  deleteConnectionBetweenNodes_neo4j,
  findAllNodesDistanceRfromNode_neo4j,
  deleteConnectionANYBetweenNodes_neo4j,
  deleteNode_neo4j,
} = require("../../../neo4j/func_neo4j");
const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

module.exports = {
  createRoom: async (parent, args, context, info) => {
    const { _id, name, description, avatar, serverID, hostID } = args.fields;
    console.log("Mutation > createRoom > args.fields = ", args.fields);

    // if (!_id) throw new ApolloError( "_id is required, the IDs come from Discord");
    // if (!name) throw new ApolloError( "You need to specify the name of the Room");

    let fields = {
      registeredAt: new Date(),
    };

    if (_id) fields = { ...fields, _id };
    if (name) fields = { ...fields, name };

    if (description) fields = { ...fields, description };
    if (avatar) fields = { ...fields, avatar };
    if (serverID) fields = { ...fields, serverID };
    if (hostID) fields = { ...fields, hostID };

    try {
      let roomData;

      roomData = await Rooms.findOne({ _id: fields._id });

      if (!roomData) {
        console.log("fields = ", fields);
        roomData = await new Rooms(fields).save();
      } else {
        roomData = await Rooms.findOneAndUpdate(
          { name: fields.name },
          {
            $set: fields,
          },
          { new: true }
        );
      }

      return roomData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > createRoom" }
      );
    }
  },

  enterRoom: async (parent, args, context, info) => {
    const { roomID, memberID } = args.fields;
    console.log("Mutation > enterRoom > args.fields = ", args.fields);

    if (!roomID)
      throw new ApolloError("_id is required, the IDs come from Discord");
    if (!memberID)
      throw new ApolloError(
        "You need to specify the memberId to enter the Room"
      );

    let fields = {
      roomID,
      memberID,
    };

    try {
      let roomData;

      roomData = await Rooms.findOne({ _id: fields.roomID });
      if (!roomData) throw new ApolloError("RoomId does Not exists");

      const isMemberInTheRoom =
        roomData.members.indexOf(memberID) === -1 ? false : true;
      console.log(roomData);
      if (!isMemberInTheRoom) {
        const updatedMember = [...roomData.members, memberID];
        roomData = await Rooms.findOneAndUpdate(
          { _id: fields.roomID },
          {
            members: updatedMember,
          },
          { new: true }
        );
      }
      pubsub.publish(roomData._id, {
        roomUpdated: roomData,
      });
      return roomData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > enterRoom" }
      );
    }
  },
  exitRoom: async (parent, args, context, info) => {
    const { roomID, memberID } = args.fields;
    console.log("Mutation > exitRoom > args.fields = ", args.fields);

    if (!roomID)
      throw new ApolloError("_id is required, the IDs come from Discord");
    if (!memberID)
      throw new ApolloError(
        "You need to specify the memberId to Exit the Room"
      );

    let fields = {
      roomID,
      memberID,
    };

    try {
      let roomData;

      roomData = await Rooms.findOne({ _id: fields.roomID });
      if (!roomData) throw new ApolloError("RoomId does Not exists");

      const isMemberInTheRoom =
        roomData.members.indexOf(memberID) === -1 ? false : true;
      if (!isMemberInTheRoom)
        throw new ApolloError("Member is not in the Room.");
      console.log(roomData);
      if (isMemberInTheRoom) {
        const tempMembers = roomData.members;
        delete tempMembers[roomData.members.indexOf(memberID)];
        const updatedMember = tempMembers.filter((memberID) => memberID);
        roomData = await Rooms.findOneAndUpdate(
          { _id: fields.roomID },
          {
            members: updatedMember,
          },
          { new: true }
        );
      }
      pubsub.publish(roomData._id, {
        roomUpdated: roomData,
      });
      return roomData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > exitRoom" }
      );
    }
  },

  updateMemberInRoom: async (parent, args, context, info) => {
    const {
      discordName,
      memberID,
      discordAvatar,
      discriminator,
      bio,
      hoursPerWeek,
      previusProjects,
      interest,
      timeZone,
      level,
      skills,
      links,
      content,
      serverID,
      onbording,
      memberRole,
      roomID,
    } = args.fields;

    console.log("Mutation > updateMemberInRoom > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("member id is required");
    if (!roomID) throw new ApolloError("room id is required");

    let fields = {
      _id: memberID,
      registeredAt: new Date(),
    };

    if (discordAvatar) fields = { ...fields, discordAvatar };
    if (discordName) fields = { ...fields, discordName };
    if (discriminator) fields = { ...fields, discriminator };
    if (bio) fields = { ...fields, bio };
    if (hoursPerWeek) fields = { ...fields, hoursPerWeek };
    if (previusProjects) fields = { ...fields, previusProjects };
    if (interest) fields = { ...fields, interest };
    if (timeZone) fields = { ...fields, timeZone };
    if (level) fields = { ...fields, level };
    if (skills) fields = { ...fields, skills };
    if (links) fields = { ...fields, links };
    if (content) fields = { ...fields, content };
    if (memberRole) fields = { ...fields, memberRole };

    try {
      let membersData = await Members.findOne({ _id: fields._id });

      if (!membersData) {
        let newAttributes = {
          Director: 0,
          Motivator: 0,
          Inspirer: 0,
          Helper: 0,
          Supporter: 0,
          Coordinator: 0,
          Observer: 0,
          Reformer: 0,
        };

        fields = { ...fields, attributes: newAttributes };

        if (onbording) fields = { ...fields, onbording: onbording };

        if (serverID) fields.serverID = serverID;

        membersData = await new Members(fields);

        membersData.save();

        //add member node to neo4j
      } else {
        if (onbording) {
          if (
            onbording.signup != undefined &&
            onbording.percentage != undefined
          ) {
            fields = { ...fields, onbording: onbording };
          } else if (onbording.signup != undefined) {
            fields = {
              ...fields,
              onbording: { ...membersData.onbording, signup: onbording.signup },
            };
          } else if (onbording.percentage != undefined) {
            fields = {
              ...fields,
              onbording: {
                ...membersData.onbording,
                percentage: onbording.percentage,
              },
            };
          }
        }

        if (!membersData.serverID) {
          if (serverID) fields.serverID = serverID;
        } else {
          let serverID_new = [...membersData.serverID];
          if (!membersData.serverID.includes(serverID)) {
            serverID_new.push(serverID);
          }
          if (serverID) fields.serverID = serverID_new;
        }

        membersData = await Members.findOneAndUpdate(
          { _id: fields._id },
          fields,
          { new: true }
        );
      }

      pubsub.publish("SKILL_UPDATED_IN_ROOM" + roomID, {
        memberUpdatedInRoom: membersData,
      });
      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  // DEPRECATED
  // addNodesToMemberInRoom: async (parent, args, context, info) => {
  //   const { memberID, nodesID, RoomID } = args.fields;

  //   console.log("Mutation > addNodesToMember > args.fields = ", args.fields);

  //   if (!memberID) throw new ApolloError("memberID is required");

  //   try {
  //     let memberData = await Members.findOne({ _id: memberID });
  //     let nodesData = await Node.find({ _id: nodesID }).select("_id name node");

  //     // check if the nodes are already in the member (memberData.nodes)
  //     let nodesDataOriginalArray = memberData.nodes.map(function (item) {
  //       return item._id.toString();
  //     });

  //     let nodesIDArray = nodesID.map(function (item) {
  //       return item.toString();
  //     });

  //     let differenceNodes = nodesIDArray.filter(
  //       (x) => !nodesDataOriginalArray.includes(x)
  //     );
  //     console.log("differenceNodes = ", differenceNodes);

  //     if (differenceNodes.length > 0) {
  //       let nodesDataNew = [];
  //       for (let i = 0; i < differenceNodes.length; i++) {
  //         let nodeID = differenceNodes[i];
  //         let nodeData = nodesData.find(
  //           (x) => x._id.toString() == nodeID.toString()
  //         );
  //         nodesDataNew.push(nodeData);
  //         memberData.nodes.push({ _id: nodeID });
  //       }

  //       // add only the new ones as relationship on Neo4j
  //       for (let i = 0; i < nodesDataNew.length; i++) {
  //         let nodeNow = nodesDataNew[i];
  //         makeConnection_neo4j({
  //           node: ["Member", nodeNow.node],
  //           id: [memberData._id, nodeNow._id],
  //           connection: "connection",
  //         });

  //         changeMatchByServer(nodeNow, memberData);
  //       }
  //     }

  //     memberData2 = await Members.findOneAndUpdate(
  //       { _id: memberID },
  //       {
  //         $set: {
  //           nodes: memberData.nodes,
  //         },
  //       },
  //       { new: true }
  //     );
  //     pubsub.publish("SKILL_UPDATED_IN_ROOM" + RoomID, {
  //       memberUpdatedInRoom: memberData2,
  //     });
  //     console.log("Memmememeber00", memberData2);
  //     return memberData2;
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //       { component: "tmemberQuery > findMember" }
  //     );
  //   }
  // },

  // DEPRECATED
  // deleteNodesFromMemberInRoom: async (parent, args, context, info) => {
  //   const { memberID, nodesID, RoomID } = args.fields;

  //   console.log(
  //     "Mutation > deleteNodesFromMember > args.fields = ",
  //     args.fields
  //   );

  //   if (!memberID) throw new ApolloError("memberID is required");

  //   try {
  //     let memberData = await Members.findOne({ _id: memberID });
  //     let nodesData = await Node.find({ _id: nodesID }).select("_id name node");

  //     // check what nodes exist on memberData.nodes
  //     let nodesDataOriginalArray = memberData.nodes.map(function (item) {
  //       return item._id.toString();
  //     });

  //     let nodesIDArray = nodesID.map(function (item) {
  //       return item.toString();
  //     });

  //     let nodesExistMemberAndNode = nodesDataOriginalArray.filter((x) =>
  //       nodesIDArray.includes(x)
  //     );
  //     console.log("nodesExistMemberAndNode = ", nodesExistMemberAndNode);

  //     let nodeExistOnlyMember = nodesDataOriginalArray.filter(
  //       (x) => !nodesIDArray.includes(x)
  //     );
  //     console.log("nodeExistOnlyMember = ", nodeExistOnlyMember);

  //     // console.log("change = " , change)

  //     if (nodesExistMemberAndNode.length > 0) {
  //       let nodesDataNew = [];
  //       for (let i = 0; i < nodesExistMemberAndNode.length; i++) {
  //         let nodeID = nodesExistMemberAndNode[i];
  //         let nodeData = nodesData.find(
  //           (x) => x._id.toString() == nodeID.toString()
  //         );
  //         nodesDataNew.push(nodeData);
  //       }

  //       let nodeExistOnlyMember_id = [];
  //       for (let i = 0; i < nodeExistOnlyMember.length; i++) {
  //         let nodeID = nodeExistOnlyMember[i];
  //         nodeExistOnlyMember_id.push({ _id: nodeID });
  //       }

  //       memberData.nodes = nodeExistOnlyMember_id;

  //       // console.log("nodesDataNew = " , nodesDataNew)

  //       // console.log("memberData = " , memberData)

  //       // console.log("change = " , change)

  //       // add only the new ones as relationship on Neo4j
  //       for (let i = 0; i < nodesDataNew.length; i++) {
  //         let nodeNow = nodesDataNew[i];
  //         deleteConnectionANYBetweenNodes_neo4j({
  //           nodeID_1: memberData._id,
  //           nodeID_2: nodeNow._id,
  //         });

  //         changeMatchByServer(nodeNow, memberData);
  //       }
  //     }

  //     memberData2 = await Members.findOneAndUpdate(
  //       { _id: memberID },
  //       {
  //         $set: {
  //           nodes: memberData.nodes,
  //         },
  //       },
  //       { new: true }
  //     );
  //     pubsub.publish("SKILL_UPDATED_IN_ROOM" + RoomID, {
  //       memberUpdatedInRoom: memberData2,
  //     });

  //     return memberData2;
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
  //       { component: "tmemberQuery > findMember" }
  //     );
  //   }
  // },
  updateNodesToMemberInRoom: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const memberID = user._id;
      console.log(
        "Mutation > updateNodesToMemberInRoom > args.fields = ",
        args.fields
      );
      let { nodesID, nodesID_level, nodeType, roomID } = args.fields;

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
        nodesID_array = [];
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

        let memberData = await Members.findOne({ _id: memberID }).select(
          "_id nodes"
        );

        let nodes_member_obj = {};
        for (let i = 0; i < memberData.nodes.length; i++) {
          let item = memberData.nodes[i];
          nodes_member_obj[item._id] = item;
        }
        console.log("nodes_member_obj = ", nodes_member_obj);

        // check if the nodes are already in the member (memberData.nodes)
        let nodesID_member = memberData.nodes.map(function (item) {
          return item._id.toString();
        });

        // --------- Separate all the Nodes, and the nodeTypes ----------------
        let nodeData_member_all = await Node.find({
          _id: nodesID_member,
        }).select("_id name node");

        // console.log("nodeData_member_all = ", nodeData_member_all);
        // // sdf;

        nodeData_member_type = [];
        nodeID_member_type = [];
        nodeID_member_all = [];
        nodeData_member_all.forEach((node, idx) => {
          nodeID_member_all.push(node._id.toString());
          // console.log(
          //   "change = ",
          //   nodes_member_obj[node._id.toString()].level,
          //   nodesID_level_obj[node._id.toString()].level
          // );

          if (nodes_member_obj[node._id] && nodesID_level_obj[node._id]) {
            if (
              nodes_member_obj[node._id].level ==
                nodesID_level_obj[node._id].level &&
              nodes_member_obj[node._id].orderIndex ==
                nodesID_level_obj[node._id].orderIndex
            ) {
              if (node.node == nodeType) {
                nodeData_member_type.push(node);
                nodeID_member_type.push(node._id.toString());
              }
            }
          } else {
            if (node.node == nodeType) {
              nodeData_member_type.push(node);
              nodeID_member_type.push(node._id.toString());
            }
          }

          nodeData_member_all[idx] = {
            ...nodeData_member_all[idx]._doc,
            ...nodes_member_obj[node._id.toString()]._doc,
            ...nodesID_level_obj[node._id.toString()],
          };
        });

        // asfd;

        console.log("nodesID_array = ", nodesID_array);
        console.log("nodeID_member_type = ", nodeID_member_type);

        console.log("nodeData_member_all = ", nodeData_member_all);
        // asdf;

        // --------- Separate all the Nodes, and the nodeTypes ----------------

        // asdf;

        /// --------------- Add Nodes that Don't exist already on the member for this specific type of node ----------------
        let differenceNodes = nodesID_array.filter(
          (x) => !nodeID_member_type.includes(x)
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

              // console.log("nodeNow_weight = ", nodeNow_weight);
              // sadf;

              nodesDataNew.push({
                ...nodeData._doc,
                weight: nodeNow_weight.weight_total,
              });
              nodeData_member_all.push({
                _id: nodeID,
                orderIndex: nodeNow_weight.orderIndex,
                level: nodeNow_weight.level,
                weight: nodeNow_weight.weight_total,
                aboveNodes: nodesID_level_obj[nodeID].aboveNodes,
              });
            } else {
              nodesDataNew.push(nodeData);
              nodeData_member_all.push({ _id: nodeID });
            }
            // nodesDataNew.push(nodeData);
            // nodeData_member_all.push({ _id: nodeID });
          }

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodesDataNew.length; i++) {
            let nodeNow = nodesDataNew[i];

            if (nodeNow.weight != undefined) {
              makeConnection_neo4j({
                node: [nodeNow.node, "Member"],
                id: [nodeNow._id, memberData._id],
                connection: "connection",
                weight: nodeNow.weight.toFixed(3),
              });
            } else {
              makeConnection_neo4j({
                node: [nodeNow.node, "Member"],
                id: [nodeNow._id, memberData._id],
                connection: "connection",
              });
            }

            changeMatchByServer(nodeNow, memberData);
          }
        }
        /// --------------- Add Nodes that Don't exist already on the member for this specific type of node ----------------

        // -------------- Remove the Nodes that are not in the nodesID_array ----------------
        let nodesExistMemberAndNode = nodeID_member_type.filter((x) =>
          nodesID_array.includes(x)
        );
        console.log("nodesExistMemberAndNode = ", nodesExistMemberAndNode);

        let nodeExistOnlyMember = nodeID_member_type.filter(
          (x) => !nodesID_array.includes(x)
        );
        console.log("nodeExistOnlyMember = ", nodeExistOnlyMember);
        console.log("nodeID_member_type = ", nodeID_member_type);
        console.log("nodesID_array = ", nodesID_array);
        // asd;

        // console.log("change = " , change)

        if (nodeExistOnlyMember.length > 0) {
          nodeData_member_all = nodeData_member_all.filter(
            (element) => !nodeExistOnlyMember.includes(element._id.toString())
          );

          console.log("nodeData_member_all = ", nodeData_member_all);

          console.log("nodeExistOnlyMember = ", nodeExistOnlyMember);

          // add only the new ones as relationship on Neo4j
          for (let i = 0; i < nodeExistOnlyMember.length; i++) {
            let nodeNow = { _id: nodeExistOnlyMember[i] };
            deleteConnectionANYBetweenNodes_neo4j({
              nodeID_1: memberData._id,
              nodeID_2: nodeNow._id,
            });

            changeMatchByServer(nodeNow, memberData);
          }
        }
        // -------------- Remove the Nodes that are not in the nodesID_array ----------------

        console.log("nodeData_member_all = ", nodeData_member_all);
        // asdf;

        const memberData2 = await Members.findOneAndUpdate(
          { _id: memberID },
          {
            $set: {
              nodes: nodeData_member_all,
            },
          },
          { new: true }
        );

        pubsub.publish("SKILL_UPDATED_IN_ROOM" + roomID, {
          memberUpdatedInRoom: memberData2,
        });

        return memberData2;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "roomMutation",
          { component: "roomMutation > updateNodesToMemberInRoom" }
        );
      }
    }
  ),
  roomUpdated: {
    subscribe: (parent, args, context, info) => {
      const { _id } = args.fields;
      console.log("Mutation > roomUpdated > args.fields = ", args.fields);

      if (!_id)
        throw new ApolloError("_id is required, the IDs come from Discord");
      return pubsub.asyncIterator(_id);
    },
  },

  memberUpdatedInRoom: {
    subscribe: (parent, args, context, info) => {
      const { _id } = args.fields;
      console.log("Mutation > newSkillInRoom > args.fields = ", args.fields);
      if (!_id)
        throw new ApolloError("_id is required, the IDs come from Discord");
      return pubsub.asyncIterator("SKILL_UPDATED_IN_ROOM" + _id);
    },
  },
};
const changeMatchByServer = async (nodeNow, memberData) => {
  // find all the Nodes that need to change around the nodeNow
  // console.log("nodeNow = " , nodeNow)
  let allNodesDistanceR = await findAllNodesDistanceRfromNode_neo4j({
    nodeID: nodeNow._id,
  });

  // console.log("allNodesDistanceR = " , allNodesDistanceR)
  // console.log("change = " , change)

  // find all the node data from the allNodesDistanceR and then loop throw them
  let allNodesDistanceR_Data = await Node.find({
    _id: allNodesDistanceR,
  }).select("_id match_v2_update");

  // loop throw all the nodes and change the matchByServer
  for (let i = 0; i < allNodesDistanceR_Data.length; i++) {
    let node_n = allNodesDistanceR_Data[i];

    // Update the node
    let nodeData3 = await Node.findOneAndUpdate(
      { _id: node_n._id },
      {
        $set: {
          match_v2_update: {
            member: true,
            projectRole: node_n.match_v2_update.projectRole,
          },
        },
      },
      { new: true }
    );
  }
};
