const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;



const skillSchema = mongoose.Schema({

  tagName: String,



  tweets: [mongoose.Schema.ObjectId],
  members: [String],

  registeredAt: Date,


});


const Skills = mongoose.model("Skills", skillSchema);
module.exports = { Skills };
