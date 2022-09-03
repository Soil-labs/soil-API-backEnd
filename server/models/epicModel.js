const mongoose = require("mongoose");
require("dotenv").config();


// Task
const epicModalSchema = mongoose.Schema({

    //  --- Content ---
    name: String,
    description: String,
    //  --- Content ---


    //  --- Garden Location ---
    serverID: [String],
    projectID: mongoose.Schema.ObjectId,
    teamID: [mongoose.Schema.ObjectId],

    channelDiscordlID: String,
    //  --- Garden Location ---

    //  --- Member Info ---
    championID: String,
    memberID: [String],
    authorID: String,
    notifyUserID: [String],
    //  --- Member Info ---


    

    phase: {
        type: String,
        enum: ["open", "archive"],
    },

    

    registeredAt: {
        type: Date,
        default: Date.now
    },


});


const Epic = mongoose.model("Epic", epicModalSchema);
module.exports = { Epic };
