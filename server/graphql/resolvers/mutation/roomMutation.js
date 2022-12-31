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

  addNodesToMemberInRoom: async (parent, args, context, info) => {
    const { memberID, nodesID, RoomID } = args.fields;

    console.log("Mutation > addNodesToMember > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("memberID is required");

    try {
      let memberData = await Members.findOne({ _id: memberID });
      let nodesData = await Node.find({ _id: nodesID }).select("_id");

      // check if the nodes are already in the member (memberData.nodes)
      let nodesDataOriginalArray = memberData.nodes.map(function (item) {
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
          memberData.nodes.push({ _id: nodeID });
        }

        // add only the new ones as relationship on Neo4j
        for (let i = 0; i < nodesDataNew.length; i++) {
          let nodeNow = nodesDataNew[i];
          makeConnection_neo4j({
            node: ["Member", nodeNow.node],
            id: [memberData._id, nodeNow._id],
            connection: "connection",
          });

          changeMatchByServer(nodeNow, memberData);
        }
      }

      memberData2 = await Members.findOneAndUpdate(
        { _id: memberID },
        {
          $set: {
            nodes: memberData.nodes,
          },
        },
        { new: true }
      );
      pubsub.publish("SKILL_UPDATED_IN_ROOM" + RoomID, {
        memberUpdatedInRoom: memberData2,
      });
      console.log("Memmememeber00", memberData2);
      return memberData2;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  deleteNodesFromMemberInRoom: async (parent, args, context, info) => {
    const { memberID, nodesID, RoomID } = args.fields;

    console.log(
      "Mutation > deleteNodesFromMember > args.fields = ",
      args.fields
    );

    if (!memberID) throw new ApolloError("memberID is required");

    try {
      let memberData = await Members.findOne({ _id: memberID });
      let nodesData = await Node.find({ _id: nodesID }).select("_id");

      // check what nodes exist on memberData.nodes
      let nodesDataOriginalArray = memberData.nodes.map(function (item) {
        return item._id.toString();
      });

      let nodesIDArray = nodesID.map(function (item) {
        return item.toString();
      });

      let nodesExistMemberAndNode = nodesDataOriginalArray.filter((x) =>
        nodesIDArray.includes(x)
      );
      console.log("nodesExistMemberAndNode = ", nodesExistMemberAndNode);

      let nodeExistOnlyMember = nodesDataOriginalArray.filter(
        (x) => !nodesIDArray.includes(x)
      );
      console.log("nodeExistOnlyMember = ", nodeExistOnlyMember);

      // console.log("change = " , change)

      if (nodesExistMemberAndNode.length > 0) {
        let nodesDataNew = [];
        for (let i = 0; i < nodesExistMemberAndNode.length; i++) {
          let nodeID = nodesExistMemberAndNode[i];
          let nodeData = nodesData.find(
            (x) => x._id.toString() == nodeID.toString()
          );
          nodesDataNew.push(nodeData);
        }

        let nodeExistOnlyMember_id = [];
        for (let i = 0; i < nodeExistOnlyMember.length; i++) {
          let nodeID = nodeExistOnlyMember[i];
          nodeExistOnlyMember_id.push({ _id: nodeID });
        }

        memberData.nodes = nodeExistOnlyMember_id;

        // console.log("nodesDataNew = " , nodesDataNew)

        // console.log("memberData = " , memberData)

        // console.log("change = " , change)

        // add only the new ones as relationship on Neo4j
        for (let i = 0; i < nodesDataNew.length; i++) {
          let nodeNow = nodesDataNew[i];
          deleteConnectionANYBetweenNodes_neo4j({
            nodeID_1: memberData._id,
            nodeID_2: nodeNow._id,
          });

          changeMatchByServer(nodeNow, memberData);
        }
      }

      memberData2 = await Members.findOneAndUpdate(
        { _id: memberID },
        {
          $set: {
            nodes: memberData.nodes,
          },
        },
        { new: true }
      );
      pubsub.publish("SKILL_UPDATED_IN_ROOM" + RoomID, {
        memberUpdatedInRoom: memberData2,
      });

      return memberData2;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
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
