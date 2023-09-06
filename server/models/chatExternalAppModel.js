const mongoose = require("mongoose");
require("dotenv").config();


const chatExternalAppSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  chatID_TG: String,
  userID: String,
  projectID: mongoose.Schema.ObjectId,
  communicationAuthorType: {
    type: String,
    enum: ["POSITION", "USER"],
  },
  message: String,
  senderRole: {
    type: String,
    enum: ["assistant", "user"],
  },
  timeStamp: Date,
});

const ChatExternalApp = mongoose.model("ChatExternalApp", chatExternalAppSchema);
module.exports = { ChatExternalApp };