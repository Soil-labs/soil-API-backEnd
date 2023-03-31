const mongoose = require("mongoose");

const endorsementLinkSchema = mongoose.Schema({
  memberID: String,
  //   userSend: String, //memberID
  //   userReceive: String, //memberID
  message: String, // message

  //   nodes: [
  //     {
  //       _id: mongoose.Schema.ObjectId,
  //     },
  //   ],
  nodes: [String],

  createdAt: Date,
});

const EndorsementLink = mongoose.model(
  "EndorsementLink",
  endorsementLinkSchema
);
module.exports = { EndorsementLink };
