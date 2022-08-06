const mongoose = require("mongoose");
require("dotenv").config();



const projectUpdateModalSchema = mongoose.Schema({

    title: String,
    content: String,

    serverID: [String],
    projectID: mongoose.Schema.ObjectId,
    teamID: [mongoose.Schema.ObjectId],
    memberID: [String],
    authorID: String,


    registeredAt: {
        type: Date,
        default: Date.now
    },

});


const ProjectUpdate = mongoose.model("ProjectUpdate", projectUpdateModalSchema);
module.exports = { ProjectUpdate };
