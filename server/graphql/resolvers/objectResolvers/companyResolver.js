// const { User } = require('../../../models/user');
const { Members } = require('../../../models/membersModel');
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Node } = require("../../../models/nodeModal");
const { Conversation } = require("../../../models/conversationModel");



const { ApolloError } = require('apollo-server-express');



module.exports = {
   CandidateType: {
      user: async (parent, args, context, info) => {
      //  console.log("parent = " , parent)

         try {
            const userID = parent.userID;

            // console.log("userID = " , userID)



            memberData = await Members.findOne({_id: userID}).select('-match_v2_update -match_v2')
         
            // console.log("memberData = " , memberData)

            if (memberData){
               return memberData;
            }


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
      conversation: async (parent, args, context, info) => {
         //  console.log("parent = " , parent)
   
            try {
               const conversationID = parent.conversationID;
   
               console.log("conversationID = " , conversationID)
   
   
   
               convData = await Conversation.findOne({_id: conversationID}).select('convKey userID conversation')
            
   
               if (convData){
                  return convData.conversation;
               }
   
   
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
   talentListType: {
      talent: async (parent, args, context, info) => {
      //  console.log("parent = " , parent)

         try {

            return parent.talent

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
   talentType: {
      user: async (parent, args, context, info) => {
       console.log("parent = " , parent)

         try {
          

            const userID = parent.userID;

            memberData = await Members.findOne({_id: userID}).select('-match_v2_update -match_v2')
         

            if (memberData){
               return memberData;
            }
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
   NodeDataType: {
      nodeData: async (parent, args, context, info) => {
       console.log("parent = " , parent)

         try {
            const nodeID = parent.nodeID;



            nodeData = await Node.findOne({_id: nodeID}).select('_id name node')
         
           
            return nodeData


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
   QuestionType: {
      question: async (parent, args, context, info) => {
      //  console.log("parent = " , parent)

         try {
            const questionID = parent.questionID;

            // console.log("questionID = " , questionID)



            questionData = await QuestionsEdenAI.findOne({_id: questionID}).select('-match_v2_update -match_v2')
         
            // console.log("questionData = " , questionData)

            if (questionData){
               return questionData;
            }


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
