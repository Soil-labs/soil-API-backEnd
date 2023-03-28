const mongoose = require("mongoose");
require("dotenv").config();

const reviewSchema = mongoose.Schema({
  userSend: String, //memberID
  userReceive: String, //memberID
  reviewMessage: String, // summary of discussion
  arweaveTransactionID: String, //transactionID saved to Arweave
  reviewNodes: [{
    nodeID: mongoose.Schema.ObjectId,
    confidence: Number
  }],
  stars: Number, // 0 - 5
  discussion: [{
    role: String,
    content: String,
  }],
  income: Number,

  createdAt: Date,
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = { Review };
