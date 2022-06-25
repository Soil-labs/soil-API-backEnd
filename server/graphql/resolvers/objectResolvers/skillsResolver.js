// const { User } = require('../../../models/user');
const { Members } = require('../../../models/membersModel');
const { Skills } = require('../../../models/skillsModel');

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
   },
};
