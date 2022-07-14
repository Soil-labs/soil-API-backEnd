const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;



const memberSchema = mongoose.Schema({

  _id: {
    type: String,
    unique: true,
  },

  discordName: {
    type: String,
    maxlength: 100,
  },

  discordAvatar: String,
  discriminator: String,
  bio: String,

  hoursPerWeek: Number,


  tweets: [String],
  skills: [{
    id: mongoose.Schema.ObjectId,
    authors: [String],
    communityLevel: Number,
    selfEndorsedLevel: Number,
  }],

  projects: [{
    projectID: mongoose.Schema.ObjectId,
    roleID: mongoose.Schema.ObjectId,
    champion: Boolean,
  }],

  attributes: {
    totalVotes: Number,
    organization: Number,
    collaboration: Number,
    management: Number,
    ownership: Number,
    flexibility: Number,
    decisiveness: Number,
    empathy: Number,
    leadership: Number,
  },
  
  archiveProjects: [mongoose.Schema.ObjectId],

  network: [{
    memberID: String,
    endorcment: [{
      skillID: mongoose.Schema.ObjectId,
      registeredAt: Date,
    }],
  }],

  registeredAt: Date,


});


const Members = mongoose.model("Members", memberSchema);
module.exports = { Members };
