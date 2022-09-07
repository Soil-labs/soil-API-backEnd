const mongoose = require("mongoose");
require("dotenv").config();



const teamModalSchema = mongoose.Schema({

    name: String,
    description: String,

    serverID: [String],
    projectID: mongoose.Schema.ObjectId,
    memberID: [String],
    championID: [String],

    roles: mongoose.Schema.ObjectId,
    epics: [mongoose.Schema.ObjectId],

    categoryDiscordlD: String,
    channelGeneralDiscordID: String,


});


const Team = mongoose.model("Team", teamModalSchema);
module.exports = { Team };
