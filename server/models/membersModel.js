const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;



const memberSchema = mongoose.Schema({

  discordName: {
    type: String,
    maxlength: 100,
  },
  discordID: String,
  discordAvatar: String,


  tweets: [String],
  skills: [{
    id: mongoose.Schema.ObjectId,
    authors: [mongoose.Schema.ObjectId],
    communityLevel: Number,
    selfEndorsedLevel: Number,
  }],
  projects: [mongoose.Schema.ObjectId],
  archiveProjects: [mongoose.Schema.ObjectId],

  network: [{
    memberID: mongoose.Schema.ObjectId,
    endorcment: [{
      skillID: mongoose.Schema.ObjectId,
      registeredAt: Date,
    }],
  }],

  registeredAt: Date,


});


const Members = mongoose.model("Members", memberSchema);
module.exports = { Members };
