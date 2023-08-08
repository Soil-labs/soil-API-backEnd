// const { User } = require('../../../models/user');

const { Skills } = require('../../../models/skillsModel');
const { SkillCategory} = require("../../../models/skillCategoryModel");
const { Conversation } = require("../../../models/conversationModel");

const { ApolloError } = require('apollo-server-express');



module.exports = {
   QueryResponse: {
      conversation: async (parent, args, context, info) => {
      //  console.log("parent = " , parent)

         try {
            const conversationID = parent.conversationID;


            conversationData = await Conversation.findOne({_id: conversationID})
         

            // console.log("conversationData = " , conversationData)


            return conversationData;

         } catch (err) {
            throw new ApolloError(
               err.message,
               err.extensions?.code || 'DATABASE_SEARCH_ERROR',
               {
                  component: 'queryResponseResolver > conversation',
                  user: context.req.user?._id,
               }
            );
         }
      },
   },
   
   
};
