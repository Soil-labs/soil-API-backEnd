const { Conversation } = require("../../../models/conversationModel");
const { ApolloError } = require("apollo-server-express");

// const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");


const { addQuestionToEdenAIFunc } = require("../utils/questionsEdenAIModules");



module.exports = {
  addQuestionToEdenAI: async (parent, args, context, info) => {
      const { content } = args.fields;
      console.log("Mutation > addQuestionToEdenAI > args.fields = ", args.fields);

    //   const newQuestion = await new QuestionsEdenAI({
    //     content: content,
    //     answeredQuestionByUsers: [],
    //     questionOwnedByPositions: []
    // });

    // sdf00

      res = await addQuestionToEdenAIFunc(content)
      // asfd

      try {

        return {
          _id: res._id,
          content: res.content,
        }
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addQuestionToEdenAI",
          { component: "questionsEdenAIMutation > addQuestionToEdenAI" }
        );
      }
    },
}
