const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { ServerTemplate } = require("../../../models/serverModel");

const mongoose = require("mongoose");
const { Projects } = require("../../../models/projectsModel");
const { Skills } = require("../../../models/skillsModel");
const { driver } = require("../../../../server/neo4j_config");
const { combineResolvers } = require("graphql-resolvers");

const {
  matchMembersToProject_neo4j,
  matchMembersToProjectRole_neo4j,
  matchPrepareSkillToMembers_neo4j,
  matchPrepareAnything_neo4j,
  matchPrepareAnything_neo4j_old,
  matchPrepareSkillToProjectRoles_neo4j,
} = require("../../../neo4j/func_neo4j");

const { ApolloError } = require("apollo-server-express");
const { IsAuthenticated } = require("../../../utils/authorization");

module.exports = {
  findMember:
    //combineResolvers(
    //IsAuthenticated,
    async (parent, args, context, info) => {
      const { _id, serverID, discordName } = args.fields;
      console.log("Query > findMember > args.fields = ", args.fields);

      let searchTerm = {};

      if (!_id && !discordName) {
        throw new ApolloError("No _id or discord name provided");
      }

      let queryServerID = [];
      if (serverID) {
        serverID.forEach((id) => {
          queryServerID.push({ serverID: id });
        });
      }

      try {
        // let memberData = await Members.findOne({ _id: _id })

        let memberData;

        if (_id && queryServerID.length > 0) {
          searchTerm = { $and: [{ _id: _id }, { $or: queryServerID }] };
        } else if (discordName) {
          let regEx = new RegExp(discordName, "i");
          searchTerm = { discordName: { $regex: regEx } };
        } else if (_id) {
          searchTerm = { _id: _id };
        }

        memberData = await Members.findOne(searchTerm);
        console.log("memberData = ", memberData);

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "findMember",
          {
            component: "tmemberQuery > findMember",
          }
        );
      }
    },
  //),

  findMembers: async (parent, args, context, info) => {
    const { _id, serverID } = args.fields;
    console.log("Query > findMembers > args.fields = ", args.fields);

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    try {
      let membersData;

      if (_id) {
        if (queryServerID.length > 0) {
          membersData = await Members.find({
            $and: [{ _id: _id }, { $or: queryServerID }],
          });
        } else {
          membersData = await Members.find({ _id: _id });
        }
      } else {
        if (queryServerID.length > 0) {
          membersData = await Members.find({ $or: queryServerID });
        } else {
          membersData = await Members.find({});
        }
      }

      //console.log("membersData = " , membersData)

      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  members_autocomplete: async (parent, args, context, info) => {
    const { search } = args.fields;
    console.log("Query > members_autocomplete > args.fields = ", args.fields);

    let collection = mongoose.connection.db.collection("members");

    try {
      console.log("change = 1", search);
      let result = await collection
        .aggregate([
          {
            $search: {
              autocomplete: {
                query: search,
                path: "discordName",
                fuzzy: {
                  maxEdits: 1,
                },
              },
            },
          },
        ])
        .toArray();

      console.log("result = ", result);

      return result;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > members_autocomplete" }
      );
    }
  },

  matchMembersToUser: async (parent, args, context, info) => {
    const { memberID, serverID } = args.fields;
    console.log("Query > matchMembersToUser > args.fields = ", args.fields);

    if (!memberID) throw new ApolloError("memberID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    try {
      let memberData;

      // memberData = await Members.findOne({ _id: memberID })

      if (queryServerID.length > 0) {
        memberData = await Members.findOne({
          $and: [{ _id: memberID }, { $or: queryServerID }],
        });
      } else {
        memberData = await Members.findOne({ _id: memberID });
      }

      if (!memberData)
        throw new ApolloError("The member need to exist on the database ");

      skillsArray_user = memberData.skills.map((skill) => skill.id); // separate all teh skills

      // let membersMatch_User = await Members.find({ 'skills.id':skillsArray_user}) // Find the members that have the same skill

      let membersMatch_User;

      if (queryServerID.length > 0) {
        membersMatch_User = await Members.find({
          $and: [{ "skills.id": skillsArray_user }, { $or: queryServerID }],
        });
      } else {
        membersMatch_User = await Members.find({
          "skills.id": skillsArray_user,
        });
      }

      if (membersMatch_User.length == 0) {
        // membersMatch_User = await Members.find({})
        if (queryServerID.length > 0) {
          membersMatch_User = await Members.find({
            $and: [{}, { $or: queryServerID }],
          });
        } else {
          membersMatch_User = await Members.find({});
        }
        membersMatch_User = membersMatch_User.slice(0, 4);
      }

      //filter out my user
      membersMatch_User = membersMatch_User.filter(
        (member) => member._id != memberID
      );

      let memberMatch, matchPercentage;
      let memberMatch_Result = [];
      for (let i = 0; i < membersMatch_User.length; i++) {
        memberMatch = membersMatch_User[i];

        skill_memberMatch = memberMatch.skills.map((skill) => skill.id);

        filteredSkillArray = skillsArray_user.filter((skill) =>
          skill_memberMatch.includes(skill)
        );

        if (skillsArray_user.length > 0) {
          matchPercentage =
            (filteredSkillArray.length / skillsArray_user.length) * 100;
        } else {
          matchPercentage = 0;
        }

        memberMatch_Result.push({
          member: memberMatch,
          matchPercentage: matchPercentage,
          commonSkills: filteredSkillArray,
        });
      }

      memberMatch_Result.sort((a, b) =>
        a.matchPercentage < b.matchPercentage ? 1 : -1
      );

      return memberMatch_Result;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchMembersToSkills: async (parent, args, context, info) => {
    const { skillsID, serverID } = args.fields;
    console.log("Query > matchMembersToSkills > args.fields = ", args.fields);

    if (!skillsID) throw new ApolloError("skillsID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    try {
      // let membersMatch_User = await Members.find({ 'skills.id':skillsID}) // Find the members that have the same skill

      let membersMatch_User;

      if (queryServerID.length > 0) {
        membersMatch_User = await Members.find({
          $and: [{ "skills.id": skillsID }, { $or: queryServerID }],
        });
      } else {
        membersMatch_User = await Members.find({ "skills.id": skillsID });
      }

      let memberMatch;
      let memberMatch_Result = [];
      for (let i = 0; i < membersMatch_User.length; i++) {
        memberMatch = membersMatch_User[i];

        skill_memberMatch = memberMatch.skills.map((skill) => skill.id);

        filteredSkillArray = skillsID.filter((skill) =>
          skill_memberMatch.includes(skill)
        );

        memberMatch_Result.push({
          member: memberMatch,
          matchPercentage: (filteredSkillArray.length / skillsID.length) * 100,
          commonSkills: filteredSkillArray,
        });
      }

      return memberMatch_Result;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchMembersToProject: async (parent, args, context, info) => {
    const { projectID, serverID } = args.fields;
    console.log("Query > matchMembersToProject > args.fields = ", args.fields);

    if (!projectID) throw new ApolloError("projectID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    try {
      let project;

      if (queryServerID.length > 0) {
        projectMatch_User = await Projects.find({
          $and: [{ _id: projectID }, { $or: queryServerID }],
        });
      } else {
        projectMatch_User = await Projects.find({ _id: projectID });
      }
      // console.log("projectMatch_User = " , projectMatch_User)

      // ------------ WiseTy -----------------

      console.log("change = 22");
      result = await matchMembersToProject_neo4j({
        projectID: "630c18e7b9854c303ccd99fc",
      });

      console.log("result 22-2-2 = ", result);

      matchMembers = [];
      matchIDs = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < result[i].length; j++) {
          if (matchIDs.includes(result[i][j]._id)) continue;
          matchIDs.push(result[i][j]._id);
          // matchMembers.push(result[i][j])
          matchMembers.push({
            member: result[i][j]._id,
            matchPercentage: (3 - i) * 30,
          });
        }
      }

      console.log("matchMembers = ", matchMembers);

      // ------------ WiseTy -----------------

      return matchMembers;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  matchMembersToProjectRole: async (parent, args, context, info) => {
    const { projectRoleID, serverID } = args.fields;
    console.log(
      "Query > matchMembersToProjectRole > args.fields = ",
      args.fields
    );

    if (!projectRoleID) throw new ApolloError("projectID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    console.log("projectRoleID = ", projectRoleID);

    try {
      let projectMatch_User = await Projects.findOne({
        "role._id": projectRoleID,
      });

      let projectRoleMatch = {};

      projectMatch_User.role.filter((roleNow) => {
        if (roleNow._id.equals(projectRoleID) == true) {
          projectRoleMatch = roleNow;
        }
      });

      console.log("projectMatch_User = ", projectMatch_User);
      console.log("projectMatch_User.role = ", projectMatch_User.role);
      console.log("projectRoleMatch = ", projectRoleMatch);

      // console.log("projectMatch_User = " , projectMatch_User)

      // ------------ WiseTy -----------------

      console.log("change = 22");
      result = await matchMembersToProjectRole_neo4j({
        projectRoleID: projectRoleMatch._id,
      });

      console.log("result 22-2-2 = ", result);

      matchMembers = [];
      matchIDs = [];
      for (let i = 0; i < 3; i++) {
        if (!result[i]) continue;

        for (let j = 0; j < result[i].length; j++) {
          if (matchIDs.includes(result[i][j]._id)) continue;
          matchIDs.push(result[i][j]._id);
          // matchMembers.push(result[i][j])
          matchMembers.push({
            member: result[i][j]._id,
            matchPercentage: (3 - i) * 30,
          });
        }
      }

      console.log("matchMembers = ", matchMembers);

      // ------------ WiseTy -----------------

      return matchMembers;
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  matchPrepareSkillToMembers: async (parent, args, context, info) => {
    const { skillID, serverID } = args.fields;
    console.log(
      "Query > matchPrepareSkillToMembers > args.fields = ",
      args.fields
    );

    if (!skillID) throw new ApolloError("projectID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    console.log("skillID = ", skillID);

    try {
      let project;

      let skillData = await Skills.findOne({ _id: skillID });

      if (!skillData) throw new ApolloError("Skill Don't exist");

      console.log("skillData = ", skillData);

      // ------------ WiseTy -----------------

      console.log("change = 22");
      result = await matchPrepareSkillToMembers_neo4j({
        skillID: skillData._id,
      });

      console.log("result 22-2-2 = ", result);

      matchMembers = [];
      matchIDs = [];

      distanceMatchHop = [[], [], []];

      for (let i = 0; i < 3; i++) {
        if (!result[i]) continue;

        for (let j = 0; j < result[i].length; j++) {
          if (matchIDs.includes(result[i][j]._id)) continue;
          matchIDs.push(result[i][j]._id);
          // matchMembers.push(result[i][j])
          matchMembers.push({
            member: result[i][j]._id,
            matchPercentage: (3 - i) * 30,
          });
          distanceMatchHop[i].push(result[i][j]._id);
        }
      }

      let distanceMembers = {
        hop0: distanceMatchHop[0],
        hop1: distanceMatchHop[1],
        hop2: distanceMatchHop[2],
      };
      console.log("distanceMembers = ", distanceMembers);

      // let skillData = await Skills.findOne({ "_id": skillID })

      skillDataNew = await Skills.findOneAndUpdate(
        { _id: skillID },
        {
          $set: {
            match: {
              recalculateMembers: false,
              distanceMembers: distanceMembers,
              recalculateProjectRoles: skillData.match.recalculateProjectRoles,
              distanceProjectRoles: skillData.match.distanceProjectRoles,
            },
          },
        },
        { new: true }
      );

      // console.log("matchMembers = " , matchMembers)

      // // ------------ WiseTy -----------------

      return skillDataNew;
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchPrepareNode_old: async (parent, args, context, info) => {
    const { nodeID, serverID, find } = args.fields;
    console.log(
      "Query > matchPrepareSkillToMembers > args.fields = ",
      args.fields
    );

    if (!nodeID) throw new ApolloError("node is required");

    if (!find) throw new ApolloError("find Enum is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    try {
      let project;

      let nodeData = await Node.findOne({ _id: nodeID });

      if (!nodeData) throw new ApolloError("Node Don't exist");

      let matchByServer = nodeData.matchByServer;

      let allServers = await ServerTemplate.find({});

      let matchByServer_update = false;

      let MR_Member = [];
      let MR_ProjectRole = [];
      let MR = [];

      // loop servers
      let matchRelativePosition_server = [];
      matchRelativePosition_server = nodeData.matchRelativePosition_server;
      for (let i = 0; i < allServers.length; i++) {
        let server = allServers[i];

        // get two variables from function "matchPrepareAnything_neo4j"

        result = await matchPrepareAnything_neo4j_old({
          nodeID: nodeData._id,
          node: nodeData.node,
          serverID: server._id,
          find,
        });

        // console.log("MR --ds-ds-fs-dfs-sdf-sdf-dfs-- = ", result);

        // split the result in two
        MR = result.MR;
        result = { ...result.hop_users };

        // console.log("result = ", result);
        // console.log("matchRelativePosition = ", matchRelativePosition);

        // asdf;
        // console.log("matchRelativePosition = ", matchRelativePosition);

        matchMembers = [];
        matchIDs = [];

        // console.log("MR --ds-ds-fs-dfs-sdf-sdf-dfs-- = ", MR);

        distanceMatchHop = [[], [], []];

        for (let i = 0; i < 3; i++) {
          if (!result[i]) continue;

          for (let j = 0; j < result[i].length; j++) {
            if (matchIDs.includes(result[i][j]._id)) continue;
            matchIDs.push(result[i][j]._id);
            // matchMembers.push(result[i][j])
            matchMembers.push({
              member: result[i][j]._id,
              matchPercentage: (3 - i) * 30,
            });
            distanceMatchHop[i].push(result[i][j]._id);
          }
        }

        let distanceMembers;
        let distanceProjectRoles;
        let recalculateProjectRoles;
        let recalculateMembers;

        let position = -1;

        if (matchByServer === undefined) {
          distanceMembers = [];
          distanceProjectRoles = [];
          recalculateProjectRoles = true;
          recalculateMembers = true;

          matchByServer_update = true; // we need to run the function again becuase there is new server
        } else {
          position = matchByServer.findIndex((x) => x.serverID === server._id);

          if (position === -1) {
            distanceMembers = [];
            distanceProjectRoles = [];
            recalculateProjectRoles = true;
            recalculateMembers = true;

            matchByServer_update = true; // we need to run the function again becuase there is new server
          } else {
            distanceMembers = matchByServer[position].match.distanceMembers;
            distanceProjectRoles =
              matchByServer[position].match.distanceProjectRoles;
            recalculateProjectRoles =
              matchByServer[position].match.recalculateProjectRoles;
            recalculateMembers =
              matchByServer[position].match.recalculateMembers;

            console.log(
              "MR --ds-ds-fs-dfs-sdf-sdf-dfs-- =222 ",
              matchRelativePosition_server
            );
            position_MR = matchRelativePosition_server.findIndex((x) => {
              if (x == undefined) return false;
              return x.serverID === server._id;
            });
            if (find == "Member") {
              if (recalculateProjectRoles != false) {
                matchByServer_update = true; // we need to run the function again becuase there is new server
                recalculateProjectRoles = true;
              }

              if (position_MR === -1) {
                matchRelativePosition_server[position] = {
                  serverID: server._id,
                  MR_Member: MR,
                };
                console.log("MR --f--f--f--f--f--f-= ", MR);
              } else {
                matchRelativePosition_server[position].MR_Member = MR;
              }
            } else if (find == "Project") {
              if (recalculateMembers != false) {
                matchByServer_update = true; // we need to run the function again becuase there is new server
                recalculateMembers = true;
              }
              if (position_MR === -1) {
                matchRelativePosition_server[position] = {
                  MR_ProjectRole: MR,
                  serverID: server._id,
                };
              } else {
                matchRelativePosition_server[position].MR_ProjectRole = MR;
              }
            }
          }
        }

        if (nodeData.matchRelativePosition) {
          if (nodeData.matchRelativePosition.MR_Member) {
            MR_Member = nodeData.matchRelativePosition.MR_Member;
          }
          if (nodeData.matchRelativePosition.MR_ProjectRole) {
            MR_ProjectRole = nodeData.matchRelativePosition.MR_ProjectRole;
          }
        }

        if (find == "Member") {
          distanceMembers = {
            hop0: distanceMatchHop[0],
            hop1: distanceMatchHop[1],
            hop2: distanceMatchHop[2],
          };
          // console.log("change = 102", distanceMembers);

          matchRelativePosition.push;

          recalculateMembers = false;
        } else if (find == "Role") {
          distanceProjectRoles = {
            hop0: distanceMatchHop[0],
            hop1: distanceMatchHop[1],
            hop2: distanceMatchHop[2],
          };
          recalculateProjectRoles = false;
          // console.log("change = 102", distanceProjectRoles )
        }

        if (position === -1) {
          matchByServer.push({
            serverID: server._id,
            match: {
              distanceMembers: distanceMembers,
              distanceProjectRoles: distanceProjectRoles,
              recalculateProjectRoles: recalculateProjectRoles,
              recalculateMembers: recalculateMembers,
            },
          });
        } else {
          matchByServer[position].match.distanceMembers = distanceMembers;
          matchByServer[position].match.distanceProjectRoles =
            distanceProjectRoles;
          matchByServer[position].match.recalculateProjectRoles =
            recalculateProjectRoles;
          matchByServer[position].match.recalculateMembers = recalculateMembers;
        }
      }

      // console.log("MR_Member ------- = ", MR_Member);

      console.log(
        "matchRelativePosition_server = ",
        matchRelativePosition_server
      );

      nodeDataNew = await Node.findOneAndUpdate(
        {
          _id: nodeID,
        },
        {
          $set: {
            matchByServer_update: matchByServer_update,
            matchByServer: matchByServer,
            matchRelativePosition_server: matchRelativePosition_server,
          },
        },
        { new: true }
      );

      return nodeDataNew;
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchPrepareNode: async (parent, args, context, info) => {
    const { nodeID, serverID, find, weightSkills } = args.fields;
    console.log(
      "Query > matchPrepareSkillToMembers > args.fields = ",
      args.fields
    );

    if (!nodeID) throw new ApolloError("node is required");

    if (!find) throw new ApolloError("find Enum is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    try {
      let nodeData = await Node.findOne({ _id: nodeID }).select(
        "-subNodes -relatedNodes -aboveNodes"
      );

      if (!nodeData) throw new ApolloError("Node Don't exist");

      let match_v2 = nodeData.match_v2;

      let allServers = await ServerTemplate.find({});

      matchRelativePosition_gl = {};
      for (let i = 0; i < allServers.length; i++) {
        // you need to calculate the node for every server in the database
        let server = allServers[i];

        // get two variables from function "matchPrepareAnything_neo4j"

        typeNeo = find;
        if (typeNeo == "ProjectRole") typeNeo = "Role";
        result_matchRelat = await matchPrepareAnything_neo4j({
          nodeID: nodeData._id,
          node: nodeData.node,
          serverID: server._id,
          find: typeNeo,
          weightSkills: weightSkills,
        });

        // console.log("-----------SERVERID --------- ", server._id);
        // console.log("result_matchRelat = ", result_matchRelat);

        // sadf;

        // check if there is something new that we need to include
        for (const [key, value] of Object.entries(result_matchRelat)) {
          if (matchRelativePosition_gl[key] === undefined) {
            matchRelativePosition_gl[key] = {
              serverID: [server._id],
              ...value,
            };
          } else {
            matchRelativePosition_gl[key].serverID.push(server._id);
          }
        }
      }

      // console.log("matchRelativePosition_gl = ", matchRelativePosition_gl);

      // sadf;

      // for (const [key, value] of Object.entries(result_matchRelat)) {

      // prepare the array to save in the database
      match_v2 = [];
      for (const [key, value] of Object.entries(matchRelativePosition_gl)) {
        // ---------------- prepare the conn_node_wh_obj to array ----------------
        conn_node_wh_arr = [];
        for (const [key_c, value_c] of Object.entries(value.conn_node_wh_obj)) {
          conn_node_wh_arr.push({
            nodeConnID: key_c,
            wh_sum: value_c.wh_sum,
            numPath: value_c.numPath,
          });
        }
        // ---------------- prepare the conn_node_wh_obj to array ----------------

        match_v2.push({
          serverID: value.serverID,
          nodeResID: key,
          wh_sum: value.WH,
          numPath: value.N,
          type: find,
          wh_k: value.wh_k,
          k_sum: value.k_sum,
          wh_k_arr: value.wh_k_arr,
          conn_node_wh: conn_node_wh_arr,
        });
      }

      // console.log("match_v2 = ", match_v2);

      // sadf;

      //filter out the ones that have type = "Member"
      let match_v2_old = nodeData.match_v2.filter((item) => item.type != find);

      // update with the new "Member"
      match_v2 = [...match_v2_old, ...match_v2];

      match_v2_update = {};
      // save what was updated
      if (find == "Member") {
        match_v2_update = {
          member: false,
          projectRole: nodeData.match_v2_update.projectRole,
        };
      } else if (find == "ProjectRole") {
        match_v2_update = {
          member: nodeData.match_v2_update.member,
          projectRole: false,
        };
      }

      nodeDataNew = await Node.findOneAndUpdate(
        {
          _id: nodeID,
        },
        {
          $set: {
            match_v2_update: match_v2_update,
            match_v2,
          },
        },
        { new: true }
      );

      // console.log("nodeDataNew  = ", nodeDataNew);

      return nodeDataNew;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  matchPrepareSkillToProjectRoles: async (parent, args, context, info) => {
    const { skillID, serverID } = args.fields;
    console.log(
      "Query > matchPrepareSkillToProjectRoles > args.fields = ",
      args.fields
    );

    if (!skillID) throw new ApolloError("skillID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    console.log("skillID = ", skillID);

    try {
      let skillData = await Skills.findOne({ _id: skillID });

      if (!skillData) throw new ApolloError("Skill Don't exist");

      console.log("skillData = ", skillData);

      // ------------ WiseTy -----------------

      console.log("change = 22");
      result = await matchPrepareSkillToProjectRoles_neo4j({
        skillID: skillData._id,
      });

      console.log("result 22-2-2 = ", result);

      matchMembers = [];
      matchIDs = [];

      distanceMatchHop = [[], [], []];

      for (let i = 0; i < 3; i++) {
        if (!result[i]) continue;

        for (let j = 0; j < result[i].length; j++) {
          if (matchIDs.includes(result[i][j]._id)) continue;
          matchIDs.push(result[i][j]._id);
          // matchMembers.push(result[i][j])
          matchMembers.push({
            member: result[i][j]._id,
            matchPercentage: (3 - i) * 30,
          });
          distanceMatchHop[i].push(result[i][j]._id);
        }
      }

      let distanceProjectRoles = {
        hop0: distanceMatchHop[0],
        hop1: distanceMatchHop[1],
        hop2: distanceMatchHop[2],
      };
      console.log("distanceProjectRoles = ", distanceProjectRoles);

      // let skillData = await Skills.findOne({ "_id": skillID })

      skillDataNew = await Skills.findOneAndUpdate(
        { _id: skillID },
        {
          $set: {
            match: {
              recalculateProjectRoles: false,
              distanceProjectRoles: distanceProjectRoles,

              recalculateMembers: skillData.match.recalculateMembers,
              distanceMembers: skillData.match.distanceMembers,
            },
          },
        },
        { new: true }
      );

      // console.log("matchMembers = " , matchMembers)

      //   // // ------------ WiseTy -----------------

      return skillDataNew;
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchSkillsToMembers: async (parent, args, context, info) => {
    const { skillsID, hoursPerWeek, budgetAmount, serverID } = args.fields;
    let { page, limit } = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = ", args.fields);

    if (!skillsID) throw new ApolloError("projectID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    if (page != null && limit != null) {
    } else {
      page = 0;
      limit = 10;
    }

    // console.log("change = 1" )

    try {
      let project;

      let skillData = await Skills.find({ _id: skillsID });

      if (!skillData) throw new ApolloError("Skill Don't exist");

      // console.log("skillData[0] = " , skillData[0])
      // console.log("skillData[0] = " , skillData[0].match)

      let numberOfSkills = skillData.length;

      let distanceAll = [];
      let points = [];
      let percentage = [];
      let skillPercentage = [];

      // console.log("change = 2" )
      let everyID = [];

      let newSkillFlag, percentageNow;
      // console.log("distanceAll = " , distanceAll)
      for (let i = 0; i < skillData.length; i++) {
        newSkillFlag = true;
        for (let k = 0; k < 3; k++) {
          let membersNow;
          if (k == 0) membersNow = skillData[i].match.distanceMembers.hop0;
          if (k == 1) membersNow = skillData[i].match.distanceMembers.hop1;
          if (k == 2) membersNow = skillData[i].match.distanceMembers.hop2;

          // console.log("k,membersNow = " ,i,skillData[i]._id ,k,membersNow)

          for (let j = 0; j < membersNow.length; j++) {
            let memberID = membersNow[j];
            if (!everyID.includes(memberID)) {
              distanceAll.push(memberID);
              points.push(1);
              everyID.push(memberID);

              percentageNow =
                (100 / numberOfSkills) * ((25 * (4 - k * 1.5)) / 100); // (How powerful is this skill) * (what is the distance)

              // if (memberID == "908392557258604544"){
              //   console.log("percentageNow = " , percentageNow,i,k,j,newSkillFlag)

              // }

              percentage.push(percentageNow);

              skillPercentage.push([
                {
                  info: skillData[i]._id,
                  percentage100: percentageNow * numberOfSkills,
                  percentageReal: percentageNow,
                },
              ]);

              // if (newSkillFlag==true) percentage.push(percentageNow)
              newSkillFlag = false;

              // if (i==1) console.log("add the memberID = " , memberID)
            } else {
              // console.log("change = 22",distanceAll )
              // console.log("change = 22",distanceAll )
              let pos = distanceAll.indexOf(memberID);
              // console.log("pos = " , pos)
              if (pos > -1) {
                points[pos] = points[pos] + 1;

                percentageNow =
                  (100 / numberOfSkills) * ((25 * (4 - k * 1.5)) / 100); // (How powerful is this skill) * (what is the distance)

                // if (memberID == "908392557258604544"){
                //   console.log("percentageNow 2= " , percentageNow,i,k,j,newSkillFlag)

                // }

                skillPercentage[pos].push({
                  info: skillData[i]._id,
                  percentage100: percentageNow * numberOfSkills,
                  percentageReal: percentageNow,
                });

                percentage[pos] = percentage[pos] + percentageNow;
                // if (newSkillFlag == true) percentage[pos] = percentage[pos] + percentageNow
                newSkillFlag = false;
              }
            }
          }
        }
        // console.log("change = 3" )
      }

      // console.log("points = " , points)

      matchSkillsToMembersOutput = [];

      console.log("distanceAll = ", distanceAll);
      console.log("skillPercentage = ", skillPercentage);
      // console.log("skillPercentage = " , skillPercentage[0])
      // // console.log("skillPercentage = " , skillPercentage[0][0])
      // // console.log("skillPercentage = " , skillPercentage[0][0][0])

      // console.log("skillPercentage = " , skillPercentage[2])

      allMembers = [];
      for (let i = 0; i < distanceAll.length; i++) {
        allMembers.push(distanceAll[i]);

        // memberData = await Members.findOne({_id: distanceAll[i]})

        // if (memberData && memberData!=null){

        matchSkillsToMembersOutput.push({
          memberID: distanceAll[i],
          // skillTotalPercentage: 25*(3-i) + (25/skillData.length)*points[i],
          skillTotalPercentage: percentage[i],
          skillsPercentage: skillPercentage[i],
          hoursPerWeek,
          budgetAmount,
        });
        // }
      }
      console.log("change = 4", matchSkillsToMembersOutput);

      // -------------- Clean and Sort ---------------

      // let dataAllMembers1 = await Members.find({ _id: allMembers });
      let dataAllMembers2 = await Members.find({ _id: allMembers }).lean();

      let dataAllMembers2_object = dataAllMembers2.reduce((memObj, member) => {
        memObj[member._id] = member;
        return memObj;
      }, {});

      //  console.log("dataAllMembers 1= " ,dataAllMembers1.length)
      //  console.log("dataAllMembers 2= " ,dataAllMembers2.length)

      //  console.log("dataAllMembers 1= " ,dataAllMembers1)

      // let newmembers = allMembers.map(m_id => dataAllMembers2_object[m_id])

      let newmembers = [];
      let memberNow;
      matchSkillsToMembersOutput.forEach((member) => {
        memberNow = dataAllMembers2_object[member.memberID];
        if (memberNow) {
          let hoursPercentage = 0;
          // console.log("memberNow = " , memberNow)
          if (memberNow.hoursPerWeek && memberNow.hoursPerWeek > 0) {
            hoursPercentage =
              100 - (memberNow.hoursPerWeek - hoursPerWeek) ** 2 / 3;
            if (hoursPercentage < 0) hoursPercentage = 0;
            if (hoursPercentage > 100) hoursPercentage = 100;
          }

          let budgetPercentage = 0;

          if (memberNow.budget && memberNow.budget.totalBudget) {
            budgetPercentage =
              100 - (memberNow.budget.totalBudget - budgetAmount) ** 2 / 3;

            if (budgetPercentage < 0) budgetPercentage = 0;
            if (budgetPercentage > 100) budgetPercentage = 100;
          }

          let skillTotalPercentage = member.skillTotalPercentage;
          let totalPercentage =
            skillTotalPercentage * 0.6 +
            hoursPercentage * 0.2 +
            budgetPercentage * 0.2;

          newmembers.push({
            ...member,
            member: memberNow,
            matchPercentage: {
              totalPercentage,
              skillTotalPercentage,
              hoursPercentage,
              budgetPercentage,
              realTotalPercentage: totalPercentage,
            },
            totalPercentage: totalPercentage,
          });
        }
      });

      // console.log("dataAllMembers 2= ", newmembers);

      newmembers.sort(
        (a, b) => parseFloat(b.totalPercentage) - parseFloat(a.totalPercentage)
      );

      // let r = 100/(5)
      let r = 100 / newmembers.length;

      newmembers = newmembers.map((member, index) => {
        let min = 0;
        let max = r / 3;
        let randomNum = Math.random() * (max - min) + min;

        let userPercentage = r * (newmembers.length - index) - randomNum;

        return {
          ...member,
          matchPercentage: {
            ...member.matchPercentage,
            totalPercentage: userPercentage,
            // realTotalPercentage: 100,
          },
        };
      });

      // -------------- Clean and Sort ---------------

      return newmembers.slice(page * limit, (page + 1) * limit);
      // return matchSkillsToMembersOutput.slice(page * limit, (page + 1) * limit);
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  setAllMatch_v2: async (parent, args, context, info) => {
    const { val, node } = args;
    console.log("Query > matchSkillsToMembers > args.fields = ", args);

    let match_v2_update;
    if (node == "Member") {
      match_v2_update = {
        member: val,
        projectRole: false,
      };
    } else if (node == "ProjectRole") {
      match_v2_update = {
        member: false,
        projectRole: val,
      };
    } else if (node == "All") {
      match_v2_update = {
        member: val,
        projectRole: val,
      };
    }

    await Node.updateMany(
      {},
      {
        $set: {
          match_v2_update: match_v2_update,
        },
      }
    );

    return val;
  },
  matchNodesToMembers: async (parent, args, context, info) => {
    const { nodesID, hoursPerWeek, budgetAmount, serverID, preference } =
      args.fields;
    let { page, limit } = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = ", args.fields);

    if (!nodesID) throw new ApolloError("nodesID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    const serverID_set = new Set(serverID);

    if (page != null && limit != null) {
    } else {
      page = 0;
      limit = 30;
    }

    try {
      let nodeData = await Node.find({ _id: nodesID }).select("_id match_v2");

      if (!nodeData) throw new ApolloError("Node Don't exist");

      w1 = 0.2; // the weight of the number of paths
      w2 = 1 - w1; // the weight of the weight_path^hop (this is really confusing but, second weight is the weight of the path)
      memberObj = {};

      new_max_m = 20;
      new_min_m = 100;

      console.log("nodeData = ", nodeData);

      memberIDs = [];

      original_min_m = 110; // will change on the loop
      original_max_m = -10; // will change on the loop
      for (let i = 0; i < nodeData.length; i++) {
        // loop on the nodes
        let match_v2 = nodeData[i].match_v2;

        for (let j = 0; j < match_v2.length; j++) {
          // find all the connections for this particular node
          // check if serverID exist on array match_v2.serverID
          if (
            match_v2[j].serverID.some((value) => serverID_set.has(value)) &&
            match_v2[j].type == "Member"
          ) {
            // If this is both have the serverID and is Member

            // Add this user to the memberObj
            // and Make the calculation for the percentage for this user

            if (memberObj[match_v2[j].nodeResID]) {
              memberObj[match_v2[j].nodeResID].wh_sum += match_v2[j].wh_sum;
              memberObj[match_v2[j].nodeResID].numPath += match_v2[j].numPath;

              memberObj[match_v2[j].nodeResID].wh_k += match_v2[j].wh_k;
              memberObj[match_v2[j].nodeResID].k_sum += match_v2[j].k_sum;

              const N = memberObj[match_v2[j].nodeResID].numPath;
              const k_sum = memberObj[match_v2[j].nodeResID].k_sum;
              const wh_k = memberObj[match_v2[j].nodeResID].wh_k;
              const sumi = memberObj[match_v2[j].nodeResID].wh_sum;
              let conn_node_wh_obj =
                memberObj[match_v2[j].nodeResID].conn_node_wh_obj;

              const wh_k_arr = match_v2[j].wh_k_arr;

              memberObj[match_v2[j].nodeResID].wh_k_arr.forEach(
                (wh_k_T, idx) => {
                  wh_k_T.wh_sum = wh_k_arr[idx].wh_sum;
                  wh_k_T.numPath = wh_k_arr[idx].numPath;
                }
              );

              match_v2[j].conn_node_wh.forEach((conn_node_wh_T, idx) => {
                if (conn_node_wh_obj[conn_node_wh_T.nodeConnID]) {
                  conn_node_wh_obj[conn_node_wh_T.nodeConnID].wh_sum +=
                    conn_node_wh_T.wh_sum;
                  conn_node_wh_obj[conn_node_wh_T.nodeConnID].numPath +=
                    conn_node_wh_T.numPath;
                } else {
                  // console.log("conn_node_wh_T = ", conn_node_wh_T);
                  conn_node_wh_obj[conn_node_wh_T.nodeConnID] = {
                    wh_sum: conn_node_wh_T.wh_sum,
                    numPath: conn_node_wh_T.numPath,
                  };
                }
              });
              memberObj[match_v2[j].nodeResID].conn_node_wh_obj =
                conn_node_wh_obj;

              const pers =
                ((1 - 1 / N ** 0.3) * w1 + (wh_k / k_sum) * w2) * 100;

              memberObj[match_v2[j].nodeResID].C1 = 1 - 1 / N ** 0.3;
              memberObj[match_v2[j].nodeResID].C2 = wh_k / k_sum;
              memberObj[match_v2[j].nodeResID].pers = Number(pers.toFixed(2));
            } else {
              memberIDs.push(match_v2[j].nodeResID);
              const N = match_v2[j].numPath;
              const sumi = match_v2[j].wh_sum;
              const k_sum = match_v2[j].k_sum;
              const wh_k = match_v2[j].wh_k;
              const wh_k_arr = match_v2[j].wh_k_arr;

              if (wh_k_arr.length == 0) {
                wh_k_arr = [
                  {
                    wh_sum: 0,
                    numPath: 0,
                  },
                  {
                    wh_sum: 0,
                    numPath: 0,
                  },
                  {
                    wh_sum: 0,
                    numPath: 0,
                  },
                ];
              }

              const conn_node_wh_obj = match_v2[j].conn_node_wh.reduce(
                (obj, item) => {
                  obj[item.nodeConnID] = item;
                  return obj;
                },
                {}
              );
              // console.log("conn_node_wh_obj = ", conn_node_wh_obj);

              // asdf;

              const pers =
                ((1 - 1 / N ** 0.3) * w1 + (wh_k / k_sum) * w2) * 100;
              memberObj[match_v2[j].nodeResID] = {
                wh_sum: match_v2[j].wh_sum,
                numPath: match_v2[j].numPath,
                C1: 1 - 1 / N ** 0.3,
                C2: wh_k / k_sum,
                pers: Number(pers.toFixed(2)),
                wh_k: match_v2[j].wh_k,
                k_sum: match_v2[j].k_sum,
                wh_k_arr: wh_k_arr,
                conn_node_wh_obj,
              };
            }
            if (memberObj[match_v2[j].nodeResID].pers > original_max_m) {
              original_max_m = memberObj[match_v2[j].nodeResID].pers;
            }
            if (memberObj[match_v2[j].nodeResID].pers < original_min_m) {
              original_min_m = memberObj[match_v2[j].nodeResID].pers;
            }
          }
        }
        // console.log("memberObj = ", memberObj);
      }

      // console.log("original_min_m = ", original_min_m);
      // console.log("original_max_m = ", original_max_m);
      // console.log("memberObj = ", memberObj);

      console.log("memberIDs = ", memberIDs);
      let dataAllMembers2 = await Members.find({ _id: memberIDs })
        .select("_id discordName preferences")
        .lean();

      let memberData_obj = dataAllMembers2.reduce((memObj, member) => {
        memObj[member._id] = member;
        return memObj;
      }, {});

      // console.log("memberData_obj = ", memberData_obj);
      // asdf;

      original_min_m = 110; // will change on the loop
      original_max_m = -10; // will change on the loop
      for (const [key, value] of Object.entries(memberObj)) {
        // ----------- Calculate information about the Member --------------

        if (preference != undefined) {
          addMember = false;
          if (memberData_obj[key] == undefined) {
            addMember = false;
          } else {
            if (memberData_obj[key].preferences) {
              if (memberData_obj[key].preferences.interestedMatch == false) {
                addMember = false;
              } else {
                addMember = false;
                preference.forEach((pref) => {
                  if (memberData_obj[key].preferences[pref]) {
                    if (
                      memberData_obj[key].preferences[pref].interestedMatch ==
                      true
                    ) {
                      addMember = true;
                    }
                  }
                });

                if (addMember == true) {
                  addMember = true;
                  console.log("key = ", key);
                }
              }
            }
          }
        } else {
          addMember = true;
        }
        // ----------- Calculate information about the Member --------------

        // console.log("value = ", value);
        let wh_k_arr = value.wh_k_arr;

        let numPath_weighted = 0;

        wh_sum = 0;
        numPath = 0;
        let penaltySmallNumPath = 0;
        wh_k_arr.forEach((wh_k_T, idx) => {
          let wh_sum_n = wh_k_arr[idx].wh_sum;
          let numPath_n = wh_k_arr[idx].numPath;
          numPath_weighted += numPath_n * (((3 - idx) * 3) / (idx + 1));

          if (numPath == 0 && numPath_n != 0) {
            penaltySmallNumPath = 1 - 1 / (numPath_n + 1) ** 1.4;
            wh_sum = wh_sum_n;
            numPath = numPath_n;
          }
        });
        const C1 = 1 - 1 / numPath_weighted ** 0.3;
        const C2 = wh_sum / numPath;
        const pers = ((C1 * w1 + C2 * penaltySmallNumPath * w2) * 100).toFixed(
          2
        );

        memberObj[key] = {
          ...value,
          C1,
          C2: C2 * penaltySmallNumPath,
          pers: pers,
          numPath_weighted: numPath_weighted,
          addMember,
        };

        if (addMember == true) {
          if (Number(pers) > Number(original_max_m)) {
            original_max_m = Number(pers);
          }
          if (Number(pers) < Number(original_min_m)) {
            original_min_m = Number(pers);
          }
        }
      }

      // asdf;
      // for (const [key, value] of Object.entries(memberObj)) {
      //   if (key == "472426060441714688") console.log("value = ", key, value);
      // }
      // console.log("memberObj = ", memberObj);

      // asdf2;

      threshold_cut_members = 15;
      if (original_min_m < threshold_cut_members) {
        original_min_m = threshold_cut_members; // we need to change the original minimum to the threshold
      }

      const memberArr = [];
      for (const key in memberObj) {
        // transform the object to array

        if (memberObj[key].addMember == false) {
          // Delete the people that are not interested on this specific prefefrences
          continue;
        } else {
          console.log("change = tru ");
        }

        // ------------ conn_node_wh_arr --------------
        let conn_node_wh_arr = [];
        let conn_node_wh_obj = memberObj[key].conn_node_wh_obj;
        for (const key in conn_node_wh_obj) {
          conn_node_wh_arr.push({
            nodeID: key,
            totalPercentage:
              (conn_node_wh_obj[key].wh_sum / conn_node_wh_obj[key].numPath) *
              100,
          });
        }

        conn_node_wh_arr.sort(
          // sort it by the percentage
          (a, b) => b.totalPercentage - a.totalPercentage
        );
        // ------------ conn_node_wh_arr --------------

        if (memberObj[key].pers > threshold_cut_members) {
          if (original_max_m - original_min_m > 0) {
            mapped_value =
              ((memberObj[key].pers - original_min_m) *
                (new_min_m - new_max_m)) /
                (original_max_m - original_min_m) +
              new_max_m;
          } else {
            mapped_value = memberObj[key].pers;
          }

          memberArr.push({
            matchPercentage: {
              totalPercentage: mapped_value,
              realTotalPercentage: memberObj[key].pers,
            },
            nodesPercentage: conn_node_wh_arr,
            memberID: key,
          });
        }
      }

      // memberArr.forEach((member) => {
      //   console.log("member = ", member);
      //   // console.log("member = ", member.nodesPercentage);
      // });

      // console.log("memberArr = ", memberArr);

      memberArr.sort(
        // sort it by the percentage
        (a, b) =>
          b.matchPercentage.realTotalPercentage -
          a.matchPercentage.realTotalPercentage
      );

      // console.log("memberObj = ", memberObj);

      return memberArr.slice(page * limit, (page + 1) * limit);
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchNodesToMembers_old: async (parent, args, context, info) => {
    const { nodesID, hoursPerWeek, budgetAmount, serverID } = args.fields;
    let { page, limit } = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = ", args.fields);

    if (!nodesID) throw new ApolloError("nodesID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    if (page != null && limit != null) {
    } else {
      page = 0;
      limit = 10;
    }

    // await Node.updateMany({}, { $unset: { matchRelativePosition_server: "" } });

    // console.log("change = 1" )

    try {
      let project;

      let nodeData = await Node.find({ _id: nodesID });

      if (!nodeData) throw new ApolloError("Node Don't exist");

      // console.log("nodeData[0] = " , nodeData[0])
      // console.log("nodeData[0] = " , nodeData[0].match)

      let numberOfSkills = nodeData.length;

      let distanceAll = [];
      let points = [];
      let percentage = [];
      let skillPercentage = [];

      // console.log("change = 2" )
      let everyID = [];

      let newSkillFlag, percentageNow;
      let matchRelativePosition_serverObj = {};

      // console.log("distanceAll = " , distanceAll)
      for (let i = 0; i < nodeData.length; i++) {
        // inside this function, I nee to replace the way that we calucalte the persentage for every
        // node and then also replace the order, and then the rest will work!
        newSkillFlag = true;

        let matchByServer = nodeData[i].matchByServer;
        let matchRelativePosition_server =
          nodeData[i].matchRelativePosition_server;
        let positionServer = -1;

        console.log("matchByServer = ", matchByServer);

        if (matchByServer === undefined) {
          positionServer = -1;
        } else {
          positionServer = matchByServer.findIndex(
            (x) => x.serverID == serverID
          );
          console.log("positionServer = ", positionServer);
        }

        // ---------------- matchRelativePosition_server ------------
        if (matchRelativePosition_server === undefined) {
          positionServer_MR = -1;
        } else {
          positionServer_MR = matchRelativePosition_server.findIndex(
            (x) => x.serverID == serverID
          );
          console.log("positionServer_MR = ", positionServer_MR);
        }

        //translate the array to object with key the nodeID
        if (positionServer_MR != -1) {
          matchRelativePosition_server[positionServer_MR].MR_Member.forEach(
            (x) => {
              if (matchRelativePosition_serverObj[x.nodeID] === undefined) {
                matchRelativePosition_serverObj[x.nodeID] = x;
              } else {
                matchRelativePosition_serverObj[x.nodeID].path =
                  matchRelativePosition_serverObj[x.nodeID].path.concat(x.path);
              }
            }
          );
        }

        // console.log(
        //   "matchRelativePosition_serverObj = ",
        //   matchRelativePosition_serverObj
        // );
        // asdf22;
        // ---------------- matchRelativePosition_server ------------

        for (let k = 0; k < 3; k++) {
          let membersNow;
          if (positionServer === -1) {
            membersNow = [];
          } else {
            if (k == 0)
              membersNow =
                matchByServer[positionServer].match.distanceMembers.hop0;
            if (k == 1)
              membersNow =
                matchByServer[positionServer].match.distanceMembers.hop1;
            if (k == 2)
              membersNow =
                matchByServer[positionServer].match.distanceMembers.hop2;
          }

          // console.log("k,membersNow = " ,i,nodeData[i]._id ,k,membersNow)

          for (let j = 0; j < membersNow.length; j++) {
            let memberID = membersNow[j];
            if (!everyID.includes(memberID)) {
              distanceAll.push(memberID);
              points.push(1);
              everyID.push(memberID);

              percentageNow =
                (100 / numberOfSkills) * ((25 * (4 - k * 1.5)) / 100); // (How powerful is this skill) * (what is the distance)

              // if (memberID == "908392557258604544"){
              //   console.log("percentageNow = " , percentageNow,i,k,j,newSkillFlag)

              // }

              percentage.push(percentageNow);

              skillPercentage.push([
                {
                  info: nodeData[i]._id,
                  percentage100: percentageNow * numberOfSkills,
                  percentageReal: percentageNow,
                },
              ]);

              // if (newSkillFlag==true) percentage.push(percentageNow)
              newSkillFlag = false;

              // if (i==1) console.log("add the memberID = " , memberID)
            } else {
              // console.log("change = 22",distanceAll )
              // console.log("change = 22",distanceAll )
              let pos = distanceAll.indexOf(memberID);
              // console.log("pos = " , pos)
              if (pos > -1) {
                points[pos] = points[pos] + 1;

                percentageNow =
                  (100 / numberOfSkills) * ((25 * (4 - k * 1.5)) / 100); // (How powerful is this skill) * (what is the distance)

                // if (memberID == "908392557258604544"){
                //   console.log("percentageNow 2= " , percentageNow,i,k,j,newSkillFlag)

                // }

                skillPercentage[pos].push({
                  info: nodeData[i]._id,
                  percentage100: percentageNow * numberOfSkills,
                  percentageReal: percentageNow,
                });

                percentage[pos] = percentage[pos] + percentageNow;
                // if (newSkillFlag == true) percentage[pos] = percentage[pos] + percentageNow
                newSkillFlag = false;
              }
            }
          }
        }
        // console.log("change = 3" )
      }

      // console.log("points = " , points)

      matchSkillsToMembersOutput = [];

      console.log("distanceAll = ", distanceAll);
      console.log("skillPercentage = ", skillPercentage);

      // make a loop over distanceAll

      skillPercentage_prepare = [];
      // ---------------- matchRelativePosition_server ------------
      w1 = 0.5;
      w2 = 1 - w1;

      for (let i = 0; i < distanceAll.length; i++) {
        const nodeID = distanceAll[i];
        const relativePositionNode = matchRelativePosition_serverObj[nodeID];
        if (relativePositionNode) {
          const N = relativePositionNode.path.length;
          sumi = 0;
          for (let j = 0; j < N; j++) {
            obj_t = relativePositionNode.path[j];

            sumi = sumi + obj_t.weight ** obj_t.hop;
          }
          sumi = sumi / N;

          pers = (1 - 1 / N ** 0.7) * w1 + sumi * w2;

          pers = pers * 100;

          skillPercentage_prepare.push({
            info: nodeID,
            percentage100: pers,
            percentageReal: pers,
          });
        }
        // console.log("relativePositionNode = ", relativePositionNode);
        // asdfasfd;
      }

      // asdfasfd;

      skillPercentage_prepare.sort(
        (a, b) => parseFloat(b.percentage100) - parseFloat(a.percentage100)
      );

      distanceAll = [];

      skillPercentage_prepare.forEach((x) => {
        distanceAll.push(x.info);
      });

      console.log("skillPercentage_prepare = ", skillPercentage_prepare);

      // ---------------- matchRelativePosition_server ------------

      // asdfasfd;

      // console.log("skillPercentage = " , skillPercentage[0])
      // // console.log("skillPercentage = " , skillPercentage[0][0])
      // // console.log("skillPercentage = " , skillPercentage[0][0][0])

      // console.log("skillPercentage = " , skillPercentage[2])

      allMembers = [];
      for (let i = 0; i < distanceAll.length; i++) {
        allMembers.push(distanceAll[i]);

        // memberData = await Members.findOne({_id: distanceAll[i]})

        // if (memberData && memberData!=null){

        let realPersentage = -1;
        if (skillPercentage_prepare.length > 0) {
          realPersentage = skillPercentage_prepare[i].percentageReal;
        }

        matchSkillsToMembersOutput.push({
          memberID: distanceAll[i],
          // skillTotalPercentage: 25*(3-i) + (25/nodeData.length)*points[i],
          skillTotalPercentage: percentage[i],
          skillsPercentage: skillPercentage[i],
          hoursPerWeek,
          budgetAmount,
          realPersentage: realPersentage,
        });
        // }
      }
      console.log("change = 4", matchSkillsToMembersOutput);

      // -------------- Clean and Sort ---------------

      // let dataAllMembers1 = await Members.find({ _id: allMembers });
      let dataAllMembers2 = await Members.find({ _id: allMembers }).lean();

      let dataAllMembers2_object = dataAllMembers2.reduce((memObj, member) => {
        memObj[member._id] = member;
        return memObj;
      }, {});

      //  console.log("dataAllMembers 1= " ,dataAllMembers1.length)
      //  console.log("dataAllMembers 2= " ,dataAllMembers2.length)

      //  console.log("dataAllMembers 1= " ,dataAllMembers1)

      // let newmembers = allMembers.map(m_id => dataAllMembers2_object[m_id])

      let newmembers = [];
      let memberNow;
      matchSkillsToMembersOutput.forEach((member) => {
        memberNow = dataAllMembers2_object[member.memberID];
        if (memberNow) {
          let hoursPercentage = 0;
          // console.log("memberNow = " , memberNow)
          if (memberNow.hoursPerWeek && memberNow.hoursPerWeek > 0) {
            hoursPercentage =
              100 - (memberNow.hoursPerWeek - hoursPerWeek) ** 2 / 3;
            if (hoursPercentage < 0) hoursPercentage = 0;
            if (hoursPercentage > 100) hoursPercentage = 100;
          }

          let budgetPercentage = 0;

          if (memberNow.budget && memberNow.budget.totalBudget) {
            budgetPercentage =
              100 - (memberNow.budget.totalBudget - budgetAmount) ** 2 / 3;

            if (budgetPercentage < 0) budgetPercentage = 0;
            if (budgetPercentage > 100) budgetPercentage = 100;
          }

          let skillTotalPercentage = member.skillTotalPercentage;
          let totalPercentage =
            skillTotalPercentage * 0.6 +
            hoursPercentage * 0.2 +
            budgetPercentage * 0.2;

          newmembers.push({
            ...member,
            member: memberNow,
            matchPercentage: {
              totalPercentage,
              skillTotalPercentage,
              hoursPercentage,
              budgetPercentage,
              realTotalPercentage: member.realPersentage,
            },
            totalPercentage: totalPercentage,
          });
        }
      });

      // console.log("dataAllMembers 2= ", newmembers);

      newmembers.sort(
        (a, b) => parseFloat(b.totalPercentage) - parseFloat(a.totalPercentage)
      );

      // let r = 100/(5)
      let r = 100 / newmembers.length;

      newmembers = newmembers.map((member, index) => {
        let min = 0;
        let max = r / 3;
        let randomNum = Math.random() * (max - min) + min;

        let userPercentage = r * (newmembers.length - index) - randomNum;

        return {
          ...member,
          matchPercentage: {
            ...member.matchPercentage,
            totalPercentage: userPercentage,
            // realTotalPercentage: 100,
          },
        };
      });

      // -------------- Clean and Sort ---------------

      return newmembers.slice(page * limit, (page + 1) * limit);
      // return matchSkillsToMembersOutput.slice(page * limit, (page + 1) * limit);
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchSkillsToProjects: async (parent, args, context, info) => {
    // deprecate
    const { nodesID, serverID } = args.fields;
    let { page, limit } = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = ", args.fields);

    if (!nodesID) throw new ApolloError("nodesID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    if (page != null && limit != null) {
    } else {
      page = 0;
      limit = 10;
    }

    try {
      let project;

      let nodeData = await Node.find({ _id: nodesID });

      if (!nodeData) throw new ApolloError("Skill Don't exist");

      // console.log("nodeData[0] = " , nodeData[0])
      // console.log("nodeData[0] = " , nodeData[0].match)

      let distanceAll = [[], [], []];
      let points = [[], [], []];

      let everyID = [];

      // console.log("distanceAll = ", distanceAll);
      for (let i = 0; i < nodeData.length; i++) {
        for (let k = 0; k < 3; k++) {
          let projectsNow;
          if (k == 0) projectsNow = nodeData[i].match.distanceProjectRoles.hop0;
          if (k == 1) projectsNow = nodeData[i].match.distanceProjectRoles.hop1;
          if (k == 2) projectsNow = nodeData[i].match.distanceProjectRoles.hop2;

          for (let j = 0; j < projectsNow.length; j++) {
            let projectID = projectsNow[j];
            if (!everyID.includes(projectID.toString())) {
              distanceAll[k].push(projectID.toString());
              points[k].push(1);
              everyID.push(projectID.toString());

              // if (i==1) console.log("add the projectID = " , projectID)
            } else {
              let pos = distanceAll[k].indexOf(projectID.toString());
              if (pos > -1) points[k][pos] = points[k][pos] + 1;
            }
          }
        }
      }

      // console.log("distanceAll = " , distanceAll)
      // console.log("points = " , points)

      let projectNow_allData = await Projects.find({ "role._id": everyID });

      // console.log("everyID = ", everyID);
      // console.log("projectNow_allData = ", projectNow_allData);

      roleIDtoProjectID = {};

      for (let i = 0; i < projectNow_allData.length; i++) {
        let projectNow = projectNow_allData[i];
        for (let j = 0; j < projectNow.role.length; j++) {
          let roleNow = projectNow.role[j];
          roleIDtoProjectID[roleNow._id.toString()] = projectNow._id.toString();
        }
      }

      console.log("change = 1");

      matchSkillsToMembersOutput = [];
      projectsID_all = [];

      for (let i = 0; i < distanceAll.length; i++) {
        for (let k = 0; k < distanceAll[i].length; k++) {
          // let projectNowData = await Projects.findOne({ "role._id": distanceAll[i][k] })

          let projectNowID = roleIDtoProjectID[distanceAll[i][k]];

          // if (i==0 && k==0) {
          //   console.log("distanceAll[i][k] = " , distanceAll[i][k])
          //   console.log("projectNowData = " , projectNowData)
          // }

          console.log("projectNowID 2 = ", projectNowID);

          if (projectNowID) {
            if (projectsID_all.includes(projectNowID.toString())) {
              let pos = projectsID_all.indexOf(projectNowID.toString());

              newMatchPercentage =
                matchSkillsToMembersOutput[pos].matchPercentage;
              if (
                matchSkillsToMembersOutput[pos].matchPercentage <
                25 * (3 - i) + (25 / nodeData.length) * points[i][k]
              ) {
                newMatchPercentage =
                  25 * (3 - i) + (25 / nodeData.length) * points[i][k];
              }
              matchSkillsToMembersOutput[pos] = {
                projectID: matchSkillsToMembersOutput[pos].projectID,
                matchPercentage: newMatchPercentage,
                commonSkillsID: [],
                projectRoles: [
                  {
                    projectRoleID: distanceAll[i][k],
                    matchPercentage:
                      25 * (3 - i) + (25 / nodeData.length) * points[i][k],
                    commonSkillsID: [],
                  },
                ],
              };
            } else {
              matchSkillsToMembersOutput.push({
                projectID: projectNowID,
                matchPercentage:
                  25 * (3 - i) + (25 / nodeData.length) * points[i][k],
                commonSkillsID: [],

                projectRoles: [
                  {
                    projectRoleID: distanceAll[i][k],
                    matchPercentage:
                      25 * (3 - i) + (25 / nodeData.length) * points[i][k],
                    commonSkillsID: [],
                  },
                ],
              });
              projectsID_all.push(projectNowID.toString());
            }
          }
        }
      }

      console.log("change = 2");

      return matchSkillsToMembersOutput.slice(page * limit, (page + 1) * limit);
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchNodesToProjectRoles: async (parent, args, context, info) => {
    const { nodesID, serverID } = args.fields;
    let { page, limit } = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = ", args.fields);

    if (!nodesID) throw new ApolloError("nodesID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    const serverID_set = new Set(serverID);

    if (page != null && limit != null) {
    } else {
      page = 0;
      limit = 10;
    }

    try {
      let project;

      let nodeData = await Node.find({ _id: nodesID }).select("_id match_v2");

      if (!nodeData) throw new ApolloError("Node Don't exist");

      w1 = 0.3; // the weight of the number of paths
      w2 = 1 - w1; // the weight of the weight_path^hop (this is really confusing but, second weight is the weight of the path)
      projectRoleObj = {};

      new_max_m = 20;
      new_min_m = 100;

      original_min_m = 110; // will change on the loop
      original_max_m = -10; // will change on the loop

      for (let i = 0; i < nodeData.length; i++) {
        // loop on the nodes
        let match_v2 = nodeData[i].match_v2;

        for (let j = 0; j < match_v2.length; j++) {
          // find all the connections for this particular node
          // check if serverID exist on array match_v2.serverID
          if (
            match_v2[j].serverID.some((value) => serverID_set.has(value)) &&
            match_v2[j].type == "ProjectRole"
          ) {
            // If this is both have the serverID and is Member

            // Add this user to the projectRoleObj
            // and Make the calculation for the percentage for this user

            if (projectRoleObj[match_v2[j].nodeResID]) {
              projectRoleObj[match_v2[j].nodeResID].wh_sum +=
                match_v2[j].wh_sum;
              projectRoleObj[match_v2[j].nodeResID].numPath +=
                match_v2[j].numPath;

              const N = projectRoleObj[match_v2[j].nodeResID].numPath;
              const sumi = projectRoleObj[match_v2[j].nodeResID].wh_sum;
              const pers = ((1 - 1 / N ** 0.7) * w1 + (sumi / N) * w2) * 100;

              projectRoleObj[match_v2[j].nodeResID].pers = Number(
                pers.toFixed(2)
              );
            } else {
              const N = match_v2[j].numPath;
              const sumi = match_v2[j].wh_sum;
              const pers = ((1 - 1 / N ** 0.7) * w1 + (sumi / N) * w2) * 100;
              projectRoleObj[match_v2[j].nodeResID] = {
                wh_sum: match_v2[j].wh_sum,
                numPath: match_v2[j].numPath,
                pers: Number(pers.toFixed(2)),
              };
            }
            if (projectRoleObj[match_v2[j].nodeResID].pers > original_max_m) {
              original_max_m = projectRoleObj[match_v2[j].nodeResID].pers;
            }
            if (projectRoleObj[match_v2[j].nodeResID].pers < original_min_m) {
              original_min_m = projectRoleObj[match_v2[j].nodeResID].pers;
            }
          }
        }
      }

      console.log("projectRoleObj = ", projectRoleObj);

      threshold_cut_members = 15;
      if (original_min_m < threshold_cut_members) {
        original_min_m = threshold_cut_members; // we need to change the original minimum to the threshold
      }

      // tranform to project
      let projectObj = {};

      let mapped_value;
      for (const key in projectRoleObj) {
        let projectData = await Projects.findOne({ "role._id": key });

        if (projectData) {
          if (original_max_m - original_min_m > 0) {
            mapped_value =
              ((projectRoleObj[key].pers - original_min_m) *
                (new_min_m - new_max_m)) /
                (original_max_m - original_min_m) +
              new_max_m;
          } else {
            mapped_value = projectObj[key].pers;
          }

          if (projectObj[projectData._id]) {
            if (
              projectObj[projectData._id].realPercebtage <
              projectRoleObj[key].pers
            ) {
              projectObj[projectData._id].realPercebtage =
                projectRoleObj[key].pers;

              projectObj[projectData._id].matchPercentage = mapped_value;
            }
            projectObj[projectData._id].projectRoles.push({
              projectRoleID: key,
              realPercebtage: projectRoleObj[key].pers,
              matchPercentage: mapped_value,
            });
          } else {
            projectObj[projectData._id] = {
              project: projectData,
              realPercebtage: projectRoleObj[key].pers,
              matchPercentage: mapped_value,
              projectRoles: [
                {
                  projectRoleID: key,
                  realPercebtage: projectRoleObj[key].pers,
                  matchPercentage: mapped_value,
                },
              ],
            };
          }
        }
      }

      const projectArr = [];
      for (const key in projectObj) {
        // transform the object to array

        projectArr.push({
          matchPercentage: projectObj[key].matchPercentage,
          realPercebtage: projectObj[key].realPercebtage,
          project: projectObj[key].project,
          projectRoles: projectObj[key].projectRoles,
        });
      }

      // console.log("projectObj = ", projectObj);

      projectArr.sort(
        // sort it by the percentage
        (a, b) => b.matchPercentage - a.matchPercentage
      );

      // console.log("projectArr = ", projectArr);

      return projectArr.slice(page * limit, (page + 1) * limit);
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  matchNodesToProjectRoles_old: async (parent, args, context, info) => {
    const { nodesID, serverID } = args.fields;
    let { page, limit } = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = ", args.fields);

    if (!nodesID) throw new ApolloError("nodesID is required");

    let queryServerID = [];
    if (serverID) {
      serverID.forEach((id) => {
        queryServerID.push({ serverID: id });
      });
    }

    if (page != null && limit != null) {
    } else {
      page = 0;
      limit = 10;
    }

    try {
      let project;

      let nodeData = await Node.find({ _id: nodesID });

      if (!nodeData) throw new ApolloError("Node Don't exist");

      // console.log("nodeData[0] = " , nodeData[0])
      // console.log("nodeData[0] = " , nodeData[0].match)

      let distanceAll = [[], [], []];
      let points = [[], [], []];

      let everyID = [];

      // console.log("distanceAll = ", distanceAll);
      for (let i = 0; i < nodeData.length; i++) {
        newSkillFlag = true;

        let matchByServer = nodeData[i].matchByServer;
        let positionServer = -1;

        console.log("matchByServer = ", matchByServer);

        if (matchByServer === undefined) {
          positionServer = -1;
        } else {
          positionServer = matchByServer.findIndex(
            (x) => x.serverID == serverID
          );
          console.log("positionServer = ", positionServer);
        }

        for (let k = 0; k < 3; k++) {
          let projectsNow;
          if (k == 0)
            projectsNow =
              matchByServer[positionServer].match.distanceProjectRoles.hop0;
          if (k == 1)
            projectsNow =
              matchByServer[positionServer].match.distanceProjectRoles.hop1;
          if (k == 2)
            projectsNow =
              matchByServer[positionServer].match.distanceProjectRoles.hop2;

          for (let j = 0; j < projectsNow.length; j++) {
            let projectID = projectsNow[j];
            if (!everyID.includes(projectID.toString())) {
              distanceAll[k].push(projectID.toString());
              points[k].push(1);
              everyID.push(projectID.toString());

              // if (i==1) console.log("add the projectID = " , projectID)
            } else {
              let pos = distanceAll[k].indexOf(projectID.toString());
              if (pos > -1) points[k][pos] = points[k][pos] + 1;
            }
          }
        }
      }

      // console.log("distanceAll = " , distanceAll)
      // console.log("points = " , points)

      let projectNow_allData = await Projects.find({ "role._id": everyID });

      // console.log("everyID = ", everyID);
      // console.log("projectNow_allData = ", projectNow_allData);

      roleIDtoProjectID = {};

      for (let i = 0; i < projectNow_allData.length; i++) {
        let projectNow = projectNow_allData[i];
        for (let j = 0; j < projectNow.role.length; j++) {
          let roleNow = projectNow.role[j];
          roleIDtoProjectID[roleNow._id.toString()] = projectNow._id.toString();
        }
      }

      console.log("change = 1");

      matchSkillsToMembersOutput = [];
      projectsID_all = [];

      for (let i = 0; i < distanceAll.length; i++) {
        for (let k = 0; k < distanceAll[i].length; k++) {
          // let projectNowData = await Projects.findOne({ "role._id": distanceAll[i][k] })

          let projectNowID = roleIDtoProjectID[distanceAll[i][k]];

          // if (i==0 && k==0) {
          //   console.log("distanceAll[i][k] = " , distanceAll[i][k])
          //   console.log("projectNowData = " , projectNowData)
          // }

          console.log("projectNowID 2 = ", projectNowID);

          if (projectNowID) {
            if (projectsID_all.includes(projectNowID.toString())) {
              let pos = projectsID_all.indexOf(projectNowID.toString());

              newMatchPercentage =
                matchSkillsToMembersOutput[pos].matchPercentage;
              if (
                matchSkillsToMembersOutput[pos].matchPercentage <
                25 * (3 - i) + (25 / nodeData.length) * points[i][k]
              ) {
                newMatchPercentage =
                  25 * (3 - i) + (25 / nodeData.length) * points[i][k];
              }
              matchSkillsToMembersOutput[pos] = {
                projectID: matchSkillsToMembersOutput[pos].projectID,
                matchPercentage: newMatchPercentage,
                commonSkillsID: [],
                projectRoles: [
                  {
                    projectRoleID: distanceAll[i][k],
                    matchPercentage:
                      25 * (3 - i) + (25 / nodeData.length) * points[i][k],
                    commonSkillsID: [],
                  },
                ],
              };
            } else {
              matchSkillsToMembersOutput.push({
                projectID: projectNowID,
                matchPercentage:
                  25 * (3 - i) + (25 / nodeData.length) * points[i][k],
                commonSkillsID: [],

                projectRoles: [
                  {
                    projectRoleID: distanceAll[i][k],
                    matchPercentage:
                      25 * (3 - i) + (25 / nodeData.length) * points[i][k],
                    commonSkillsID: [],
                  },
                ],
              });
              projectsID_all.push(projectNowID.toString());
            }
          }
        }
      }

      console.log("change = 2");

      return matchSkillsToMembersOutput.slice(page * limit, (page + 1) * limit);
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
};
