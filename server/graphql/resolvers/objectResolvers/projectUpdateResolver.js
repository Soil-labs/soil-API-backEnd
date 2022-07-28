// const { User } = require('../../../models/user');
const { Members } = require('../../../models/membersModel');
const { Skills } = require('../../../models/skillsModel');
const { Projects } = require('../../../models/projectsModel');
const { Team } = require("../../../models/teamModal");

const { ApolloError } = require('apollo-server-express');

module.exports = {
   ProjectUpdate: {
      author: async (parent, args, context, info) => {
      //  console.log("parent = " , parent)

         try {
            const authorID = parent.authorID;


            authorData = await Members.findOne({_id: authorID})



            return authorData;

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
         // console.log("parent = " , parent)
  
           try {
              const memberID = parent.memberID;
  
  
              authorData = await Members.find({_id: memberID})
  
  
  
              return authorData;
  
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
      projects: async (parent, args, context, info) => {
         // console.log("parent = " , parent)
  
           try {
              const projectID = parent.projectID;
  
  
              proejctData = await Projects.findOne({_id: projectID})
  
  
  
              return proejctData;
  
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
         console.log("parent = 22" , parent)
  
           try {
              const teamID = parent.teamID;
  
  
              teamData = await Team.find({_id: teamID})
  
              console.log("teamData = " , teamData)
  
  
              return teamData;
  
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
