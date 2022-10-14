const mongoose = require("mongoose");
require("dotenv").config();


const chatSchema = mongoose.Schema({
  message: String,
  senderID: String,
  receiverID: String,
  projectID: mongoose.Schema.ObjectId,
  projectRoleID: mongoose.Schema.ObjectId,
  threadID: String,
  reply: {
    sender: Boolean,
    receiver: Boolean
  },
  result: {
    type: String,
    enum: ["unsuccesful", "successful"],
  },
  createdAt: Date,
});

const Chats = mongoose.model("Chats", chatSchema);
module.exports = { Chats };