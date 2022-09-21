const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SALT_I = 10;



const skillSchema = mongoose.Schema({

  name: String,



  tweets: [mongoose.Schema.ObjectId],
  members: [String],

  subCategorySkill: [mongoose.Schema.ObjectId],
  categorySkills: [mongoose.Schema.ObjectId],

  relatedSkills: [mongoose.Schema.ObjectId],

  state: {
    type: String,
    enum: ["waiting","rejected","approved"],
    default: "waiting"
  },

  id_lightcast: String,


  match: {
    recalculateProjectRoles: {
      type: Boolean,
      default: true
    },
    distanceProjectRoles: {
      hop0: [mongoose.Schema.ObjectId],
      hop1: [mongoose.Schema.ObjectId],
      hop2: [mongoose.Schema.ObjectId],
      hop3: [mongoose.Schema.ObjectId],
    },
    
    recalculateMembers: {
      type: Boolean,
      default: true
    },
    distanceMembers: {
      hop0: [String],
      hop1: [String],
      hop2: [String],
      hop3: [String],
    }
  },

  registeredAt: Date,


});


const Skills = mongoose.model("Skills", skillSchema);
module.exports = { Skills };
