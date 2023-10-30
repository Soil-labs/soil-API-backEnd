const mongoose = require("mongoose");
require("dotenv").config();

const conversationSchema = mongoose.Schema({
  userID: String,
  convKey: String, // part of first 3 messages concatenated
  positionID: String,
  extraPositionsID: [String],
  positionTrainEdenAI: Boolean,

  conversation: [
    {
      role: String, // user or bot
      content: String,
      date: Date,
    },
  ],

  lastMsgSummed: Number,

  summariesMessages: [
    {
      content: String,
      date: Date,
      pineConeID: String,
    }
  ],

  summaryReady: Boolean,

  summary: [
    {
      pineConeID: String,
      content: String,
    },
  ],

  questionsAnswered: [
    {
      questionID: mongoose.Schema.ObjectId,
      questionContent: String,
      subConversationAnswer: [
        {
          role: String, // user or bot
          content: String,
        },
      ],
      summaryOfAnswer: String,
      summaryOfAnswerSmall: String,
    },
  ],
  typeConvo: {
    type: String,
    enum: ["QUERY_RESPONSE", "INTERVIEW","ALIGN","ASK_OPPORTUNITY","ASK_CANDIDATE","ASK_TALENT_LIST"],
  },

  updatedAt: Date,
});

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = { Conversation };
