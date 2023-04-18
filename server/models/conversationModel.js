const mongoose = require("mongoose");
require("dotenv").config();


const conversationSchema = mongoose.Schema({
  userID: String, 
  convKey: String, // part of first 3 messages concatenated

  conversation: [{
    role: String, // user or bot
    content: String,
  }],

  summaryReady: Boolean,

  // summary: [String],
  summary: [{
    pineConeID: String,
    content: String,
  }],

  
  updatedAt: Date,
});

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = { Conversation };
