const mongoose = require("mongoose");
require("dotenv").config();

const edenMetricsSchema = mongoose.Schema({
  memberID: String,
  profileCreatedDate: Date,
  activeUserLogin: [
    {
      date: Date,
    },
  ],
  exploreFeatures: [
    //this is an array that tracks the order the main product feature is clicked
    { buttonClicked: String, timeClicked: Date, index: Number },
  ],
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
