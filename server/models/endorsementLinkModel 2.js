const mongoose = require("mongoose");

const endorsementLinkSchema = mongoose.Schema({
  memberID: String,
  message: String, // message
  nodes: [String],

  createdAt: Date,
});

const EndorsementLink = mongoose.model(
  "EndorsementLink",
  endorsementLinkSchema
);
module.exports = { EndorsementLink };
