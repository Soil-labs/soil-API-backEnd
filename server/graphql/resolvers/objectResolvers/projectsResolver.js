// const { User } = require('../../../models/user');
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Skills } = require("../../../models/skillsModel");
const { Projects } = require("../../../models/projectsModel");
const { Team } = require("../../../models/teamModal");
const { Role } = require("../../../models/roleModel");
const { Epic } = require("../../../models/epicModel");
const { ProjectUpdate } = require("../../../models/projectUpdateModal");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  Project: {
    champion: async (parent, args, context, info) => {
      //console.log("parent = " , parent)

      try {
        const champion = parent.champion;

        championData = await Members.findOne({ _id: champion });

        //console.log("championData = " , championData)

        return championData;
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
    team: async (parent, args, context, info) => {
      //console.log("parent = " , parent)

      try {
        const team = parent.team;

        return team;
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
    garden_teams: async (parent, args, context, info) => {
      try {
        const garden_teams = parent.garden_teams;

        garden_teamsData = await Team.find({ _id: garden_teams });

        return garden_teamsData;
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
  teamType: {
    memberInfo: async (parent, args, context, info) => {
      //  console.log("parent = 232" , parent)

      try {
        const memberID = parent.memberID;

        memberData = await Members.findOne({ _id: memberID });

        return memberData;
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
  roleType: {
    skills: async (parent, args, context, info) => {
      //console.log("parent = " , parent)

      try {
        const skills = parent.skills;

        //   memberData = await Members.findOne({_id: members})

        //console.log("skills - roleResolver = " , skills)

        return skills;
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
    nodes: async (parent, args, context, info) => {
      try {
        const nodes = parent.nodes;

        nodesID = [];
        if (nodes && nodes.length > 0) {
          nodes.forEach((node) => {
            nodesID.push(node._id);
          });

          const nodesData = await Node.find({ _id: nodesID }).select(
            "_id name"
          );

          let res = [];
          nodesData.forEach((node) => {
            res.push({
              nodeData: node,
            });
          });
          return res;
        } else {
          return [];
        }
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
  },
  skillRoleType: {
    skillData: async (parent, args, context, info) => {
      //console.log("parent = " , parent)

      try {
        const _id = parent._id;

        //   memberData = await Members.findOne({_id: members})

        //console.log("_id - roleResolver = " , _id)

        skillData = await Skills.findOne({
          $and: [{ _id: _id }, { state: "approved" }],
        });

        return skillData;
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
  tweetsProject: {
    tweets: async (parent, args, context, info) => {
      ////console.log("parent - tweets = " , parent.tweets)

      try {
        //         const author = parent.author;

        ////console.log("author = " , author)

        //   memberData = await Members.findOne({_id: author})

        return parent.tweets;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > tweetsProject > tweets ",
            user: context.req.user?._id,
          }
        );
      }
    },
  },

  tweetsType: {
    author: async (parent, args, context, info) => {
      //console.log("parent -  tweetsType - author= " , parent)

      try {
        const author = parent.author;

        ////console.log("author = " , author)

        memberData = await Members.findOne({ _id: author });

        return memberData;
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
  projectUserMatchType: {
    skillsMatch: async (parent, args, context, info) => {
      try {
        const skills = parent.skillsMatch;

        let skillsData = await Skills.find({ _id: skills });

        return skillsData;
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
    skillsDontMatch: async (parent, args, context, info) => {
      try {
        const skills = parent.skillsDontMatch;

        let skillsData = await Skills.find({ _id: skills });

        return skillsData;
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
  Team: {
    projects: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const projectID = parent.projectID;

        projectData = await Projects.findOne({ _id: projectID });

        return projectData;
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
    members: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const memberID = parent.memberID;

        memberData = await Members.find({ _id: memberID });

        return memberData;
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
    champion: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const championID = parent.championID;

        memberData = await Members.find({ _id: championID });

        return memberData;
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
    roles: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const roles = parent.roles;

        rolesData = await Role.find({ _id: roles });

        return rolesData;
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
    epics: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const epics = parent.epics;

        epicsData = await Epic.find({ _id: epics });

        return epicsData;
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
  Role: {
    project: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const projectID = parent.projectID;

        projectData = await Projects.findOne({ _id: projectID });

        return projectData;
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
    members: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const memberID = parent.memberID;

        memberData = await Members.find({ _id: memberID });

        return memberData;
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
    teams: async (parent, args, context, info) => {
      // console.log("parent = you dont shitn -  " ,parent)
      try {
        const teamID = parent.teamID;

        memberData = await Team.find({ _id: teamID });

        return memberData;
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
  Epic: {
    project: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const projectID = parent.projectID;

        projectData = await Projects.findOne({ _id: projectID });

        return projectData;
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
    task: async (parent, args, context, info) => {
      console.log("parent = ", parent);
      try {
        const taskID = parent.taskID;

        console.log("taskID = ", taskID);

        taskData = await ProjectUpdate.find({ _id: taskID });

        return taskData;
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
    members: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const memberID = parent.memberID;

        memberData = await Members.find({ _id: memberID });

        return memberData;
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
    champion: async (parent, args, context, info) => {
      // console.log("parent = " ,parent)
      try {
        const championID = parent.championID;

        memberData = await Members.findOne({ _id: championID });

        return memberData;
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
    author: async (parent, args, context, info) => {
      console.log("parent = ", parent);
      try {
        const authorID = parent.authorID;

        authorData = await Members.findOne({ _id: authorID });

        return authorData;
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
    teams: async (parent, args, context, info) => {
      // console.log("parent = you dont shitn -  " ,parent)
      try {
        const teamID = parent.teamID;

        memberData = await Team.find({ _id: teamID });

        return memberData;
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
    notifyUsers: async (parent, args, context, info) => {
      // console.log("parent = you dont shitn -  " ,parent)
      try {
        const notifyUserID = parent.notifyUserID;

        memberData = await Members.find({ _id: notifyUserID });

        return memberData;
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
