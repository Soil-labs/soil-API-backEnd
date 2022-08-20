// const { User } = require('../../../models/user');
const { Members } = require('../../../models/membersModel');
const { Skills } = require('../../../models/skillsModel');
const { Projects } = require('../../../models/projectsModel');
const {Team} = require('../../../models/teamModal');

const { ApolloError } = require('apollo-server-express');

module.exports = {
   Project: {
      champion: async (parent, args, context, info) => {
       //console.log("parent = " , parent)

         try {
            const champion = parent.champion;


            championData = await Members.findOne({_id: champion})

        //console.log("championData = " , championData)


            return championData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > members',
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
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > members',
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
  
              memberData = await Members.findOne({_id: memberID})
  
  
              return memberData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
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
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
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
               $and: [
                 { _id: _id },
                 { state: "approved" },
               ]})
  
              return skillData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
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
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > tweetsProject > tweets ',
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

              
  
              memberData = await Members.findOne({_id: author})
  
  
              return memberData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
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

               let skillsData = await Skills.find({ _id: skills })
   
   
               return skillsData;

           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
                    user: context.req.user?._id,
                 }
              );
           }
        },
        skillsDontMatch: async (parent, args, context, info) => {

         try {
             const skills = parent.skillsDontMatch;

             let skillsData = await Skills.find({ _id: skills })
 
 
             return skillsData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > members',
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
  
              projectData = await Projects.findOne({_id: projectID})
  
  
              return projectData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
                    user: context.req.user?._id,
                 }
              );
           }
        },
        members: async (parent, args, context, info) => {
  
         // console.log("parent = " ,parent)
           try {
              const memberID = parent.memberID;
  
              memberData = await Members.find({_id: memberID})
  
  
              return memberData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
                    user: context.req.user?._id,
                 }
              );
           }
        },
        champion: async (parent, args, context, info) => {
  
         console.log("parent = " ,parent)
           try {
              const championID = parent.championID;
  
              memberData = await Members.find({_id: championID})
  
  
              return memberData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
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
  
              projectData = await Projects.findOne({_id: projectID})
  
  
              return projectData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
                    user: context.req.user?._id,
                 }
              );
           }
        },
        members: async (parent, args, context, info) => {
  
         // console.log("parent = " ,parent)
           try {
              const memberID = parent.memberID;
  
              memberData = await Members.find({_id: memberID})
  
  
              return memberData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
                    user: context.req.user?._id,
                 }
              );
           }
        },
        teams: async (parent, args, context, info) => {
  
         console.log("parent = you dont shitn -  " ,parent)
           try {
              const teamID = parent.teamID;
  
              memberData = await Team.find({_id: teamID})
  
  
              return memberData;
  
           } catch (err) {
              throw new ApolloError(
                 err.message,
                 err.extensions?.code || 'DATABASE_SEARCH_ERROR',
                 {
                    component: 'userResolver > members',
                    user: context.req.user?._id,
                 }
              );
           }
        },
        
   },
};
