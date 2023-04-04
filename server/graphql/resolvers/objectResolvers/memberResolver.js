// const { User } = require('../../../models/user');
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Endorsement } = require("../../../models/endorsementModel");
const { Review } = require("../../../models/reviewModel");
const { Skills } = require("../../../models/skillsModel");
const { Projects } = require("../../../models/projectsModel");
const { ProjectUpdate } = require("../../../models/projectUpdateModal");
const { Epic } = require("../../../models/epicModel");
const { Role } = require("../../../models/roleModel");
const { ApolloError } = require("apollo-server-express");
const { RoleTemplate } = require("../../../models/roleTemplateModal");

module.exports = {
  skillType_member: {
    skillInfo: async (parent, args, context, info) => {
      try {
        const skillID = parent.id;

        // console.log("skillID = " , skillID)

        const skillData = await Skills.findOne({ _id: skillID });
        // console.log("parent = " , parent.id,skillData)

        // console.log("skillData = " , skillData)

        return skillData;

        // skillsID = skills.map(skill=>{return (skill.id)})
      } catch (error) {
        throw new ApolloError(error);
      }
    },
  },
  endorseSummaryType: {
    endorsers: async (parent, args, context, info) => {
      try {

        // console.log("change =  I hate everything " ,parent.endorsers)
        const endorsersID = parent.endorsers;

        const membersData = await Members.find({ _id: endorsersID });

        return membersData;
      } catch (error) {
        throw new ApolloError(error);
      }
    },
  },
  Members: {
    endorsementsReceive: async (parent, args, context, info) => {
      try {
        const endorsementsReceiveID = parent.endorsementsReceive;

        const endorsementData = await Endorsement.find({_id: endorsementsReceiveID,});

        return endorsementData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "bluepanda.xyz@gmail.com",
          {
            component: "userResolver > bluepanda.xyz@gmail.com",
            user: context.req.user?._id,
          }
        );
      }
    },
    endorsementsSend: async (parent, args, context, info) => {
      try {
        const endorsementsReceiveID = parent.endorsementsReceive;

        const endorsementData = await Endorsement.find({_id: endorsementsReceiveID,});

        return endorsementData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "bluepanda.xyz@gmail.com",
          {
            component: "userResolver > bluepanda.xyz@gmail.com",
            user: context.req.user?._id,
          }
        );
      }
    },
    reviewsReceive: async (parent, args, context, info) => {
      try {
        const reviewsReceiveID = parent.reviewsReceive;

        const endorsementData = await Review.find({_id: reviewsReceiveID,});

        return endorsementData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "bluepanda.xyz@gmail.com",
          {
            component: "userResolver > bluepanda.xyz@gmail.com",
            user: context.req.user?._id,
          }
        );
      }
    },
    reviewsSend: async (parent, args, context, info) => {
      try {
        const reviewsReceiveID = parent.reviewsReceive;

        const endorsementData = await Review.find({_id: reviewsReceiveID,});

        return endorsementData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "reviewsSend",
          {
            component: "userResolver > reviewsSend",
            user: context.req.user?._id,
          }
        );
      }
    },
    budget: async (parent, args, context, info) => {
      try {
        const budget = parent.budget;


        return budget;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "budget",
          {
            component: "userResolver > budget",
            user: context.req.user?._id,
          }
        );
      }
    },
    skills: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const skills = parent.skills;

        // console.log("parent._id = " , parent._id)

        // console.log("skills = " , skills)

        // skillsID = skills.map(skill=>{return (skill.id)})

        // skillData = await Skills.find({
        //    $and: [
        //      { _id: skillsID },
        //      { state: "approved" },
        //    ]})

        // skillDaa_withAuthors = skillData.map((skillD,idx)=>{
        //    return ({
        //       skillInfo: skillD._doc,
        //       authors: skills[idx].authors,
        //       level: skills[idx].level,
        //    })
        // })

        skillDaa_withAuthors = skills.map((skillD, idx) => {
          return {
            skillInfo: skillD.id,
            authors: skillD.authors,
            level: skillD.level,
          };
        });

        // console.log("skillDaa_withAuthors = " , skillDaa_withAuthors)

        // return skillData_withAuthors;
        return skills;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
    nodes: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const nodes = parent.nodes;

        let nodesObj = {};
        nodes.forEach((node) => {
          nodesObj[node._id] = node;
        });

        nodesID = [];
        nodes.forEach((node) => {
          nodesID.push(node._id);
        });

        const nodesData = await Node.find({ _id: nodesID }).select(
          "_id name node aboveNodes subNodes"
        );

        let res = [];
        nodesData.forEach((node) => {
          res.push({
            nodeData: node,
            orderIndex: nodesObj[node._id].orderIndex,
            level: nodesObj[node._id].level,
            weight: nodesObj[node._id].weight,
            aboveNodes: nodesObj[node._id].aboveNodes,
            trust: nodesObj[node._id].trust,
          });
        });

        return res;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > nodes",
            user: context.req.user?._id,
          }
        );
      }
    },
    memberRole: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const memberRoleID = parent.memberRole;

        console.log("memberRoleID -- 222= ", memberRoleID);

        const memberRoleData = await RoleTemplate.findOne({
          _id: memberRoleID,
        });
        // const memberRoleData = await RoleTemplate.find({})

        console.log("memberObject Resolver > Member Role", memberRoleData);
        return memberRoleData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > memberRole",
            user: context.req.user?._id,
          }
        );
      }
    },
    projects: async (parent, args, context, info) => {
      // console.log("parent 2321= " , parent)
      // console.log("parent 2321= " , parent.projects)

      const projectsInfo = parent.projects;

      try {
        if (!projectsInfo || projectsInfo.length === 0) {
          return [];
        }

        // console.log("projectsInfo = " , projectsInfo)

        let position = {};

        let projectID_all = projectsInfo.map((info, idx) => {
          position[info.projectID] = idx;
          return info.projectID;
        });

        projectData = await Projects.find({ _id: projectID_all });

        //console.log("position = " , position)
        //console.log("projectID_all = " , projectID_all)
        //console.log("projectData = " , projectData)

        // projectsInfo = projectsInfo.map(info=>{return ({
        //    info: info.projectID
        // })})

        let projectData_disp = [];
        for (let i = 0; i < projectData.length; i++) {
          let info = projectData[i];

          let displayData = {
            info: info._doc,
            roleID: projectsInfo[position[info._id]].roleID,
            champion: projectsInfo[position[info._id]].champion,
            favorite: projectsInfo[position[info._id]].favorite,
            phase: projectsInfo[position[info._id]].phase,
          };

          let roleUser;

          displayData.info.role.filter((roleN) => {
            if (roleN.id == displayData.roleID) {
              roleUser = roleN;
            }
          });

          if (roleUser) displayData = { ...displayData, role: roleUser };

          projectData_disp.push(displayData);
        }

        //console.log("projectData_disp = " , projectData_disp)

        return projectData_disp;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
    network: async (parent, args, context, info) => {
      try {
        const network = parent.network;

        if (!network || network.length === 0) return [{}];

        networkIDs = network.map((net) => {
          return net.memberID;
        });

        networkData = await Members.find({ _id: networkIDs });

        return networkData;
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
    invitedBy: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const invitedBy = parent.invitedBy;

        invitedByData = await Members.findOne({ _id: invitedBy });

        return invitedByData;
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
    gardenUpdate: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const gardenUpdate = parent.gardenUpdate;

        epicData = await Epic.find({ _id: gardenUpdate.epicID });

        taskData = await ProjectUpdate.find({ _id: gardenUpdate.taskID });

        return {
          epic: epicData,
          task: taskData,
        };
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

  matchMembersToUserOutput: {
    commonSkills: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const skillsID = parent.commonSkills;

        skillData = await Skills.find({
          $and: [{ _id: skillsID }, { state: "approved" }],
        });

        return skillData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  matchMembersToProjectOutput: {
    member: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const member = parent.member;

        memberData = await Members.findOne({ _id: member });

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  nodesType: {
    aboveNodes: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const aboveNodes = parent.aboveNodes;

        nodesData = await Node.find({ _id: aboveNodes });

        return nodesData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
    trust: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const trust = parent.trust;

        // nodesData = await Node.find({ _id: aboveNodes });

        return trust;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "trust",
          {
            component: "userResolver > trust",
            user: context.req.user?._id,
          }
        );
      }
    },

  },
  matchMembersToProjectRoleOutput: {
    member: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const member = parent.member;

        memberData = await Members.findOne({ _id: member });

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  matchPrepareSkillToMembersOutput: {
    member: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const member = parent.member;

        memberData = await Members.findOne({ _id: member });

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  matchMembersToSkillOutput: {
    skillsPercentage: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent.skillsPercentage)

      try {
        return parent.skillsPercentage;
        // return [{}]
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
    member: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const memberID = parent.memberID;

        memberData = await Members.findOne({ _id: memberID });

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
    nodesPercentage: async (parent, args, context, info) => {
      console.log("parent 22322 TT= ", parent.nodesPercentage);
      // console.log("parent 22322= ", parent.nodesPercentage);

      try {
        const nodesPercentage = parent.nodesPercentage;

        // nodeData = await Node.findOne({ _id: nodeID });

        return nodesPercentage;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
    // mostRelevantMemberNodes: async (parent, args, context, info) => {
    //   console.log("parent 22322= ", parent.mostRelevantMemberNodes);
  
    //   try {
    //     const mostRelevantMemberNodes = parent.mostRelevantMemberNodes;
  
    //     // nodeData = await Node.findOne({ _id: nodeID });
  
    //     return mostRelevantMemberNodes;
    //   } catch (err) {
    //     throw new ApolloError(
    //       err.message,
    //       err.extensions?.code || "DATABASE_SEARCH_ERROR",
    //       {
    //         component: "userResolver > skills",
    //         user: context.req.user?._id,
    //       }
    //     );
    //   }
    // },
  },
  mostRelevantMemberNodeType: {
    node: async (parent, args, context, info) => {
      console.log("parent 22322 kk = ", parent);

      try {
        const nodeID = parent.nodeID;

        // nodeData = await Node.findOne({ _id: nodeID });
        nodeData = await Node.findOne({ _id: nodeID }).select("_id name node");

        return nodeData._doc
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "mostRelevantMemberNodeType",
          {
            component: "userResolver > mostRelevantMemberNodeType",
            user: context.req.user?._id,
          }
        );
      }
    },
    score: async (parent, args, context, info) => {
      console.log("parent 22322 kk = ", parent);

      try {
        return parent.totalPercentage
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "mostRelevantMemberNodeType",
          {
            component: "userResolver > mostRelevantMemberNodeType",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  nodesPercentageType: {
    node: async (parent, args, context, info) => {
      // console.log("parent 22322= ", parent);

      try {
        const nodeID = parent.nodeID;

        // nodeData = await Node.findOne({ _id: nodeID });
        nodeData = await Node.findOne({ _id: nodeID }).select("_id name node");

        return nodeData;
        return {};
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  SkillsPercentage: {
    info: async (parent, args, context, info) => {
      // console.log("parent 22322=  " , parent)
      // console.log("parent 22322=  " , parent.info)

      try {
        const skillsID = parent.info;

        skillData = await Skills.findOne({ _id: skillsID });

        return skillData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  matchSkillsToProjectsOutput: {
    commonSkills: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        // const skillsID = parent.commonSkills;

        // skillData = await Skills.find({
        //    $and: [
        //      { _id: skillsID },
        //      { state: "approved" },
        //    ]})

        // const memberID = parent.memberID;

        // memberData = await Members.findOne({_id: memberID})

        // console.log("memberData.skills.id  = " , memberData.skills.id )

        // skillData = await Skills.find({
        //    $and: [
        //      { _id: memberData.skills.id },
        //      { state: "approved" },
        //    ]})

        // return skillData;
        return [{}];
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
    // project: async (parent, args, context, info) => {
    //   // console.log("parent 22322= " , parent)

    //   try {
    //     const project = parent.project;

    //     // console.log("projectRoleID = ", projectRoleID);
    //     // // projectData = await Projects.findOne({ _id: projectID });
    //     // let projectData = await Projects.find({ "role._id": projectRoleID });

    //     // console.log("projectData = ", projectData);

    //     return project;
    //   } catch (err) {
    //     throw new ApolloError(
    //       err.message,
    //       err.extensions?.code || "DATABASE_SEARCH_ERROR",
    //       {
    //         component: "userResolver > skills",
    //         user: context.req.user?._id,
    //       }
    //     );
    //   }
    // },
    projectRoles: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const projectRoles = parent.projectRoles;

        // console.log("projectRoles = " , projectRoles)
        // memberData = await Projects.findOne({"role._id":: projectRoles.})

        return projectRoles;
        // return [{}]
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
  matchProjectRoles: {
    projectRole: async (parent, args, context, info) => {
      // console.log("parent 22322= " , parent)

      try {
        const projectRoleID = parent.projectRoleID;

        // console.log("projectRoleID = " , projectRoleID)
        projectData = await Projects.findOne({ "role._id": projectRoleID });

        projectDataRole = projectData.role.filter(
          (role) => role._id == projectRoleID
        );

        projectDataRole = projectDataRole[0];

        // console.log("projectDataRole = " , projectDataRole)

        return projectDataRole;
        // return [{}]
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > skills",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
};
