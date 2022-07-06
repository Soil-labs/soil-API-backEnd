const mongoose = require("mongoose");
require("dotenv").config();



const projectSchema = mongoose.Schema({

  tagName: String, // the Tag Name
  title: String,
  description: String,

  champion:String,

  team: [{
    members: String,
    roleID: mongoose.Schema.ObjectId
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
    budgetType: String,
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
