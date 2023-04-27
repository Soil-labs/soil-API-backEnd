const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");


const { ApolloError } = require("apollo-server-express");


module.exports = {
  findQuestionEdenAI: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findQuestionEdenAI > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("ID is required")


    try {

      // find conversaiotn 
      let questionData = await QuestionsEdenAI.findOne({ _id: _id });
      
      if (!questionData) throw new ApolloError("Conversation not found")

      return questionData;
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findQuestionEdenAI",
        { component: "questionsEdenAIQuery > findQuestionEdenAI" }
      );
    }
  },

};
