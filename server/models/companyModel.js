const mongoose = require("mongoose");
require("dotenv").config();

const companyModel = mongoose.Schema({
  name: String,
  url: String,
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
});

const Company = mongoose.model("Company", companyModel);
module.exports = { Company };
