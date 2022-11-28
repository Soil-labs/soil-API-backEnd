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
  discributed: Number,

  resources: [
    {
      name: String,
      url: String,
    },
  ],

  amount: String,

  avatar: String,
});

const GrantTemplate = mongoose.model("GrantTemplate", grantSchema);
module.exports = { GrantTemplate };
