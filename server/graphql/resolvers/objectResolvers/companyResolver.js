// const { User } = require('../../../models/user');
const { Members } = require("../../../models/membersModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Node } = require("../../../models/nodeModal");
const { Position } = require("../../../models/positionModel");
const { Conversation } = require("../../../models/conversationModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  Company: {
    positions: async (parent, args, context, info) => {
      console.log("parent = ", parent);
      try {
        const positionsID = parent._id;
        console.log("positionsID = ", positionsID);
        // positionsID = [...parent.positions];

        // console.log("positionsID = " , positionsID)

        const positionsData = await Position.find({ _id: positionsID });

        // let res = [];
        // positionsData.forEach((position) => {
        //   res.push({
        //     positionData: position,
        //   });
        // });
        // const positionID = parent.positionID;
        // positionData = await Position.findOne({ _id: positionID });
        // console.log("positionData = ", positionData);
        if (positionsData) {
          return positionsData;
        }
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "companyResolver > position",
            // position: context.req.position?._id,
          }
        );
      }
    },
  },
};
