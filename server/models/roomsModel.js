const mongoose = require("mongoose");

const roomSchema = mongoose.Schema({
  name: String,
  description: String,
  avatar: String,
  serverID: String,
  hostID: [String],

  members: [String],
  registeredAt: Date,
});

const Rooms = mongoose.model("Rooms", roomSchema);
module.exports = { Rooms };
