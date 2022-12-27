const mongoose = require("mongoose");
require("dotenv").config();

const grantSchema = mongoose.Schema({
  name: String,
  description: String,
  smallDescription: String,

  tags: [String],

  requirments: [String],

  applicationProcess: [String],

  difficulty: String,
  distributed: Number,
  maxDistributed: Number,

  resources: [
    {
      name: String,
      url: String,
    },
  ],

  membersApplied: [String],

  amount: String,

  avatar: String,

  nodes: [
    {
      _id: mongoose.Schema.ObjectId,
    },
  ],
  serverID: [String],
});

const GrantTemplate = mongoose.model("GrantTemplate", grantSchema);
module.exports = { GrantTemplate };
