const mongoose = require("mongoose");
require("dotenv").config();



const initiativeModalSchema = mongoose.Schema({

    name: String,
    description: String,

    phase: {
        type: String,
        enum: ["open", "archive"],
    },
    championID: String,

    serverID: [String],
    projectID: mongoose.Schema.ObjectId,
    teamID: [mongoose.Schema.ObjectId],

    memberID: [String],
    notifyUserID: [String],

    channelDiscordlID: String,


});


const Initiative = mongoose.model("Initiative", initiativeModalSchema);
module.exports = { Initiative };
