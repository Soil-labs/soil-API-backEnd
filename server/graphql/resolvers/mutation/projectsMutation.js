const { Projects } = require("../../../models/projectsModel");
const { Node } = require("../../../models/nodeModal");
const { Team } = require("../../../models/teamModal");
const { Role } = require("../../../models/roleModel");
const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");
const { Epic } = require("../../../models/epicModel");
const { ApolloError } = require("apollo-server-express");
const { TeamMember } = require("discord.js");
const { driver } = require("../../../../server/neo4j_config");
const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");

const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID,
  updateNode_neo4j_serverID_projectID,
  makeConnection_neo4j,
  findAllNodesDistanceRfromNode_neo4j,
  deleteConnectionANYBetweenNodes_neo4j,
  deleteNode_neo4j,
} = require("../../../neo4j/func_neo4j");

module.exports = {
  createProject: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const {
        title,
        description,
        descriptionOneLine,
        emoji,
        backColorEmoji,
        team,
        role,
        collaborationLinks,
        budget,
        dates,
        stepsJoinProject,
        serverID,
        gardenServerID,
      } = JSON.parse(JSON.stringify(args.fields));
      console.log("Mutation > createProject > args.fields = ", args.fields);

      if (!title) throw new ApolloError("The title is required");
      if (!description) throw new ApolloError("The description is required");
      if (!serverID) throw new ApolloError("The serverID is required");

      const champion = user._id;
      let fields = {
        registeredAt: new Date(),
      };

      if (title) fields = { ...fields, title };
      if (description) fields = { ...fields, description };
      if (descriptionOneLine) fields = { ...fields, descriptionOneLine };
      if (emoji) fields = { ...fields, emoji };
      if (backColorEmoji) fields = { ...fields, backColorEmoji };
      if (champion) fields = { ...fields, champion };
      if (team) fields = { ...fields, team };
      if (role) fields = { ...fields, role };
      if (collaborationLinks) fields = { ...fields, collaborationLinks };
      if (budget) fields = { ...fields, budget };
      if (dates) fields = { ...fields, dates };
      if (stepsJoinProject) fields = { ...fields, stepsJoinProject };
      if (gardenServerID) fields = { ...fields, gardenServerID };
      if (serverID) fields.serverID = serverID;

      let projectData = await new Projects(fields);
      projectData.save();

      await createNode_neo4j_field({
        fields: {
          node: "Project",
          _id: projectData._id,
          project_id: projectData._id,
          name: projectData.title,
          serverID: projectData.serverID,
        },
      });

      //add the champion
      let memberDataChampion = await Members.findOne({ _id: champion });

      if (memberDataChampion) {
        let currentProjects = [...memberDataChampion.projects];

        currentProjects.push({
          projectID: projectData._id,
          champion: true,
        });

        memberDataUpdate = await Members.findOneAndUpdate(
          { _id: champion },
          {
            $set: { projects: currentProjects },
          },
          { new: true }
        );

        // add champion relationship between project node and member
        makeConnection_neo4j({
          node: ["Project", "Member"],
          id: [projectData._id, memberDataChampion._id],
          connection: "CHAMPION",
        });
      }

      if (team && fields.team && fields.team.length > 0) {
        console.log("team members!!!: ", fields.team); // prints out

        // const session4 = driver.session({database:"neo4j"});
        for (let i = 0; i < fields.team.length; i++) {
          // console.log("team ---- --- -- --  = " , i)

          makeConnection_neo4j({
            node: ["Project", "Member"],
            id: [projectData._id, fields.team[i].memberID],
            connection: "TEAM_MEMBER",
          });

          let memberData = await Members.findOne({
            _id: fields.team[i].members,
          });
          console.log("member data OBJECT 111: ", memberData); //null

          if (memberData) {
            console.log("member data OBJECT 222: ", memberData); //doesn't print out

            let currentProjects = [...memberData.projects];

            currentProjects.push({
              projectID: projectData._id,
              champion: false,
              roleID: fields.team[i].roleID,
              phase: fields.team[i].phase,
            });
            console.log("Member's current projects = ", currentProjects);

            if (memberData) {
              // console.log("currentProjects = " , currentProjects)
              memberDataUpdate = await Members.findOneAndUpdate(
                { _id: fields.team[i].memberID },
                {
                  $set: { projects: currentProjects },
                },
                { new: true }
              );
              // console.log("memberDataUpdate = " , memberDataUpdate)
            }
          }
        }
      }

      if (role && projectData.role && projectData.role.length > 0) {
        for (let i = 0; i < projectData.role.length; i++) {
          let RoleNow = projectData.role[i];

          console.log("change = 2232");

          await createNode_neo4j_field({
            fields: {
              node: "Role",
              _id: RoleNow._id,
              project_id: projectData._id,
              name: RoleNow.title,
              serverID: projectData.serverID,
            },
          });

          makeConnection_neo4j({
            node: ["Project", "Role"],
            id: [projectData._id, RoleNow._id],
            connection: "ROLE",
          });

          for (let j = 0; j < RoleNow.skills.length; j++) {
            let SkillNow = RoleNow.skills[j];

            makeConnection_neo4j({
              node: ["Role", "Skill"],
              id: [RoleNow._id, SkillNow._id],
              connection: "ROLE_SKILL",
            });

            skillData = await Skills.findOne({ _id: SkillNow._id });

            if (skillData) {
              // Recalculate the skill match now that neo4j diagram changed
              await Skills.findOneAndUpdate(
                { _id: skillData._id },
                {
                  $set: {
                    match: {
                      recalculateProjectRoles: true,
                      distanceProjectRoles: skillData.distanceProjectRoles,

                      recalculateMembers: true,
                      distanceMembers: skillData.distanceMembers,
                    },
                  },
                },
                { new: true }
              );
            }
          }
        }
      } else if (serverID) {
        for (let i = 0; i < projectData.role.length; i++) {
          let RoleNow = projectData.role[i];

          updateNode_neo4j_serverID_projectID({
            node: "Role",
            project_id: projectData._id,
            serverID: projectData.serverID,
          });
        }
      }

      return projectData;
    }
  ),

  updateProject: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const {
        _id,
        title,
        description,
        descriptionOneLine,
        emoji,
        backColorEmoji,
        team,
        role,
        collaborationLinks,
        budget,
        dates,
        stepsJoinProject,
        serverID,
        gardenServerID,
      } = JSON.parse(JSON.stringify(args.fields));

      console.log("Mutation > updateProject > args.fields = ", args.fields);
      const champion = user._id;

      if (!_id) throw new ApolloError("The project _id is required");

      let fields = {
        _id,
      };

      if (title) fields = { ...fields, title };
      if (description) fields = { ...fields, description };
      if (descriptionOneLine) fields = { ...fields, descriptionOneLine };
      if (emoji) fields = { ...fields, emoji };
      if (backColorEmoji) fields = { ...fields, backColorEmoji };
      if (team) fields = { ...fields, team };
      if (role) fields = { ...fields, role };
      if (collaborationLinks) fields = { ...fields, collaborationLinks };
      if (budget) fields = { ...fields, budget };
      if (dates) fields = { ...fields, dates };
      if (stepsJoinProject) fields = { ...fields, stepsJoinProject };
      if (gardenServerID) fields = { ...fields, gardenServerID };

      console.log("fields = ", fields);

      try {
        let projectData;

        projectData = await Projects.findOne({
          _id: fields._id,
          champion: champion,
        });

        // console.log("projectData 1 = ", projectData);

        if (!projectData) {
          throw new ApolloError(
            "project _id not valid or you not the project champion"
          );
        } else {
          fields.serverID = serverID;

          projectData = await Projects.findOneAndUpdate(
            { _id: projectData._id },
            {
              $set: fields,
            },
            { new: true }
          );

          if (fields.serverID) {
            await updateNode_neo4j_serverID({
              node: "Project",
              id: projectData._id,
              serverID: projectData.serverID,
            });
          }
        }
        // console.log("team ---- --- -- --  = " , team)

        if (team && fields.team && fields.team.length > 0) {
          console.log("team members!!!: ", fields.team); // prints out

          // const session4 = driver.session({database:"neo4j"});
          for (let i = 0; i < fields.team.length; i++) {
            // console.log("team ---- --- -- --  = " , i)

            makeConnection_neo4j({
              node: ["Project", "Member"],
              id: [projectData._id, fields.team[i].memberID],
              connection: "TEAM_MEMBER",
            });

            let memberData = await Members.findOne({
              _id: fields.team[i].members,
            });
            console.log("member data OBJECT 111: ", memberData); //null

            if (memberData) {
              console.log("member data OBJECT 222: ", memberData); //doesn't print out

              let currentProjects = [...memberData.projects];

              currentProjects.push({
                projectID: projectData._id,
                champion: false,
                roleID: fields.team[i].roleID,
                phase: fields.team[i].phase,
              });
              console.log("Member's current projects = ", currentProjects);

              if (memberData) {
                // console.log("currentProjects = " , currentProjects)
                memberDataUpdate = await Members.findOneAndUpdate(
                  { _id: fields.team[i].memberID },
                  {
                    $set: { projects: currentProjects },
                  },
                  { new: true }
                );
                // console.log("memberDataUpdate = " , memberDataUpdate)
              }
            }
          }
        }

        if (role && projectData.role && projectData.role.length > 0) {
          for (let i = 0; i < projectData.role.length; i++) {
            let RoleNow = projectData.role[i];

            console.log("change = 2232");

            await createNode_neo4j_field({
              fields: {
                node: "Role",
                _id: RoleNow._id,
                project_id: projectData._id,
                name: RoleNow.title,
                serverID: projectData.serverID,
              },
            });

            makeConnection_neo4j({
              node: ["Project", "Role"],
              id: [projectData._id, RoleNow._id],
              connection: "ROLE",
            });

            for (let j = 0; j < RoleNow.skills.length; j++) {
              let SkillNow = RoleNow.skills[j];

              makeConnection_neo4j({
                node: ["Role", "Skill"],
                id: [RoleNow._id, SkillNow._id],
                connection: "ROLE_SKILL",
              });

              skillData = await Skills.findOne({ _id: SkillNow._id });

              if (skillData) {
                // Recalculate the skill match now that neo4j diagram changed
                await Skills.findOneAndUpdate(
                  { _id: skillData._id },
                  {
                    $set: {
                      match: {
                        recalculateProjectRoles: true,
                        distanceProjectRoles: skillData.distanceProjectRoles,

                        recalculateMembers: true,
                        distanceMembers: skillData.distanceMembers,
                      },
                    },
                  },
                  { new: true }
                );
              }
            }
          }
        } else if (serverID) {
          for (let i = 0; i < projectData.role.length; i++) {
            let RoleNow = projectData.role[i];

            updateNode_neo4j_serverID_projectID({
              node: "Role",
              project_id: projectData._id,
              serverID: projectData.serverID,
            });
          }
        }

        return projectData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "projectMutation",
          { component: "projectMutation > updateProject" }
        );
      }
    }
  ),

  deleteNodesToProjectRole: async (parent, args, context, info) => {
    const { projectRoleID, nodesID } = args.fields;

    console.log(
      "Mutation > deleteNodesToProjectRole > args.fields = ",
      args.fields
    );

    if (!projectRoleID) throw new ApolloError("projectRoleID is required");

    try {
      let projectData = await Projects.findOne({ "role._id": projectRoleID });
      let nodesData = await Node.find({ _id: nodesID }).select("_id name node");

      projectRoleData = projectData.role.filter(
        (role) => role._id == projectRoleID
      );

      projectRoleData = projectRoleData[0];

      // console.log("projectRoleData = " , projectRoleData)

      projectRoleData = {
        _id: projectRoleData._id,
        title: projectRoleData.title,
        skills: projectRoleData.skills,
        nodes: projectRoleData.nodes,
        serverID: projectData.serverID,
      };

      // check if the nodes are already in the member (projectData.nodes)
      let nodesDataOriginalArray = projectRoleData.nodes.map(function (item) {
        return item._id.toString();
      });

      let nodesIDArray = nodesID.map(function (item) {
        return item.toString();
      });

      // let differenceNodes = nodesIDArray.filter(x => !nodesDataOriginalArray.includes(x));
      // console.log("differenceNodes = " , differenceNodes)

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

        projectRoleData.nodes = nodeExistOnlyMember_id;

        for (let i = 0; i < nodesDataNew.length; i++) {
          let nodeNow = nodesDataNew[i];
          // makeConnection_neo4j({
          //   node:["Role",nodeNow.node],
          //   id:[projectRoleData._id,nodeNow._id],
          //   connection:"connection",
          // })
          deleteConnectionANYBetweenNodes_neo4j({
            nodeID_1: projectRoleData._id,
            nodeID_2: nodeNow._id,
          });

          changeMatchByServer(nodeNow, projectRoleData);
        }

        let position = projectData.role.findIndex(
          (x) => x._id == projectRoleID
        );

        projectData.role[position].nodes = projectRoleData.nodes;

        // add all of the nodes on mongoDB
        projectData2 = await Projects.findOneAndUpdate(
          { _id: projectData._id },
          {
            $set: {
              role: projectData.role,
            },
          },
          { new: true }
        );

        console.log("projectData2 = ", projectData2);

        return projectData2;
      }

      return projectData;
      // return {}
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  addNodesToProjectRole: async (parent, args, context, info) => {
    const { projectRoleID, nodesID } = args.fields;

    console.log(
      "Mutation > addNodesToProjectRole > args.fields = ",
      args.fields
    );

    if (!projectRoleID) throw new ApolloError("projectRoleID is required");

    try {
      let projectData = await Projects.findOne({ "role._id": projectRoleID });

      let nodesData = await Node.find({ _id: nodesID }).select("_id name node");

      projectRoleData = projectData.role.filter(
        (role) => role._id == projectRoleID
      );

      projectRoleData = projectRoleData[0];

      // console.log("projectRoleData = " , projectRoleData)

      projectRoleData = {
        _id: projectRoleData._id,
        title: projectRoleData.title,
        skills: projectRoleData.skills,
        nodes: projectRoleData.nodes,
        serverID: projectData.serverID,
      };

      console.log("projectRoleData = ", projectRoleData);

      // check if the nodes are already in the member (projectData.nodes)
      let nodesDataOriginalArray = projectRoleData.nodes.map(function (item) {
        return item._id.toString();
      });

      // nodesDataOriginalArray = ["6375243c207bff7a7c220e6e"]
      console.log("nodesDataOriginalArray = ", nodesDataOriginalArray);

      let nodesIDArray = nodesID.map(function (item) {
        return item.toString();
      });
      console.log("nodesIDArray = ", nodesIDArray);

      let differenceNodes = nodesIDArray.filter(
        (x) => !nodesDataOriginalArray.includes(x)
      );
      console.log("differenceNodes = ", differenceNodes);

      if (differenceNodes.length > 0) {
        let nodesDataNew = [];
        for (let i = 0; i < differenceNodes.length; i++) {
          let nodeID = differenceNodes[i];
          let nodeData = nodesData.find((x) => x._id.toString() == nodeID);
          nodesDataNew.push(nodeData);
          projectRoleData.nodes.push({ _id: nodeID });
        }

        for (let i = 0; i < nodesDataNew.length; i++) {
          let nodeNow = nodesDataNew[i];
          makeConnection_neo4j({
            node: [nodeNow.node, "Role"],
            id: [nodeNow._id, projectRoleData._id],
            connection: "connection",
          });

          changeMatchByServer(nodeNow, projectRoleData);
        }

        let position = projectData.role.findIndex(
          (x) => x._id == projectRoleID
        );

        projectData.role[position].nodes = projectRoleData.nodes;

        // add all of the nodes on mongoDB
        projectData2 = await Projects.findOneAndUpdate(
          { _id: projectData._id },
          {
            $set: {
              role: projectData.role,
            },
          },
          { new: true }
        );

        console.log("projectData2 = ", projectData2);

        return projectData2;
      }

      return projectData;
      // return {}
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  updateNodesToProjectRole: async (parent, args, context, info) => {
    const { projectRoleID, nodesID, nodeType } = args.fields;

    console.log(
      "Mutation > updateNodesToProjectRole > args.fields = ",
      args.fields
    );

    if (!projectRoleID) throw new ApolloError("projectRoleID is required");

    try {
      let nodesData = await Node.find({ _id: nodesID }).select(
        "_id name node match_v2_update"
      );

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

      let projectData = await Projects.findOne({
        "role._id": projectRoleID,
      }).select("_id title role nodes serverID");

      projectRoleData = projectData.role.filter(
        (role) => role._id == projectRoleID
      );

      projectRoleData = projectRoleData[0];

      projectRoleData = {
        _id: projectRoleData._id,
        title: projectRoleData.title,
        nodes: projectRoleData.nodes,
        serverID: projectData.serverID,
      };

      console.log("projectRoleData = ", projectRoleData);

      // check if the nodes are already in the member (projectData.nodes)
      let nodesID_projectRole = projectRoleData.nodes.map(function (item) {
        return item._id.toString();
      });

      // nodesID_projectRole = ["6375243c207bff7a7c220e6e"]
      console.log("nodesID_projectRole = ", nodesID_projectRole);

      // --------- Separate all the Nodes, and the nodeTypes ----------------
      let nodeData_projectRole_all = await Node.find({
        _id: nodesID_projectRole,
      }).select("_id name node");

      nodeData_projectRole_type = [];
      nodeID_projectRole_type = [];
      nodeID_projectRole_all = [];
      nodeData_projectRole_all.forEach((node) => {
        nodeID_projectRole_all.push(node._id.toString());
        if (node.node == nodeType) {
          nodeData_projectRole_type.push(node);
          nodeID_projectRole_type.push(node._id.toString());
        }
      });

      console.log("nodesID_array = ", nodesID_array);
      console.log("nodeID_projectRole_type = ", nodeID_projectRole_type);
      console.log("nodeData_projectRole_all = ", nodeData_projectRole_all);

      // --------- Separate all the Nodes, and the nodeTypes ----------------

      /// --------------- Add Nodes that Don't exist already on the projectRole for this specific type of node ----------------
      let differenceNodes = nodesID_array.filter(
        (x) => !nodeID_projectRole_type.includes(x)
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
          if (nodeData) nodesDataNew.push(nodeData);
          nodeData_projectRole_all.push({ _id: nodeID });
        }

        console.log("nodesDataNew = ", nodesDataNew);

        // asdf;

        // add only the new ones as relationship on Neo4j
        for (let i = 0; i < nodesDataNew.length; i++) {
          let nodeNow = nodesDataNew[i];
          makeConnection_neo4j({
            node: [nodeNow.node, "Role"],
            id: [nodeNow._id, projectRoleData._id],
            connection: "connection",
          });

          changeMatchByServer(nodeNow, projectRoleData);
        }
      }
      /// --------------- Add Nodes that Don't exist already on the projectRole for this specific type of node ----------------

      // -------------- Remove the Nodes that are not in the nodesID_array ----------------
      let nodesExistProjectRoleAndNode = nodeID_projectRole_type.filter((x) =>
        nodesID_array.includes(x)
      );
      console.log(
        "nodesExistProjectRoleAndNode = ",
        nodesExistProjectRoleAndNode
      );

      let nodeExistOnlyProjectRole = nodeID_projectRole_type.filter(
        (x) => !nodesID_array.includes(x)
      );
      console.log("nodeExistOnlyProjectRole = ", nodeExistOnlyProjectRole);

      // asdf;
      // console.log("change = " , change)

      if (nodeExistOnlyProjectRole.length > 0) {
        nodeData_projectRole_all = nodeData_projectRole_all.filter(
          (element) =>
            !nodeExistOnlyProjectRole.includes(element._id.toString())
        );

        console.log("nodeData_projectRole_all = ", nodeData_projectRole_all);

        console.log("nodeExistOnlyProjectRole = ", nodeExistOnlyProjectRole);

        // add only the new ones as relationship on Neo4j
        for (let i = 0; i < nodeExistOnlyProjectRole.length; i++) {
          let nodeNow = { _id: nodeExistOnlyProjectRole[i] };
          deleteConnectionANYBetweenNodes_neo4j({
            nodeID_1: projectRoleData._id,
            nodeID_2: nodeNow._id,
          });

          changeMatchByServer(nodeNow, projectRoleData);
        }
      }
      // -------------- Remove the Nodes that are not in the nodesID_array ----------------

      let position = projectData.role.findIndex((x) => x._id == projectRoleID);

      projectData.role[position].nodes = nodeData_projectRole_all;

      projectData2 = await Projects.findOneAndUpdate(
        { _id: projectData._id },
        {
          $set: {
            role: projectData.role,
          },
        },
        { new: true }
      );

      return projectData2;

      // asdf2;

      // let nodesIDArray = nodesID.map(function (item) {
      //   return item.toString();
      // });
      // console.log("nodesIDArray = ", nodesIDArray);

      // let differenceNodes = nodesIDArray.filter(
      //   (x) => !nodesID_projectRole.includes(x)
      // );
      // console.log("differenceNodes = ", differenceNodes);

      // if (differenceNodes.length > 0) {
      //   let nodesDataNew = [];
      //   for (let i = 0; i < differenceNodes.length; i++) {
      //     let nodeID = differenceNodes[i];
      //     let nodeData = nodesData.find((x) => x._id.toString() == nodeID);
      //     nodesDataNew.push(nodeData);
      //     projectRoleData.nodes.push({ _id: nodeID });
      //   }

      //   for (let i = 0; i < nodesDataNew.length; i++) {
      //     let nodeNow = nodesDataNew[i];
      //     makeConnection_neo4j({
      //       node: [nodeNow.node, "Role"],
      //       id: [nodeNow._id, projectRoleData._id],
      //       connection: "connection",
      //     });

      //     changeMatchByServer(nodeNow, projectRoleData);
      //   }

      //   let position = projectData.role.findIndex(
      //     (x) => x._id == projectRoleID
      //   );

      //   projectData.role[position].nodes = projectRoleData.nodes;

      //   // add all of the nodes on mongoDB
      //   projectData2 = await Projects.findOneAndUpdate(
      //     { _id: projectData._id },
      //     {
      //       $set: {
      //         role: projectData.role,
      //       },
      //     },
      //     { new: true }
      //   );

      //   console.log("projectData2 = ", projectData2);

      //   return projectData2;
      // }

      // return projectData;
      // return {}
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  addProjectRole: async (parent, args, context, info) => {
    const { projectID, title, description } = args.fields;

    console.log("Mutation > addProjectRole > args.fields = ", args.fields);

    if (!projectID) throw new ApolloError("projectID is required");

    let fields = {};

    if (title) fields = { ...fields, title };
    if (description) fields = { ...fields, description };

    try {
      let projectData = await Projects.findOne({ _id: projectID });

      if (!projectData) throw new ApolloError("project don't exist");

      console.log("projectData = ", projectData);

      projectData.role.push({
        ...fields,
      });

      projectData2 = await Projects.findOneAndUpdate(
        { _id: projectData._id },
        {
          $set: {
            role: projectData.role,
          },
        },
        { new: true }
      );

      if (projectData2.role.length > 0) {
        let RoleNow = projectData2.role[projectData2.role.length - 1];
        await createNode_neo4j_field({
          fields: {
            node: "Role",
            _id: RoleNow._id,
            project_id: projectData2._id,
            name: RoleNow.title,
            serverID: projectData2.serverID,
          },
        });

        makeConnection_neo4j({
          node: ["Project", "Role"],
          id: [projectData2._id, RoleNow._id],
          connection: "ROLE",
        });
      }

      return projectData2;
      // return {}
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  newTweetProject: async (parent, args, context, info) => {
    let { projectID, title, content, author, approved } = JSON.parse(
      JSON.stringify(args.fields)
    );
    console.log("Mutation > newTweetProject > args.fields = ", args.fields);

    if (!projectID) throw new ApolloError("you need to specify a project ID");
    // if (!title) throw new ApolloError( "you need to specify title");
    // if (!content) throw new ApolloError( "you need to specify content");
    if (!author) throw new ApolloError("you need to specify author ID");

    var ObjectId = require("mongoose").Types.ObjectId;

    if (ObjectId.isValid(projectID) == false)
      throw new ApolloError("The project doesn't have a valid mongo ID");

    if (!approved) approved = false;

    let fields = {
      title,
      content,
      author,
      approved,
      registeredAt: new Date(),
    };

    try {
      let projectData = await Projects.findOne({ _id: projectID });

      let memberData = await Members.findOne({ _id: fields.author });

      if (!projectData)
        throw new ApolloError(
          "This project dont exist you need to choose antoher project"
        );
      if (!memberData)
        throw new ApolloError(
          "The author dont exist on the database you need to choose antoher author ID"
        );

      projectData.tweets.push(fields);

      projectDataUpdate = await Projects.findOneAndUpdate(
        { _id: projectData._id },
        {
          $set: { tweets: projectData.tweets },
        },
        { new: true }
      );

      let newTweetID =
        projectDataUpdate.tweets[projectDataUpdate.tweets.length - 1]._id;

      return {
        newTweetID,
        numTweets: projectDataUpdate.tweets.length,
        tweets: projectDataUpdate.tweets,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  approveTweet: async (parent, args, context, info) => {
    const { projectID, tweetID, approved } = JSON.parse(
      JSON.stringify(args.fields)
    );
    console.log("Mutation > approveTweet > args.fields = ", args.fields);

    if (!projectID) throw new ApolloError("you need to specify a project ID");
    if (!tweetID) throw new ApolloError("you need to specify a tweet ID");
    if (approved == null)
      throw new ApolloError(
        "you need to specify if the tweet is approved or not"
      );

    try {
      let projectData = await Projects.findOne({ _id: projectID });

      if (!projectData)
        throw new ApolloError(
          "This project dont exist you need to choose antoher project"
        );

      projectData.tweets.forEach((tweet) => {
        //console.log("tweet = " , tweet)
        if (tweet._id == tweetID) {
          tweet.approved = approved;
        }
      });

      projectDataUpdate = await Projects.findOneAndUpdate(
        { _id: projectID },
        {
          $set: { tweets: projectData.tweets },
        },
        { new: true }
      );

      return projectDataUpdate;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  changeTeamMember_Phase_Project: async (parent, args, context, info) => {
    const { projectID, memberID, roleID, phase } = JSON.parse(
      JSON.stringify(args.fields)
    );
    console.log(
      "Mutation > changeTeamMember_Phase_Project > args.fields = ",
      args.fields
    );

    if (!projectID) throw new ApolloError("you need to specify a project ID");
    if (!memberID) throw new ApolloError("you need to specify a tweet ID");
    if (!roleID) throw new ApolloError("you need to specify a role ID");
    if (phase == null)
      throw new ApolloError(
        "you need to specify if the tweet is approved or not"
      );

    console.log("projectID,memberID,phase = ", projectID, memberID, phase);

    try {
      let projectData = await Projects.findOne({ _id: projectID });

      // let roleData = await Role.findOne({_id: roleID });

      if (!projectData)
        throw new ApolloError(
          "This project dont exist you need to choose antoher project"
        );

      // if (!roleData) {
      //   throw new ApolloError("the role don't exist you need to choose another role")
      // }

      let foundMember_flag = false;
      projectData.team.forEach((member) => {
        if (member.memberID == memberID) {
          member.phase = phase;
          member.roleID = roleID;
          console.log("tuba = ");
          foundMember_flag = true;
        }
      });

      console.log("foundMember_flag = ", foundMember_flag);

      if (foundMember_flag == false) {
        console.log("foundMember_flag = ");
        projectData.team.push({
          memberID: memberID,
          phase: phase,
          roleID: roleID,
        });
      }

      let memberData = await Members.findOne({ _id: memberID });

      if (memberData) {
        let currentProjects = [...memberData.projects];

        const projectExist = currentProjects.includes(
          (project) => project.projectID == projectData._id
        );

        if (projectExist) {
          //update the phase
          currentProjects = currentProjects.map((project) => {
            if (project.projectID == projectData._id) {
              return { ...project, phase: phase, roleID: roleID };
            }
            return project;
          });
        } else {
          //push a new project
          currentProjects.push({
            projectID: projectData._id,
            champion: false,
            phase: phase,
            roleID: roleID,
          });
        }

        console.log("currentProjects = ", currentProjects);

        memberDataUpdate = await Members.findOneAndUpdate(
          { _id: memberID },
          {
            $set: { projects: currentProjects },
          },
          { new: true }
        );
      }

      projectDataUpdate = await Projects.findOneAndUpdate(
        { _id: projectID },
        {
          $set: { team: projectData.team },
        },
        { new: true }
      );

      return projectDataUpdate;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  createNewTeam: async (parent, args, context, info) => {
    const {
      _id,
      name,
      description,
      memberID,
      projectID,
      serverID,
      championID,
      categoryDiscordlD,
      channelGeneralDiscordID,
      forumDiscordID,
    } = JSON.parse(JSON.stringify(args.fields));
    console.log("Mutation > createNewTeam > args.fields = ", args.fields);

    // _id is only if you want to update a team
    // if (!name) throw new ApolloError( "you need to specify a name");
    // if (!projectID) throw new ApolloError( "you need to specify a project ID");

    let fields = {
      // projectID,
      // name,
      registeredAt: new Date(),
    };

    if (_id) fields = { ...fields, _id };
    if (description) fields = { ...fields, description };
    if (memberID) fields = { ...fields, memberID };
    if (serverID) fields = { ...fields, serverID };
    if (championID) fields = { ...fields, championID };
    if (projectID) fields = { ...fields, projectID };
    if (name) fields = { ...fields, name };
    if (categoryDiscordlD) fields = { ...fields, categoryDiscordlD };
    if (forumDiscordID) fields = { ...fields, forumDiscordID };
    if (channelGeneralDiscordID)
      fields = { ...fields, channelGeneralDiscordID };

    console.log("change = 1");

    try {
      let teamData;
      if (_id) {
        console.log("change = 2");

        teamData = await Team.findOne({ _id: fields._id });

        if (teamData) {
          console.log("change = 3");

          teamData = await Team.findOneAndUpdate({ _id: fields._id }, fields, {
            new: true,
          });
        } else {
          throw new ApolloError("_id not found, this Team don't exist");
        }
      } else {
        teamData = await new Team(fields).save();
      }

      // ------------ 🌱 Update 🌱 Teams -----------------
      if (projectID) {
        projectData = await Projects.findOne({ _id: projectID });

        console.log("projectData = ", projectData);
        console.log("projectData.garden_teams = ", projectData.garden_teams);

        if (projectData.garden_teams) {
          if (!projectData.garden_teams.includes(teamData._id)) {
            projectData.garden_teams.push(teamData._id);
            projectUpdate = await Projects.findOneAndUpdate(
              { _id: projectID },
              {
                $set: { garden_teams: projectData.garden_teams },
              },
              { new: true }
            );
          }
        } else {
          projectData.garden_teams = [teamData._id];
          projectUpdate = await Projects.findOneAndUpdate(
            { _id: projectID },
            {
              $set: { garden_teams: projectData.garden_teams },
            },
            { new: true }
          );
        }
      }
      // ------------ 🌱 Update 🌱 Teams -----------------

      return teamData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  createNewRole: async (parent, args, context, info) => {
    const { _id, name, description, memberID, projectID, serverID, teamID } =
      JSON.parse(JSON.stringify(args.fields));
    console.log("Mutation > createNewRole > args.fields = ", args.fields);

    // _id is only if you want to update a team
    // if (!name) throw new ApolloError( "you need to specify a name");

    let fields = {
      registeredAt: new Date(),
    };

    if (_id) fields = { ...fields, _id };
    if (description) fields = { ...fields, description };
    if (memberID) fields = { ...fields, memberID };
    if (serverID) fields = { ...fields, serverID };
    if (teamID) fields = { ...fields, teamID };
    if (projectID) fields = { ...fields, projectID };
    if (name) fields = { ...fields, name };

    console.log("change = 1");

    let roleData;
    try {
      if (fields._id) {
        console.log("change = 2");

        roleData = await Role.findOne({ _id: fields._id });

        if (roleData) {
          console.log("change = 3");

          roleData = await Role.findOneAndUpdate({ _id: fields._id }, fields, {
            new: true,
          });
        }
      } else {
        roleData = await new Role(fields).save();
      }

      // ------------ 🌱 Update 🌱 Teams -----------------
      teams = await Team.find({ _id: teamID });

      for (let i = 0; i < teams.length; i++) {
        let team = teams[i];

        if (!team.roles.includes(roleData._id)) {
          let roles = [...team.roles];
          roles.push(roleData._id);
          team.roles = roles;
          await Team.findOneAndUpdate(
            { _id: team._id },
            {
              $set: { roles: team.roles },
            },
            { new: true }
          );
        }
      }

      // ------------ 🌱 Update 🌱 Teams -----------------

      return roleData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },

  createNewEpic: async (parent, args, context, info) => {
    const {
      _id,
      name,
      description,
      phase,
      championID,
      serverID,
      projectID,
      teamID,
      memberID,
      notifyUserID,
      authorID,
      channelDiscordlID,
    } = JSON.parse(JSON.stringify(args.fields));
    console.log("Mutation > createNewEpic > args.fields = ", args.fields);

    // _id is only if you want to update a team
    // if (!name) throw new ApolloError( "you need to specify a name");

    let fields = {
      registeredAt: new Date(),
    };

    if (_id) fields = { ...fields, _id };
    if (name) fields = { ...fields, name };
    if (description) fields = { ...fields, description };
    if (phase) fields = { ...fields, phase };
    if (championID) fields = { ...fields, championID };
    if (memberID) fields = { ...fields, memberID };
    if (serverID) fields = { ...fields, serverID };
    if (teamID) fields = { ...fields, teamID };
    if (projectID) fields = { ...fields, projectID };
    if (name) fields = { ...fields, name };
    if (notifyUserID) fields = { ...fields, notifyUserID };
    if (channelDiscordlID) fields = { ...fields, channelDiscordlID };
    if (authorID) fields = { ...fields, authorID };

    console.log("change = 1");

    let epicData;
    try {
      if (fields._id) {
        console.log("change = 2");

        epicData = await Epic.findOne({ _id: fields._id });

        if (epicData) {
          console.log("change = 3");

          epicData = await Epic.findOneAndUpdate({ _id: fields._id }, fields, {
            new: true,
          });
        }
      } else {
        epicData = await new Epic(fields).save();
      }

      // ------------ 🌱 Update 🌱 Epic -----------------
      teams = await Team.find({ _id: teamID });

      for (let i = 0; i < teams.length; i++) {
        let team = teams[i];

        if (!team.epics.includes(epicData._id)) {
          let epics = [...team.epics];
          epics.push(epicData._id);
          team.epics = epics;
          await Team.findOneAndUpdate(
            { _id: team._id },
            {
              $set: { epics: team.epics },
            },
            { new: true }
          );
        }
      }
      // ------------ 🌱 Update 🌱 Epic -----------------

      // ------------ Member Epic Save info -----------------
      if (epicData.memberID) {
        for (let i = 0; i < epicData.memberID.length; i++) {
          let member = await Members.findOne({ _id: epicData.memberID[i] });
          if (member) {
            if (
              !member.gardenUpdate ||
              !member.gardenUpdate.epicID ||
              (!member.gardenUpdate.epicID.includes(epicData._id) &&
                epicData.phase == "open")
            ) {
              let epicID;
              if (!member.gardenUpdate || !member.gardenUpdate.epicID) {
                epicID = [];
              } else {
                epicID = [...member.gardenUpdate.epicID];
              }
              epicID.push(epicData._id);
              member.gardenUpdate.epicID = epicID;
              await Members.findOneAndUpdate(
                { _id: member._id },
                {
                  $set: { gardenUpdate: member.gardenUpdate },
                },
                { new: true }
              );
            }
            if (
              member.gardenUpdate.epicID.includes(epicData._id) &&
              epicData.phase == "archive"
            ) {
              let epicID = [...member.gardenUpdate.epicID];
              // console.log("change = tid" ,epicID)
              epicID = epicID.filter(
                (item) => item.equals(epicData._id) == false
              );
              member.gardenUpdate.epicID = epicID;
              await Members.findOneAndUpdate(
                { _id: member._id },
                {
                  $set: { gardenUpdate: member.gardenUpdate },
                },
                { new: true }
              );
              // console.log("change = tad 2" ,member.gardenUpdate.epicID)
            }
          }
        }
      }
      // ------------ Member Epic Save info -----------------

      // ------------ Champion Task Save info -----------------
      if (epicData.championID) {
        let member = await Members.findOne({ _id: epicData.championID });
        console.log("champion = ", member);
        if (member) {
          console.log("champion = 2");
          if (
            !member.gardenUpdate ||
            !member.gardenUpdate.epicID ||
            (!member.gardenUpdate.epicID.includes(epicData._id) &&
              epicData.phase == "open")
          ) {
            let epicID;
            if (!member.gardenUpdate || !member.gardenUpdate.epicID) {
              epicID = [];
            } else {
              epicID = [...member.gardenUpdate.epicID];
            }
            epicID.push(epicData._id);
            member.gardenUpdate.epicID = epicID;
            console.log(
              "member.gardenUpdate.epicID = ",
              member.gardenUpdate.epicID
            );
            await Members.findOneAndUpdate(
              { _id: member._id },
              {
                $set: { gardenUpdate: member.gardenUpdate },
              },
              { new: true }
            );
          }
          if (
            member.gardenUpdate.epicID.includes(epicData._id) &&
            epicData.phase == "archive"
          ) {
            let epicID = [...member.gardenUpdate.epicID];
            epicID = epicID.filter(
              (item) => item.equals(epicData._id) == false
            );
            member.gardenUpdate.epicID = epicID;
            await Members.findOneAndUpdate(
              { _id: member._id },
              {
                $set: { gardenUpdate: member.gardenUpdate },
              },
              { new: true }
            );
          }
        }
      }
      // ------------ Champion Task Save info -----------------

      console.log("epicData.championID = ", epicData.championID);

      return epicData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
  deleteProject: async (parent, args, context, info) => {
    const { projectID } = args.fields;

    console.log("Mutation > deleteProject > args.fields = ", args.fields);

    if (!projectID) throw new ApolloError("projectID is required");

    try {
      let projectData = await Projects.findOne({ _id: projectID });

      if (!projectData) throw new ApolloError("project data not found");

      //get the role
      const role = projectData.role;

      if (role && role.length && role.length > 0) {
        for (let i = 0; i < role.length; i++) {
          const currentRole = role[i];
          console.log("currentRole = ", currentRole);
          if (currentRole && currentRole.Node && currentRole.Node.length > 0) {
            // get all nodes from currentRole.nodes
            let nodesData = await Node.find({
              _id: currentRole.nodes
                .map(function (item) {
                  return item._id.toString();
                })
                .select("_id name node"),
            });

            if (nodesData && nodesData.length && nodesData.length > 0) {
              for (let j = 0; j < nodesData.length; j++) {
                let nodeNow = nodesData[j];
                if (nodeNow) {
                  deleteConnectionANYBetweenNodes_neo4j({
                    nodeID_1: currentRole._id,
                    nodeID_2: nodeNow._id,
                  });
                }

                //changeMatchByServer(nodeNow, memberData);
              }
            }

            deleteNode_neo4j({
              nodeID: currentRole._id,
            });
          }
        }
      }

      //delete the project Node from NEO4j
      deleteNode_neo4j({
        nodeID: projectData._id,
      });

      // delete project data ata from mongoDB database
      const projectData2 = await Projects.findOneAndDelete({ _id: projectID });

      return projectData2;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember" }
      );
    }
  },
};

// create async function that will change matchByServer
const changeMatchByServer = async (nodeNow, projectRoleData) => {
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
            member: node_n.match_v2_update.member,
            projectRole: true,
          },
        },
      },
      { new: true }
    );
  }
};
