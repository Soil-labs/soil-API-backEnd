const mongoose = require("mongoose");
require("dotenv").config();


const companyModel = mongoose.Schema({
  name: String,
  employees: [{
    typeT: String,
    userID: String,
  }],
  questionsToAsk:[{
    questionID: mongoose.Schema.ObjectId,
    bestAnswer: String,
  }],
  nodes: [{
    nodeID: mongoose.Schema.ObjectId,
  }],
  convRecruiter: [{
    userID: String,
    conversationID: mongoose.Schema.ObjectId,
    readyToDisplay: Boolean,
    companyQuestions: [{
      question: String,
      content: String,
    }],
    roleQuestions: [{
      question: String,
      content: String,
    }],
  }],
  convRecruiterReadyToDisplay: Boolean,
  talentList: [{
    name: String,
    talent: [{
      userID: String,
    }]
  }],
  candidatesReadyToDisplay: Boolean,
  candidates: [{
    userID: String,
    overallScore: Number,
    acceptedOrRejected: Boolean,
    readyToDisplay: Boolean,
    conversationID: mongoose.Schema.ObjectId,
    summaryQuestions: [{
      questionID: mongoose.Schema.ObjectId,
      questionContent: String,
      questionContentSmall: String,
      answerContent: String,
      answerContentSmall: String,
      bestAnswerCompany: String,
      reason: String,
      score: Number,
      subConversationAnswer: [{
        role: String, // user or bot
        content: String,
      }],
    }]
  }]

});

const Company = mongoose.model("Company", companyModel);
module.exports = { Company };
