
const { Members } = require('../../../models/membersModel');
const { SkillSubCategory} = require("../../../models/skillSubCategoryModel");
const { SkillCategory} = require("../../../models/skillCategoryModel");
const {Skills} = require("../../../models/skillsModel");

const { ApolloError } = require('apollo-server-express');

module.exports = {
   Skills: {
      members: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            const members = parent.members;


            membersData = await Members.find({_id: members})

          //console.log("membersData = " , membersData)


            return membersData;

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
      authors: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            const members = parent.authors;


            membersData = await Members.find({_id: members})

          //console.log("membersData - author  = " , membersData)


            return membersData;

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
      relatedSkills: async (parent, args, context, info) => {
         // console.log("parent = " , parent)

         try {
            const relatedSkills = parent.relatedSkills;


            relatedSkillsData = await Skills.find({_id: relatedSkills})

          //console.log("membersData - author  = " , membersData)


            return relatedSkillsData;

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
      categorySkills: async (parent, args, context, info) => {
         //console.log("parent = " , parent)
  
           try {
              const categorySkills = parent.categorySkills;
  
            //   console.log("parent = " , parent)
  
  
  
              categoryData = await SkillCategory.find({_id: categorySkills})
           
  
  
              return categoryData;
  
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
      subCategorySkill: async (parent, args, context, info) => {
         //console.log("parent = " , parent)
  
           try {
              const subCategorySkill = parent.subCategorySkill;
  
              // console.log("subCategorySkill = " , subCategorySkill)
  
  
  
              SkillSubCategoryData = await SkillSubCategory.find({_id: subCategorySkill})
           
  
  
              return SkillSubCategoryData;
  
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
};
