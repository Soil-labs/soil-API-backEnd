const mongoose = require("mongoose");
require("dotenv").config();



const skillcategorySchema = mongoose.Schema({

  name: String,
  description: String,

  subCategory_skill: [mongoose.Schema.ObjectId],
  skills: [mongoose.Schema.ObjectId],

  id_lightcast: String,

  emoji: String,

});


const SkillCategory = mongoose.model("SkillCategory", skillcategorySchema);
module.exports = { SkillCategory };
