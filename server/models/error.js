const mongoose = require("mongoose");

const errorSchema = mongoose.Schema(
  {
    errorType: String, // error.extensions.errorType
    createdAt: Date,

    // server, frontend, bot
    name: String, // error.name
    component: String, // component name
    message: String, // error.message
    code: String, // error.extensions.code
    path: [String], // mutation name

    // server data
    stacktrace: [String], // error.extensions.stacktrace

    // frontend data
    memberID: String, // req.user._id
    url: String, // req.url
  },
  { timestamps: true }
);

const ErrorLog = mongoose.model("ErrorLog", errorSchema);
module.exports = { ErrorLog };
