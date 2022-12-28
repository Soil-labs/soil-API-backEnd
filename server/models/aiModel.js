const mongoose = require("mongoose");
require("dotenv").config();

const aiSchema = mongoose.Schema({
  creator: String,
  mentioned: [String],
  message: String,
  serverID: String,
  edenAI: {
    keywords: [
      {
        keywords: String,
        embedding: [mongoose.Decimal128],
      },
    ],
    nodes: [mongoose.Schema.ObjectId],
  },

  createdAt: Date,
});

const AI = mongoose.model("AI", aiSchema);
module.exports = { AI };
