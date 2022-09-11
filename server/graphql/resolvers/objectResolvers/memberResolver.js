// const { User } = require('../../../models/user');
const { Members } = require('../../../models/membersModel');
const { Skills } = require('../../../models/skillsModel');
const { Projects } = require('../../../models/projectsModel');
const {ProjectUpdate } = require("../../../models/projectUpdateModal");
const { Epic } = require("../../../models/epicModel");
const {Role} = require("../../../models/roleModel");
const { ApolloError } = require('apollo-server-express');
const {RoleTemplate} = require("../../../models/roleTemplateModal");



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
   Members: {
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

            skillDaa_withAuthors = skills.map((skillD,idx)=>{
               return ({
                  skillInfo: skillD.id,
                  authors: skillD.authors,
                  level: skillD.level,
               })
            })

            console.log("skillDaa_withAuthors = " , skillDaa_withAuthors)




            // return skillData_withAuthors;
            return skills;

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
      memberRole: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            
            const memberRoleID = parent.memberRole

            console.log("memberRoleID -- 222= " , memberRoleID)
            
            const memberRoleData = await RoleTemplate.findOne({_id: memberRoleID})
            // const memberRoleData = await RoleTemplate.find({})
            

            console.log("memberObject Resolver > Member Role", memberRoleData)
            return memberRoleData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'userResolver > memberRole',
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

            let position = {}

            let projectID_all = projectsInfo.map((info,idx)=>{

               position[info.projectID] = idx
               return (info.projectID)
            
            })

            projectData = await Projects.find({_id: projectID_all})

          //console.log("position = " , position)
          //console.log("projectID_all = " , projectID_all)
          //console.log("projectData = " , projectData)

            // projectsInfo = projectsInfo.map(info=>{return ({
            //    info: info.projectID
            // })})
         
            let projectData_disp = []
            for (let i = 0; i < projectData.length; i++) {

               let info = projectData[i]

               let displayData = {
                  info: info._doc,
                  roleID: projectsInfo[position[info._id]].roleID,
                  champion: projectsInfo[position[info._id]].champion,
                  favorite: projectsInfo[position[info._id]].favorite,
                  phase: projectsInfo[position[info._id]].phase,
               }

               let roleUser

               displayData.info.role.filter(roleN=>{
                  if (roleN.id == displayData.roleID) {
                     roleUser = roleN
                  }
               })

               if (roleUser) displayData = {...displayData, role: roleUser}
               
               projectData_disp.push(displayData) 
            }


          //console.log("projectData_disp = " , projectData_disp)

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
      },
      invitedBy: async (parent, args, context, info) => {

         // console.log("parent = " , parent)
            
         try {
            const invitedBy = parent.invitedBy;
   
   
            invitedByData = await Members.findOne({_id: invitedBy})
   
            return invitedByData;
   
   
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
      gardenUpdate: async (parent, args, context, info) => {

         // console.log("parent = " , parent)
            
         try {
            const gardenUpdate = parent.gardenUpdate;
   
   
            epicData = await Epic.find({_id: gardenUpdate.epicID})

            taskData = await ProjectUpdate.find({_id: gardenUpdate.taskID})
   
            return {
               epic:epicData,
               task: taskData,
            };
   
   
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
   
   matchMembersToUserOutput: {
      commonSkills: async (parent, args, context, info) => {
         console.log("parent 22322= " , parent)

         try {
            const skillsID = parent.commonSkills;


            skillData = await Skills.find({
               $and: [
                 { _id: skillsID },
                 { state: "approved" },
               ]})
            



            return skillData;

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
   },
   matchMembersToProjectOutput: {
      member: async (parent, args, context, info) => {
         console.log("parent 22322= " , parent)

         try {
            const member = parent.member;


            memberData = await Members.findOne({_id: member})
            



            return memberData;

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
   },
   matchMembersToSkillOutput: {
      commonSkills: async (parent, args, context, info) => {
         console.log("parent 22322= " , parent)

         try {
            const skillsID = parent.commonSkills;


            skillData = await Skills.find({
               $and: [
                 { _id: skillsID },
                 { state: "approved" },
               ]})
            



            return skillData;

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
   }
   
};
