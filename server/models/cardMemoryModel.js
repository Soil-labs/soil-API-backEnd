const mongoose = require("mongoose");
require("dotenv").config();

const cardMemoryModel = mongoose.Schema({
  content: String,
  priority: Number,
  tradeOffBoost: Number,
  type: {
    type: String,
    enum: ["TECHNICAL_SKILLS","SOFT_SKILLS","EXPERIENCE","INDUSTRY_KNOWLEDGE","INTERESTS","CORE_VALUES","GOALS","OTHER"], // ScoreCard = Checks and Balances
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
  keyPriority: Boolean,
  futurePotential: Boolean,


});

const CardMemory = mongoose.model("CardMemory", cardMemoryModel);
module.exports = { CardMemory };
