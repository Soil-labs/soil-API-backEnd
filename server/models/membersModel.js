const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;



const memberSchema = mongoose.Schema({

  airtableID: String,

  discordName: {
    type: String,
    maxlength: 100,
  },
  discordID: String,
  discordAvatar: String,

  

  discussion: {
    topic: String,
    phase: Number,
    authorName: String,
    command: String,
    tweet: String,
  },
  discussExtraData: String,




  tweets: [String],
  skills: [String],
  projects: [String],

  registeredAt: Date,


});


const Members = mongoose.model("Members", memberSchema);
module.exports = { Members };
