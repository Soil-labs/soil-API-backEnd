const mongoose = require("mongoose");
require("dotenv").config();

const positionModel = mongoose.Schema({
  name: String,
  url: String,
  companyID: mongoose.Schema.ObjectId,
  employees: [{
    typeT: String,
    userID: String,
  }],
  questionsToAsk:[{
    questionID: mongoose.Schema.ObjectId,
    bestAnswer: String,
  }],
  positionsRequirements: {
    originalContent: String,
    content: String,
    positionMemory: [{
      memoryContent: String,
      pineConeID: String,
    }],
    positionPreparationMemory: Boolean,
  },
  nodes: [{
    nodeID: mongoose.Schema.ObjectId,
  }],
  convRecruiter: [{
    userID: String,
    conversationID: mongoose.Schema.ObjectId,
    readyToDisplay: Boolean,
    positionQuestions: [{
      question: String,
      content: String,
    }],
    roleQuestions: [{
      question: String,
      content: String,
    }],
    convMemory: [{
      memoryContent: String,
      pineConeID: String,
    }],
  }],
  convRecruiterReadyToDisplay: Boolean,
  talentList: [{
    name: String,
    talent: [{
      userID: String,
    }]
  }],
  interviewQuestionsForPosition: [{
    originalQuestionID: mongoose.Schema.ObjectId,
    originalContent: String,
    personalizedContent: String,
  }],
  candidatesReadyToDisplay: Boolean,
  candidatesFlagAnalysisCreated: Boolean,
  candidates: [{
    userID: String,
    overallScore: Number,
    skillScore: Number,
    acceptedOrRejected: Boolean,
    readyToDisplay: Boolean,
    conversationID: mongoose.Schema.ObjectId,
    summaryQuestions: [{
      questionID: mongoose.Schema.ObjectId,
      originalQuestionContent: String,
      questionContent: String,
      questionContentSmall: String,
      answerContent: String,
      answerContentSmall: String,
      bestAnswerPosition: String,
      reason: String,
      score: Number,
      subConversationAnswer: [{
        role: String, // user or bot
        content: String,
      }],
    }],
    interviewQuestionsForCandidate: [{
      originalQuestionID: mongoose.Schema.ObjectId,
      originalContent: String,
      personalizedContent: String,
    }],
    notesInterview: [{
      categoryName: String,
      score: Number,
      reason: [String],
    }],
    averageScoreNotesInterview: Number,
    compareCandidatePosition: {
      CVToPosition: {
        content: String,
        score: Number,
      },
      CV_ConvoToPosition: [{
        categoryName: String,
        score: Number,
        reason: [String],
      }],
      CV_ConvoToPositionAverageScore: Number,
      reportPassFail: [{
        categoryName: String,
        title: String,
        score: Number,
        reason: String,
        IDb: String,
      }]
    },
    analysisCandidateEdenAI: {
      flagAnalysisCreated: Boolean,
      background: {
        content: String,
      },
      fitRequirements: {
        content: String,
      },
      skills: {
        content: String,
      }
    }
  }],

});

const Position = mongoose.model("Position", positionModel);
module.exports = { Position };
