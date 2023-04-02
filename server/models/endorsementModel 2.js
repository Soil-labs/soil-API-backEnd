const mongoose = require("mongoose");
require("dotenv").config();

const endorsementSchema = mongoose.Schema({
  userSend: String, //memberID
  userReceive: String, //memberID
  endorsementMessage: String, // summary of discussion
  arweaveTransactionID: String, //transactionID saved to Arweave
  endorseNodes: [{
    nodeID: mongoose.Schema.ObjectId,
    confidence: Number
  }],
  stars: Number, // 0 - 5
  discussion: [{
    role: String,
    content: String,
  }],
  stake: Number,

  createdAt: Date,
});

const Endorsement = mongoose.model("Endorsement", endorsementSchema);
module.exports = { Endorsement };
