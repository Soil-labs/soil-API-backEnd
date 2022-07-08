// const { User } = require('../../../models/user');
const { Members } = require('../../../models/membersModel');
const { Skills } = require('../../../models/skillsModel');
const { Projects } = require('../../../models/projectsModel');

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
         // console.log("parent 2321= " , parent)
         console.log("parent 2321= " , parent.projects)

         const projectsInfo = parent.projects;

         try {


            if (!projectsInfo || projectsInfo.length === 0) {
               return [];
            }

            // console.log("projectsInfo = " , projectsInfo)

            let position = {}

            let projectID_all = projectsInfo.map((project,idx)=>{

               position[project.projectID] = idx
               return (project.projectID)
            
            })

            projectData = await Projects.find({_id: projectID_all})

            // console.log("position = " , position)

            // projectsInfo = projectsInfo.map(project=>{return ({
            //    project: project.projectID
            // })})
         
            let projectData_disp = []
            for (let i = 0; i < projectData.length; i++) {

               let project = projectData[i]

               let displayData = {
                  project: project._doc,
                  roleID: projectsInfo[position[project._id]].roleID,
                  champion: projectsInfo[position[project._id]].champion,
               }

               let roleUser

               displayData.project.role.filter(roleN=>{
                  if (roleN.id == displayData.roleID) {
                     roleUser = roleN
                  }
               })

               console.log("displayData.project = " , displayData.project.role)
               console.log("roleUser = " , roleUser)

               if (roleUser) displayData = {...displayData, role: roleUser}
               
               projectData_disp.push(displayData) 
            }


            // console.log("projectData_disp = " , projectData_disp)

            return projectData_disp;

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
