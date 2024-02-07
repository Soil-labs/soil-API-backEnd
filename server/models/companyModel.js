const mongoose = require("mongoose");
require("dotenv").config();

const companyModel = mongoose.Schema({
  name: String,
  url: String,
  slug: String,
  imageUrl: String,
  description: String,
  approvedEmails: [String],
  employees: [
    new mongoose.Schema(
      {
        typeT: { type: String, enum: ["ADMIN", "EMPLOYEE"] },
        status: { type: String, enum: ["ACTIVE", "PENDING", "REJECTED"] },
        userID: String,
      },
      { _id: false }
    ),
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
  communitiesSubscribed: [mongoose.Schema.ObjectId],

  employeesNumber: Number,
  tags: [String],
  whatsToLove: String,

  mission: String,
  insights: [
    {
      letter: String,
      text: String,
    },
  ],
  edenTake: String,

  funding: [
    {
      name: String,
      date: String,
      amount: String,
    },
  ],

  culture: {
    tags: [String],
    description: String,
  },

  benefits: String,
  values: String,
  founders: String,
  glassdoor: String,
});

const Company = mongoose.model("Company", companyModel);
module.exports = { Company };
