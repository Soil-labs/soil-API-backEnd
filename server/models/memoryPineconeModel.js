const mongoose = require("mongoose");
require("dotenv").config();

const memoryPineconeModel = mongoose.Schema({
  pineconeID: String,
  userID: String,
  positionID: String,
  memory: String,
  label: String,
  environment: String,
  convKey: String,
  database: String,

});

const MemoryPinecone = mongoose.model("MemoryPinecone", memoryPineconeModel);
module.exports = { MemoryPinecone };
