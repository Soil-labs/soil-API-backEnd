const mongoose = require("mongoose");
require("dotenv").config();



const projectSchema = mongoose.Schema({

  title: String,
  description: String,

  champion:String,

  team: [{
    members: String,
    roleID: mongoose.Schema.ObjectId,
    phase: {
      type: String,
      enum: ["shortlisted", "engaged","committed","rejected"],
      default: "shortlisted"
    },
  }],

  role: [{
    title: String,
    description: String,
    skills: [{
      skill: mongoose.Schema.ObjectId,
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
    content: String,
    author: String,
    registeredAt: Date,
  }],

  collaborationLinks: [{
    title: String,
    link: String,
  }],

  budget: {
    totalBudget: String,
    token: String,
    perHour: String,
  },
  dates: {
    kickOff: Date,
    complition: Date,
  }


});


const Projects = mongoose.model("Projects", projectSchema);
module.exports = { Projects };
