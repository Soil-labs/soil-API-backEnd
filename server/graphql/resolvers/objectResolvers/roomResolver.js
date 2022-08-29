
const { Members } = require('../../../models/membersModel');
const { SkillSubCategory} = require("../../../models/skillSubCategoryModel");
const { SkillCategory} = require("../../../models/skillCategoryModel");
const {Skills} = require("../../../models/skillsModel");

const { ApolloError } = require('apollo-server-express');

module.exports = {
   Rooms: {
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
   },
};
