const mongoose = require("mongoose");
require("dotenv").config();



const projectUpdateModalSchema = mongoose.Schema({

    serverID: String,
    projectID: mongoose.Schema.ObjectId,
    teamID: [mongoose.Schema.ObjectId],
    memberID: [String],
    authorID: String,


    title: String,
    content: String,

    registeredAt: {
        type: Date,
        default: Date.now
    },

});


const ProjectUpdate = mongoose.model("ProjectUpdate", projectUpdateModalSchema);
module.exports = { ProjectUpdate };
