const mongoose = require("mongoose");
require("dotenv").config();

const edenMetricsSchema = mongoose.Schema({
  memberID: String,
  signUpDate: Date,
  visited: [
    {
      loginTime: Date,
      sessionLength: Number,
      logoutTime: Date,
    },
  ],
  actions: [
    {
      actionType: String,
      actionDate: Date,
    },
  ],
});

const EdenMetrics = mongoose.model("EdenMetrics", edenMetricsSchema);
module.exports = { EdenMetrics };
