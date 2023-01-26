const mongoose = require("mongoose");
require("dotenv").config();

const serverSchema = mongoose.Schema({
  _id: {
    type: String,
    unique: true,
  },

  name: String,
  adminID: [String],
  adminRoles: [String],
  adminCommands: [String],

  channel: {
    chatID: String,
    forumID: String,
  },
  serverType: {
    type: String,
    enum: ["DAO", "Hackathon", "Project"],
  },
  serverAvatar: String,
});

const ServerTemplate = mongoose.model("ServerTemplate", serverSchema);
module.exports = { ServerTemplate };
