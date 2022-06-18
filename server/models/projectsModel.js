const mongoose = require("mongoose");
require("dotenv").config();



const projectSchema = mongoose.Schema({

  airtableID: String,
  content: String,

  members: [String],
  champion: [String],
  tweets: [String],
  skills: [String],


  title: String,
  description: String,



  registeredAt: Date,


});


const Projects = mongoose.model("Projects", projectSchema);
module.exports = { Projects };
