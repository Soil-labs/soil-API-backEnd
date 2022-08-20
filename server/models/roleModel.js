const mongoose = require("mongoose");
require("dotenv").config();



const roleSchema = mongoose.Schema({

    name: String,
    description: String,

    serverID: [String],
    projectID: mongoose.Schema.ObjectId,
    memberID: [String],
    teamID: [String],


});


const Role = mongoose.model("Role", roleSchema);
module.exports = { Role };
