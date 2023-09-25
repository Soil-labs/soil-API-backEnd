const mongoose = require("mongoose");
require("dotenv").config();

const companyModel = mongoose.Schema({
  name: String,
  url: String,
  slug: String,
  description: String,
  employees: [
    {
      typeT: String,
      userID: String,
    },
  ],
  positions: [
    {
      typeT: String,
      positionID: mongoose.Schema.ObjectId,
    },
  ],
  communitySubscribers: [
    {
      positionID: mongoose.Schema.ObjectId,
      companyID: mongoose.Schema.ObjectId,
    },
  ],
  type: {
    type: String,
    enum: ["COMPANY", "COMMUNITY"],
  },
  skillsNum: Number,

  stripe: {
    session: {
      ID: String,
    },
    customerID: String,
    product: { ID: String },
  },
});

const Company = mongoose.model("Company", companyModel);
module.exports = { Company };
