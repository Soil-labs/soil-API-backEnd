const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;



const tweetSchema = mongoose.Schema({

  airtableID: String,
  content: String,


  skills: [String],
  members: [String],
  projects: [String],
  
  author: String,

  registeredAt: Date,


});


const Tweet = mongoose.model("Tweet", tweetSchema);
module.exports = { Tweet };
