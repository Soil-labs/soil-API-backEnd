const mongoose = require("mongoose");
require("dotenv").config();



const projectUpdateModalSchema = mongoose.Schema({

    //  --- Content ---
    title: String,
    content: String,
    //  --- Content ---

    
    //  --- Garden Location ---
    serverID: [String],
    projectID: mongoose.Schema.ObjectId,
    teamID: [mongoose.Schema.ObjectId],
    roleID: [mongoose.Schema.ObjectId],
    epicID: mongoose.Schema.ObjectId,
    taskID: mongoose.Schema.ObjectId,

    threadDiscordID: String,
    //  --- Garden Location ---



    //  --- Member Info ---
    championID: String,
    memberID: [String],
    authorID: String,
    notifyUserID: [String],
    //  --- Member Info ---


    // --- Task Info ---
    priority: Number,
    deadline: Date,
    phase: {
        type: String,
        enum: ["open", "archive"],
    },
    deWorkLink: String,
    // --- Task Info ---



    token: String,



    registeredAt: {
        type: Date,
        default: Date.now
    },

});


const ProjectUpdate = mongoose.model("ProjectUpdate", projectUpdateModalSchema);
module.exports = { ProjectUpdate };
