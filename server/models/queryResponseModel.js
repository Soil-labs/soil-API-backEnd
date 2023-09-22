const { boolean } = require("mathjs");
const mongoose = require("mongoose");
require("dotenv").config();


const queryResponseModel = mongoose.Schema({
  sender: {
      positionID: String,
      userID: String,
  },  
  responder: {
    positionID: String,
    userID: String,
  },  
  conversationID: String,
  phase: {
    type: String,
    enum: ["QUERY", "RESPONDED","VIEWED","ARCHIVED"],
  },
  sentFlag: boolean,
  question: {
    content: String,
  },
  answer: {
    content: String,
  },
  category: {
    type: String,
    enum: ["REJECT_CANDIDATE", "ACCEPT_CANDIDATE","ASK_CANDIDATE","PITCH_POSITION_CANDIDATE"],
  },
});

const QueryResponse = mongoose.model("QueryResponse", queryResponseModel);
module.exports = { QueryResponse };
