const mongoose = require("mongoose");
require("dotenv").config();



const skillcategorySchema = mongoose.Schema({

  name: String,
  description: String,
  skills: [mongoose.Schema.ObjectId],

});


const SkillCategory = mongoose.model("SkillCategory", skillcategorySchema);
module.exports = { SkillCategory };
