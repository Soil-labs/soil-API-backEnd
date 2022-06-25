const mongoose = require("mongoose");
require("dotenv").config();



const projectSchema = mongoose.Schema({

  tagName: String, // the Tag Name
  title: String,
  description: String,

  champion: mongoose.Schema.ObjectId,

  team: [{
    members: mongoose.Schema.ObjectId,
    roleID: mongoose.Schema.ObjectId
  }],

  role: [{
    title: String,
    description: String,
    skill: [{
      skillID: mongoose.Schema.ObjectId,
      level: Number,
      numEndorsement: Number,
      comment: String
    }],
    archive: Boolean,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    hoursPerWeek: Number,
    budget: {
      token: String,
      perHour: String,
    }
  }],


  tweets: [{
    content: String,
    author: mongoose.Schema.ObjectId,
  }],

  collaborationLinks: {
    title: String,
    link: String,
  },

  budget: {
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
