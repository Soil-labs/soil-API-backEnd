// const { User } = require('../../../models/user');
const { Members } = require("../../../models/membersModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Node } = require("../../../models/nodeModal");
const { Position } = require("../../../models/positionModel");
const { Conversation } = require("../../../models/conversationModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  MemoryPinecone: {
    position: async (parent, args, context, info) => {
      // console.log("parent = ", parent);
      try {
        
        const positionsID = parent.positionID

        // console.log("positionsID = " , positionsID)

        const positionsData = await Position.findOne({ _id: positionsID });

        if (positionsData) {
          return positionsData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "memoryPinecone > position",
          }
        );
      }
    },
    user: async (parent, args, context, info) => {
      // console.log("parent = ", parent);
      try {
        
        const userID = parent.userID

        // console.log("userID = " , userID)

        const userData = await Members.findOne({ _id: userID });
        

        if (userData) {
          return userData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "memoryPinecone > user",
          }
        );
      }
    },
  },
};
