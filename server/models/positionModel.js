const mongoose = require("mongoose");
require("dotenv").config();

const positionModel = mongoose.Schema({
  name: String,
  url: String,
  companyID: mongoose.Schema.ObjectId,
  questionsToAsk: [
    {
      questionID: mongoose.Schema.ObjectId,
      bestAnswer: String,
    },
  ],
  nodes: [
    {
      nodeID: mongoose.Schema.ObjectId,
    },
  ],
  convRecruiter: [
    {
      userID: String,
      conversationID: mongoose.Schema.ObjectId,
      readyToDisplay: Boolean,
      positionQuestions: [
        {
          question: String,
          content: String,
        },
      ],
      roleQuestions: [
        {
          question: String,
          content: String,
        },
      ],
      convMemory: [
        {
          memoryContent: String,
          pineConeID: String,
        },
      ],
    },
  ],
  convRecruiterReadyToDisplay: Boolean,
  talentList: [
    {
      name: String,
      talent: [
        {
          userID: String,
        },
      ],
    },
  ],
  candidatesReadyToDisplay: Boolean,
  candidates: [
    {
      userID: String,
      overallScore: Number,
      acceptedOrRejected: Boolean,
      readyToDisplay: Boolean,
      conversationID: mongoose.Schema.ObjectId,
      summaryQuestions: [
        {
          questionID: mongoose.Schema.ObjectId,
          questionContent: String,
          questionContentSmall: String,
          answerContent: String,
          answerContentSmall: String,
          bestAnswerPosition: String,
          reason: String,
          score: Number,
          subConversationAnswer: [
            {
              role: String, // user or bot
              content: String,
            },
          ],
        },
      ],
      interviewQuestionsForCandidate: [
        {
          originalQuestionID: mongoose.Schema.ObjectId,
          originalContent: String,
          personalizedContent: String,
        },
      ],
      notesInterview: [
        {
          categoryName: String,
          score: Number,
          reason: [String],
        },
      ],
    },
  ],
});

const Position = mongoose.model("Position", positionModel);
module.exports = { Position };
