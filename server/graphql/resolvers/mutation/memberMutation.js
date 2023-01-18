const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Skills } = require("../../../models/skillsModel");
const { Projects } = require("../../../models/projectsModel");
const { RoleTemplate } = require("../../../models/roleTemplateModal");

const { ApolloError } = require("apollo-server-express");
const { driver } = require("../../../../server/neo4j_config");
const {
  createNode_neo4j,
  makeConnection_neo4j,
  updateNode_neo4j_serverID,
  deleteConnectionBetweenNodes_neo4j,
  findAllNodesDistanceRfromNode_neo4j,
  deleteConnectionANYBetweenNodes_neo4j,
  deleteNode_neo4j,
} = require("../../../neo4j/func_neo4j");

const { uploadFileToArweave } = require("../../../utils/uploadFileToArweave");

const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

module.exports = {
  addNewMember: async (parent, args, context, info) => {
    const {
      discordName,
      _id,
      discordAvatar,
      discriminator,
      bio,
      hoursPerWeek,
      previusProjects,
      invitedBy,
      serverID,
    } = args.fields;
    console.log("Mutation > addNewMember > args.fields = ", args.fields);

    if (!_id)
      throw new ApolloError("_id is required, the IDs come from Discord");

    let fields = {
      _id,
      registeredAt: new Date(),
    };

    if (discordName) fields.discordName = discordName;
    if (discordAvatar) fields.discordAvatar = discordAvatar;
    if (discriminator) fields.discriminator = discriminator;
    if (bio) fields.bio = bio;
    if (hoursPerWeek) fields.hoursPerWeek = hoursPerWeek;
    if (previusProjects) fields.previusProjects = previusProjects;
    if (invitedBy) fields.invitedBy = invitedBy;

    // console.log("fields = " , fields)

    try {
      let membersData = await Members.findOne({ _id: fields._id });

      //console.log("membersData = " , membersData)

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

        if (serverID) fields.serverID = serverID;

        membersData = await new Members(fields);

        membersData.save();

        //add member node to neo4j
        await createNode_neo4j({
          node: "Member",
          id: fields._id,
          name: fields.discordName,
          serverID: membersData.serverID,
        });

        if (invitedBy) {
          await makeConnection_neo4j({
            node: ["Member", "Member"],
            id: [fields._id, invitedBy],
            connection: "INVITED_BY",
          });
        }
      } else {
        if (!membersData.serverID) {
          membersData = await Members.findOneAndUpdate(
            { _id: membersData._id },
            { serverID: serverID },
            { new: true }
          );

          updateNode_neo4j_serverID({
            node: "Member",
            id: membersData._id,
            serverID: membersData.serverID,
          });
        } else {
          let serverID_new = [...membersData.serverID];
          if (!membersData.serverID.includes(serverID)) {
            serverID_new.push(serverID);
          }
          membersData = await Members.findOneAndUpdate(
            { _id: membersData._id },
            { serverID: serverID_new },
            { new: true }
          );

          updateNode_neo4j_serverID({
            node: "Member",
            id: membersData._id,
            serverID: serverID_new,
          });
        }
      }

      pubsub.publish(membersData._id, {
        memberUpdated: membersData,
      });
      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember" }
      );
    }
  },
  updateMember: async (parent, args, context, info) => {
    const {
      discordName,
      _id,
      discordAvatar,
      discriminator,
      bio,
      hoursPerWeek,
      previusProjects,
      interest,
      timeZone,
      level,
      links,
      content,
      serverID,
      onbording,
      memberRole,
    } = args.fields;

    let { skills } = args.fields;

    console.log("Mutation > updateMember > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("_id is required");

    let fields = {
      _id,
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

    if (links) fields = { ...fields, links };
    if (content) fields = { ...fields, content };
    if (memberRole) fields = { ...fields, memberRole };

    let membersData = await Members.findOne({ _id: fields._id });
    let membersDataOriginal = membersData;

    // console.log("memberRole = " , memberRole)
    // console.log("skills = " , skills)
    // console.log("membersData.skills = " , membersData.skills)

    // -------- Role -> Skill -----------
    if (memberRole) {
      let roleTemplateData = await RoleTemplate.findOne({ _id: memberRole });
      if (roleTemplateData) {
        if (!skills) {
          skills = membersData.skills;
        }

        let skillID = [];
        skills.forEach((skill) => {
          skillID.push(skill.id.toString());
        });

        roleTemplateData.skills.forEach((skill) => {
          if (!skillID.includes(skill.toString())) {
            skills.push({
              id: skill,
              level: "mid",
            });
          }
        });
      }
    }
    // -------- Role -> Skill -----------
    // console.log("skills = " , skills)

    if (skills) fields = { ...fields, skills };

    try {
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

        if (serverID && serverID.length > 0) fields.serverID = serverID;

        membersData = await new Members(fields);

        membersData.save();

        //add member node to neo4j
        await createNode_neo4j({
          node: "Member",
          id: fields._id,
          name: fields.discordName,
          serverID: membersData.serverID,
        });
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
          if (serverID && serverID.length > 0) fields.serverID = serverID;
        } else {
          let serverID_new = [...membersData.serverID];
          if (serverID && serverID.length > 0) {
            for (let i = 0; i < serverID.length; i++) {
              const currentServerID = serverID[i];
              if (!membersData.serverID.includes(currentServerID)) {
                serverID_new.push(currentServerID);
              }
            }
            fields.serverID = serverID_new;
          }
        }

        membersData = await Members.findOneAndUpdate(
          { _id: fields._id },
          fields,
          { new: true }
        );

        // console.log("change = -----", membersData.serverID);
        // console.log("change = -----", membersData.serverID.length);
        // console.log("change = -----", fields.serverID);
        // console.log("change = -----", fields.serverID.length);

        // console.log("membersData = " , membersData)
        if (membersData.serverID && membersData.serverID.length > 0) {
          console.log("change = ");
          updateNode_neo4j_serverID({
            node: "Member",
            id: membersData._id,
            serverID: membersData.serverID,
          });
        }
      }

      if (skills) {
        //  ---------------- Delete Connection of Deleted Skills ----------------
        console.log(
          "membersDataOriginal.skills = ",
          membersDataOriginal.skills
        );
        console.log("skills = ", skills);

        let membersDataOriginalArray = membersDataOriginal.skills.map(function (
          item
        ) {
          return item.id.toString();
        });

        let skillsArray = skills.map(function (item) {
          return item.id.toString();
        });

        console.log("membersDataOriginalArray = ", membersDataOriginalArray);
        console.log("skillsArray = ", skillsArray);

        // let difference = skills.filter(x => !membersDataOriginalArray.includes(x.id));
        let difference = membersDataOriginalArray.filter(
          (x) => !skillsArray.includes(x)
        );

        console.log("difference = ", difference);

        for (let i = 0; i < difference.length; i++) {
          let skillID = difference[i];
          deleteConnectionBetweenNodes_neo4j({
            skillID: skillID,
            memberID: membersData._id,
          });

          let skillDataN = await Skills.findOne({ _id: skillID });

          await Skills.findOneAndUpdate(
            { _id: skillID },
            {
              $set: {
                match: {
                  recalculateProjectRoles: true,
                  distanceProjectRoles: skillDataN?.match?.distanceProjectRoles,

                  recalculateMembers: true,
                  distanceMembers: skillDataN?.match?.distanceMembers,
                },
              },
            },
            { new: true }
          );
        }

        //  ---------------- Delete Connection of Deleted Skills ----------------

        for (let i = 0; i < skills.length; i++) {
          let skill = skills[i];

          makeConnection_neo4j({
            node: ["Member", "Skill"],
            id: [membersData._id, skill.id],
            connection: "SKILL",
          });

          // Recalculate the skill match now that neo4j diagram changed

          let skillDataN = await Skills.findOne({ _id: skill.id });

          let res2 = await Skills.findOneAndUpdate(
            { _id: skill.id },
            {
              $set: {
                match: {
                  recalculateProjectRoles: true,
                  distanceProjectRoles: skillDataN?.match?.distanceProjectRoles,

                  recalculateMembers: true,
                  distanceMembers: skillDataN?.match?.distanceMembers,
                },
              },
            },
            { new: true }
          );
          // console.log("res2 = " , res2)
        }
      }

      pubsub.publish(membersData._id, {
        memberUpdated: membersData,
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

  addNodesToMember: async (parent, args, context, info) => {
    let { memberID, nodesID, nodesID_level } = args.fields;

    console.log("Mutation > addNodesToMember > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("memberID is required");

    if (!(nodesID == undefined || nodesID_level == undefined))
      throw new ApolloError(
        "you need to use nodesID or nodesID_level, you cant use both"
      );

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
    // safd;

    try {
      let memberData = await Members.findOne({ _id: memberID });

      let nodesData = await Node.find({ _id: nodesID }).select(
        "_id node match_v2_update"
      );

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

          if (nodesID_level != undefined) {
            // caluclate the skill level and add it to the nodes for the next phase
            let nodeNow_weight = await calculate_skill_level(
              nodesID_level_obj[nodeID]
            );

            nodesDataNew.push({
              ...nodeData._doc,
              weight: nodeNow_weight.weight_total,
            });
            memberData.nodes.push({
              _id: nodeID,
              orderIndex: nodeNow_weight.orderIndex,
              level: nodeNow_weight.level,
              weight: nodeNow_weight.weight_total,
            });
          } else {
            nodesDataNew.push(nodeData);
            memberData.nodes.push({ _id: nodeID });
          }
        }

        // add only the new ones as relationship on Neo4j
        for (let i = 0; i < nodesDataNew.length; i++) {
          let nodeNow = nodesDataNew[i];

          if (nodeNow.weight != undefined) {
            makeConnection_neo4j({
              node: [nodeNow.node, "Member"],
              id: [nodeNow._id, memberData._id],
              connection: "connection",
              // weight: "0.1",
              weight: nodeNow.weight.toFixed(3),
            });
          } else {
            makeConnection_neo4j({
              node: [nodeNow.node, "Member"],
              id: [nodeNow._id, memberData._id],
              connection: "connection",
            });
          }
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

      pubsub.publish(memberData2._id, {
        memberUpdated: memberData2,
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
  deleteNodesFromMember: async (parent, args, context, info) => {
    const { memberID, nodesID } = args.fields;

    console.log(
      "Mutation > deleteNodesFromMember > args.fields = ",
      args.fields
    );

    if (!memberID) throw new ApolloError("memberID is required");

    try {
      let memberData = await Members.findOne({ _id: memberID });
      let nodesData = await Node.find({ _id: nodesID }).select("_id name node");

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

      pubsub.publish(memberData2._id, {
        memberUpdated: memberData2,
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

  updateNodesToMember: async (parent, args, context, info) => {
    let { memberID, nodesID, nodesID_level, nodeType } = args.fields;

    console.log("Mutation > updateNodesToMember > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("memberID is required");

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
            });
          } else {
            nodesDataNew.push(nodeData);
            nodeData_member_all.push({ _id: nodeID });
          }
          // nodesDataNew.push(nodeData);
          // nodeData_member_all.push({ _id: nodeID });
        }

        // console.log("nodesDataNew = ", nodesDataNew);

        // asdf;

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

      memberData2 = await Members.findOneAndUpdate(
        { _id: memberID },
        {
          $set: {
            nodes: nodeData_member_all,
          },
        },
        { new: true }
      );
      pubsub.publish(memberData2._id, {
        memberUpdated: memberData2,
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
  deleteMember: async (parent, args, context, info) => {
    const { memberID } = args.fields;

    console.log("Mutation > deleteMember > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("memberID is required");

    try {
      let memberData = await Members.findOne({ _id: memberID });

      if (!memberData) throw new ApolloError("memberID not found");

      // console.log("memberData = " , memberData)

      // get all nodes from memberData.nodes
      let nodesData = await Node.find({
        _id: memberData.nodes.map(function (item) {
          return item._id.toString();
        }),
      });

      // console.log("nodesData = " , nodesData)

      // console.log("change = " , change)

      // console.log("change = " , change)

      // add only the new ones as relationship on Neo4j
      for (let i = 0; i < nodesData.length; i++) {
        let nodeNow = nodesData[i];
        deleteConnectionANYBetweenNodes_neo4j({
          nodeID_1: memberData._id,
          nodeID_2: nodeNow._id,
        });

        changeMatchByServer(nodeNow, memberData);
      }

      deleteNode_neo4j({
        nodeID: memberData._id,
      });

      // delete memberData from mongoDB database
      memberData2 = await Members.findOneAndDelete({ _id: memberID });

      return memberData2;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  addPreferencesToMember: async (parent, args, context, info) => {
    const { memberID } = args.fields;
    let { preferences } = args.fields;
    console.log(
      "Mutation > addPreferencesToMember > args.fields = ",
      args.fields
    );

    if (!memberID) throw new ApolloError("memberID is required");

    if (!preferences) preferences = [];

    try {
      let memberData = await Members.findOne({ _id: memberID }).select(
        "_id name preferences"
      );
      if (!memberData) throw new ApolloError("Member not found");

      let current_preferences = memberData.preferences;

      console.log("current_preferences = ", current_preferences);

      for (let i = 0; i < preferences.length; i++) {
        let preferenceNow = preferences[i];

        // preferenceNow.preference -> the enum that determine what to change
        if (preferenceNow.notify !== undefined)
          current_preferences[preferenceNow.preference].notify =
            preferenceNow.notify;
        if (preferenceNow.percentage !== undefined)
          current_preferences[preferenceNow.preference].percentage =
            preferenceNow.percentage;
        if (preferenceNow.interestedMatch !== undefined)
          current_preferences[preferenceNow.preference].interestedMatch =
            preferenceNow.interestedMatch;

        // preferenceNow.pastSearch.map((x) => x);

        // console.log(
        //   "change = ",
        //   preferenceNow.pastSearch.map((x) => x)
        // );

        if (preferenceNow.pastSearch && preferenceNow.pastSearch.length > 0) {
          preferenceNow.pastSearch.forEach((x) => {
            current_preferences[preferenceNow.preference].pastSearch.push(x);
          });

          // current_preferences[preferenceNow.preference].pastSearch.push(
          //   preferenceNow.pastSearch.map((x) => x)
          // );
          // current_preferences[preferenceNow.preference].pastSearch =
          //   preferenceNow.pastSearch.map((x) => x);
        }
      }

      const optionsPref = [
        "findUser",
        "findCoFounder",
        "findMentor",
        "findMentee",
        "findProject",
      ];

      notify_global = false;
      interestedMatch_global = false;
      for (let i = 0; i < optionsPref.length; i++) {
        let optionNow = optionsPref[i];
        if (current_preferences[optionNow].notify == true) notify_global = true;
        if (current_preferences[optionNow].interestedMatch == true)
          interestedMatch_global = true;
      }
      console.log("notify_global = ", notify_global);
      console.log("interestedMatch_global = ", interestedMatch_global);

      current_preferences.notify = notify_global;
      current_preferences.interestedMatch = interestedMatch_global;

      memberData = await Members.findOneAndUpdate(
        { _id: memberID },
        { preferences: current_preferences },
        { new: true }
      );

      // console.log("memberData.projects = ", memberData.projects);

      pubsub.publish(memberData._id, {
        memberUpdated: memberData,
      });
      return memberData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  addFavoriteProject: async (parent, args, context, info) => {
    const { memberID, projectID, favorite } = args.fields;
    console.log("Mutation > addFavoriteProject > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("memberID is required");
    if (!projectID) throw new ApolloError("projectID is required");
    if (favorite == null) throw new ApolloError("favorite is required");

    try {
      let memberData = await Members.findOne({ _id: memberID });
      if (!memberData) throw new ApolloError("Member not found");

      let projectData = await Projects.findOne({ _id: projectID });
      if (!projectData) throw new ApolloError("Project not found");

      let currentProjects = [...memberData.projects];

      currentProjects.push({
        projectID: projectID,
        champion: false,
        favorite: favorite,
      });

      memberData = await Members.findOneAndUpdate(
        { _id: memberID },
        { projects: currentProjects },
        { new: true }
      );

      console.log("memberData.projects = ", memberData.projects);

      pubsub.publish(memberData._id, {
        memberUpdated: memberData,
      });
      return memberData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  endorseAttribute: async (parent, args, context, info) => {
    const { _id, attribute } = args.fields;
    console.log("Mutation > endorseAttribute > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("_id is required");
    if (!attribute) throw new ApolloError("attribute is required");

    let fields = {
      _id,
      attribute,
    };

    // console.log("fields = " , fields)

    try {
      let membersData = await Members.findOne({ _id: fields._id });

      if (!membersData) throw new ApolloError("Member not found");

      console.log("membersData.attributes = ", membersData.attributes);
      console.log("membersData.attributes = ", membersData.attributes.Director);
      console.log("membersData.attributes = ", !membersData.attributes);
      console.log(
        "membersData.attributes = ",
        membersData.attributes.Director == undefined
      );
      console.log(
        "membersData.attributes = ",
        !membersData.attributes || membersData.attributes.Director != undefined
      );

      let newAttributes;
      if (
        !membersData.attributes ||
        membersData.attributes.Director == undefined
      ) {
        console.log("change = 1");
        newAttributes = {
          Director: 0,
          Motivator: 0,
          Inspirer: 0,
          Helper: 0,
          Supporter: 0,
          Coordinator: 0,
          Observer: 0,
          Reformer: 0,
        };

        newAttributes[attribute] = 1;

        membersData = await Members.findOneAndUpdate(
          { _id: fields._id },
          { attributes: newAttributes },
          { new: true }
        );
      } else {
        console.log("change = 2");
        newAttributes = { ...membersData.attributes };
        newAttributes[attribute] = newAttributes[attribute] + 1;
        membersData = await Members.findOneAndUpdate(
          { _id: fields._id },
          { attributes: newAttributes },
          { new: true }
        );
      }

      console.log("membersData = ", membersData);

      // console.log("change = 1" )
      // if (!membersData ){
      //   membersData = await new Members(fields);

      //   membersData.save()

      //   membersData = membersData
      // } else {

      //   membersData = await Members.findOneAndUpdate({ _id: fields._id }, fields, { new: true });
      // //console.log("change = 2" )
      // }

      //console.log("membersData.attribute = " , membersData.attribute)

      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  addSkillToMember: async (parent, args, context, info) => {
    const { skillID, memberID, authorID, serverID } = args.fields;
    console.log("Mutation > addSkillToMember > args.fields = ", args.fields);

    if (!skillID) throw new ApolloError("skillID is required");
    if (!memberID) throw new ApolloError("memberID is required");
    if (!authorID) throw new ApolloError("authorID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    try {
      let fieldUpdate = {};

      let member; //= await Members.findOne({ _id: memberID })
      if (queryServerID.length > 0) {
        member = await Members.findOne({
          $and: [{ _id: memberID }, { $or: queryServerID }],
        });
      } else {
        member = await Members.findOne({ _id: memberID });
      }

      let authorInfo; //= await Members.findOne({ _id: authorID })
      if (queryServerID.length > 0) {
        authorInfo = await Members.findOne({
          $and: [{ _id: authorID }, { $or: queryServerID }],
        });
      } else {
        authorInfo = await Members.findOne({ _id: authorID });
      }

      let skill = await Skills.findOne({ _id: skillID });

      if (!member)
        throw new ApolloError(
          "member dont exist, or the author and member are not in the same server"
        );
      if (!authorInfo)
        throw new ApolloError(
          "author dont exist, or the author and member are not in the same server"
        );
      if (!skill)
        throw new ApolloError(
          "skill dont exist, you need to first creaet the skill "
        );

      // console.log("change = " , skill,authorInfo,member)

      let newSkills;

      let skillExist = true;
      let makeAnUpdate = false;

      // add skill edge from author to member & add skill edge from member to skill node
      if (member._id !== authorInfo._id) {
        await makeConnection_neo4j({
          node: ["Member", "Skill"],
          id: [member._id, skill._id],
          connection: "SKILL",
        });
        await makeConnection_neo4j({
          node: ["Member", "Member"],
          id: [authorInfo._id, member._id],
          connection: "ENDORSE",
        });
      } else {
        //when author endorses themselves only add skill edge from member to skill node
        await makeConnection_neo4j({
          node: ["Member", "Skill"],
          id: [member._id, skill._id],
          connection: "SKILL",
        });
      }

      // Recalculate the skill match now that neo4j diagram changed
      await Skills.findOneAndUpdate(
        { _id: skill._id },
        {
          $set: {
            match: {
              recalculateProjectRoles: true,
              distanceProjectRoles: skill.distanceProjectRoles,

              recalculateMembers: true,
              distanceMembers: skill.distanceMembers,
            },
          },
        },
        { new: true }
      );

      // check all the skills, if the skill is already in the member, then update the author
      const updatedSkills = member.skills.map((skillMem) => {
        if (skillMem.id.equals(skill._id) === true) {
          skillExist = false;

          if (!skillMem.authors.includes(authorID)) {
            // If the skill already exist but the author is not in the list, add it
            makeAnUpdate = true;

            skillMem.authors.push(authorID);

            return skillMem;
          } else {
            return skillMem;
          }
        } else {
          return skillMem;
        }
      });

      //console.log("change = 1" )

      // ---------- Network Member-----------
      let networkMember;
      let flagMemberExist = false;
      member.network.forEach((net) => {
        // console.log("net = " , net,net.memberID == authorID,net.memberID , authorID)
        // if (net.memberID.equals(authorID)===true){
        if (net.memberID == authorID) {
          flagMemberExist = true;
        }
      });
      //console.log("change = 2" )

      if (flagMemberExist === false) {
        networkMember = member.network.concat({ memberID: authorID });
      } else {
        networkMember = member.network;
      }
      // ---------- Network Member-----------

      //console.log("change = 2.5",authorInfo.network )
      // ---------- Network Author-----------
      let networkAuthor;
      flagMemberExist = false;
      authorInfo.network.forEach((net) => {
        if (net.memberID == authorID) {
          flagMemberExist = true;
        }
      });
      //console.log("change = 2.7" )

      if (flagMemberExist === false) {
        networkAuthor = authorInfo.network.concat({ memberID: member._id });
      } else {
        networkAuthor = authorInfo.network;
      }
      // ---------- Network Author-----------

      //console.log("change = 3" )

      let updateMembers = skill.members;
      // if the skill is not in the member, then add it
      if (skillExist === true) {
        makeAnUpdate = true;
        updatedSkills.push({
          id: skill._id,
          authors: [authorID],
        });
        updateMembers.push(member._id);
      }

      //console.log("change = 4" ,updatedSkills)
      //console.log("change = 4" ,networkMember)

      let newMember, newSkill;
      if (makeAnUpdate) {
        member = await Members.findOneAndUpdate(
          { _id: member._id },
          {
            $set: {
              skills: updatedSkills,
              network: networkMember,
            },
          },
          { new: true }
        );

        //console.log("change = 5" )

        authorInfo = await Members.findOneAndUpdate(
          { _id: authorInfo._id },
          {
            $set: {
              network: networkAuthor,
            },
          },
          { new: true }
        );

        //console.log("change = 6" )

        skill = await Skills.findOneAndUpdate(
          { _id: skill._id },
          {
            $set: {
              members: updateMembers,
            },
          },
          { new: true }
        );
      }

      //console.log("member = " , member)

      //console.log("networkAuthor 22 - = " , networkAuthor)
      //console.log("authorInfo 22 - = " , authorInfo)

      member = {
        ...member._doc,
        // skills: []
      };
      //console.log("Context", context)
      pubsub.publish(member._id, {
        memberUpdated: member,
      });
      return member;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  memberUpdated: {
    subscribe: (parent, args, context, info) => {
      //console.log("Context", parent)
      const { _id, serverID } = args.fields;
      const temp = _id ? _id : "";

      return pubsub.asyncIterator(temp);
    },
  },
  addEndorsement: async (parent, args, context, info) => {
    const { endorserID, endorseeID, endorsementMessage } = args.fields;
    console.log("Mutation > addEndorsement > args.fields = ", args.fields);
    try {
      if (!endorseeID || !endorserID || !endorsementMessage)
        throw new Error(
          "The endorsee, endorser and endorsement message is required🔥"
        );

      //verify if the endorser and endorsee exist
      let [endorserMember, endorseeMember] = await Promise.all([
        Members.findOne({ _id: endorserID }),
        Members.findOne({ _id: endorseeID }),
      ]);

      if (!endorseeMember) throw new ApolloError("The endorsee record missing");
      if (!endorserMember) throw new ApolloError("The endorser record missing");
      //save the endorsement to Arweave

      const fileObject = {
        endorserDiscordName: endorserMember.discordName,
        endorseeDiscordName: endorseeMember.discordName,
        message: endorsementMessage,
      };

      //const transactionId = await uploadFileToArweave(fileObject);
      // if (!transactionId)
      //   throw new Error(
      //     "No transactionID, check your env if Arweave token is included"
      //   );
      // //save the endorsement to the member

      let newEndorsement = {
        endorser: endorserID, //memberID
        endorsementMessage: endorsementMessage,
        //arweaveTransactionID: transactionId,
        arweaveTransactionID: "https://www.arweave.org/"
      };

      let previousEndorsements = endorseeMember.endorsements || [];
      previousEndorsements.push(newEndorsement);

      endorseeMember = await Members.findOneAndUpdate(
        {
          _id: endorseeID,
        },

        {
          $set: { endorsements: previousEndorsements },
        },

        {
          new: true,
        }
      );

      return endorseeMember;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addEndorsement",
        { component: "memberMutation > addEndorsement" }
      );
    }
  },
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

// create async function that will calculate the equation for skill level
const calculate_skill_level = async (nodeNow) => {
  console.log("nodeNow = ", nodeNow);

  // ------ Give some weight based on what is the order on the user ---------
  maxReward = 0.8;
  minReward = 0.3;
  decredationFactor = 0.7; // steepness

  if (nodeNow.orderIndex) {
    orderIndex = nodeNow.orderIndex;

    weight_orderIndex =
      (maxReward - minReward) / orderIndex ** decredationFactor + minReward;
  } else {
    weight_orderIndex = 0;
  }
  // ------ Give some weight based on what is the order on the user ---------

  // ------ Give some weight based on the level of expertise---------
  x0 = 5; // midpoint of the equation
  k = 0.8; // steepness of the curve

  if (nodeNow.level) {
    level = nodeNow.level;
    weight_level = 1 / (1 + 2.71 ** (-k * (level - x0)));
  } else {
    weight_level = 0;
  }
  // ------ Give some weight based on the level of expertise---------

  // ----- Combine the two -----------
  w1 = 0.5;
  w2 = 0.5;

  weight_total = w1 * weight_orderIndex + w2 * weight_level;
  // ----- Combine the two -----------

  nodeNow.weight_orderIndex = weight_orderIndex;
  nodeNow.weight_level = weight_level;
  nodeNow.weight_total = weight_total;
  // asdf;
  return nodeNow;
};
