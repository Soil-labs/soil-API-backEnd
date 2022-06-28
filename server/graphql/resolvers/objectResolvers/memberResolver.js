// const { User } = require('../../../models/user');
const { Members } = require('../../../models/membersModel');
const { Skills } = require('../../../models/skillsModel');

const { ApolloError } = require('apollo-server-express');



module.exports = {
   Members: {
      skills: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            const skills = parent.skills;


            skillsID = skills.map(skill=>{return (skill.id)})



            skillData = await Skills.find({_id: skillsID})
            

            skillData_withAuthors = skillData.map((skillD,idx)=>{
               return ({
                  ...skillD._doc,
                  authors: skills[idx].authors
               })
            })


            return skillData_withAuthors;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > skills',
                  user: context.req.user?._id,
               }
            );
         }
      },
      projects: async (parent, args, context, info) => {
         console.log("parent 232= " , parent.projects)

         try {
            if (!parent.projects || parent.projects.length === 0) {
               return [];
            }
            const projectsIDs = parent.projects;


            projectData = await Projects.find({_id: projectsIDs})


            return projectData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > skills',
                  user: context.req.user?._id,
               }
            );
         }
      },
      network: async (parent, args, context, info) => {
         
         try {
            const network = parent.network;

            if (!network || network.length === 0) 
               return [{}];


            networkIDs = network.map(net => {
               return net.memberID;
            })

            networkData = await Members.find({_id: networkIDs})

            return networkData;


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
      }
   },
   
};
