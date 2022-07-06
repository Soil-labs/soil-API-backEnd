const mongoose = require("mongoose");
require("dotenv").config();



const roleTemplateSchema = mongoose.Schema({

  title: String,
  description: String,
  skills: [{
    skill: mongoose.Schema.ObjectId,
  }],

});


const RoleTemplate = mongoose.model("RoleTemplate", roleTemplateSchema);
module.exports = { RoleTemplate };
