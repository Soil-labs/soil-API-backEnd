const mongoose = require("mongoose");
require("dotenv").config();



const projectSchema = mongoose.Schema({

  title: String,
  description: String,

  serverID: [String],

  champion:String,

  team: [{
    memberID: String,
    roleID: mongoose.Schema.ObjectId,
    phase: {
      type: String,
      enum: ["shortlisted", "engaged","committed","rejected","invited"],
      default: "shortlisted"
    },
  }],

  role: [{
    title: String,
    description: String,
    skills: [{
      _id: mongoose.Schema.ObjectId,
      level: String,
    }],
    archive: Boolean,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    hoursPerWeek: String,
    budget: {
      token: String,
      perHour: String,
    }
  }],


  tweets: [{
    title: String,
    content: String,
    author: String,
    registeredAt: Date,
    approved: Boolean,approved: Boolean,
  }],

  collaborationLinks: [{
    title: String,
    link: String,
  }],
  stepsJoinProject:[String],

  budget: {
    totalBudget: String,
    token: String,
    perHour: String,
  },
  dates: {
    kickOff: Date,
    complition: Date,
  },

  garden_teams: [mongoose.Schema.ObjectId],


});


const Projects = mongoose.model("Projects", projectSchema);
module.exports = { Projects };
