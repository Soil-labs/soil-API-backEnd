const mongoose = require("mongoose");
require("dotenv").config();



const skillSubCategorySchema = mongoose.Schema({

  name: String,
  description: String,

  categorySkills: [mongoose.Schema.ObjectId],
  skills: [mongoose.Schema.ObjectId],

  id_lightcast: String,

  emoji: String,

});


const SkillSubCategory = mongoose.model("SkillSubCategory", skillSubCategorySchema);
module.exports = { SkillSubCategory };
