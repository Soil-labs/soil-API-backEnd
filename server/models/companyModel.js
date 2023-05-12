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
  candidatesReadyToDisplay: Boolean,
  candidates: [{
    userID: String,
    overallScore: Number,
    acceptedOrRejected: Boolean,
    readyToDisplay: Boolean,
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
