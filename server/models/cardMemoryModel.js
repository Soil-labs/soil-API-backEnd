const mongoose = require("mongoose");
require("dotenv").config();

const cardMemoryModel = mongoose.Schema({
  content: String,
  priority: Number,
  tradeOffBoost: Number,
  type: {
    type: String,
    enum: ["SCORE_CARD","SKILL","FUTURE_POTENTIAL","KEY_ATTRIBUTE","INTERESTS","VALUE"], // ScoreCard = Checks and Balances
  },
  authorCard: {
    companyID: String,
    positionID: String,
    userID: String,
    category: {
      type: String,
      enum: ["COMPANY","POSITION","CANDIDATE"],
    },


  },
  score: {
    overall: Number,
    reason: String,
    agent: [{
      category: {
        type: String,
        enum: ["CREDIBILITY","PRECISION","CONSISTENCY","ALIGNMENT"], 
      },
      score: Number,
      reason: String,
    }]
  },
  connectedCards: [{
    cardID: mongoose.Schema.ObjectId,
    score: Number,
    reason: String,
  }],


});

const CardMemory = mongoose.model("CardMemory", cardMemoryModel);
module.exports = { CardMemory };
