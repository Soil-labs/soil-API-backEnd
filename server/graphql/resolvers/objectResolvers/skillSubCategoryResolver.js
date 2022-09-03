// const { User } = require('../../../models/user');

const { Skills } = require('../../../models/skillsModel');
const { SkillCategory} = require("../../../models/skillCategoryModel");

const { ApolloError } = require('apollo-server-express');



module.exports = {
   SkillSubCategory: {
      skills: async (parent, args, context, info) => {
       //console.log("parent = " , parent)

         try {
            const skillsID = parent.skills;

            // console.log("skillsID = " , skillsID)



            skillData = await Skills.find({_id: skillsID})
         


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
   },
   
   
};
