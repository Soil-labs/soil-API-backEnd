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
    enum: ["QUERY", "RESPONED","VIEWED","ARCHIVED"],
  },
  question: {
    content: String,
  },
  answer: {
    content: String,
  },
});

const QueryResponse = mongoose.model("QueryResponse", queryResponseModel);
module.exports = { QueryResponse };
