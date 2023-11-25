const mongoose = require("mongoose");
require("dotenv").config();

const conversationSchema = mongoose.Schema({
  userID: String,
  convKey: String, // part of first 3 messages concatenated
  positionID: String,
  extraPositionsID: [String],
  positionTrainEdenAI: Boolean,

  threadID_openAI: String,

  stateSearch: {
    currentState: {
      type: String,
      enum: ["SEARCHING","FOUND","NOT_FOUND"],
    },
    memories: [{
      content: String,
      score: Number,
      primitives: [{
        type: String,
        score: Number,
      }]
    }]
  },

  typeConversation: {
    type: String,
    enum: ["INTERVIEW","ALIGNMENT_POSITION","PROMOTE_CANDIDATE","ASK_OPPORTUNITY"],
  },

  subjectConv: {
    positionIDs: [String],
    userIDs: [String],
    companyIDs: [String],
  },

  conversation: [
    {
      role: String, 
      typeWidget: {
        type: String,
        enum: ["MESSAGE","INDIVIDUAL_MEMORIES","SCORECARD","ADD_STATE"],
      },
      content: String,
      date: Date,
      widgetVars: {
        memoryIDs: [String],
        memory: {
          content: String,
          score: Number,
          primitives: [{
            type: String,
            score: Number,
          }]
        },
      },
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
