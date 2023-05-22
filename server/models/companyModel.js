const mongoose = require("mongoose");
require("dotenv").config();

const companyModel = mongoose.Schema({
  name: String,
  employees: [
    {
      typeT: String,
      userID: String,
    },
  ],
  url: String,
  positions: [mongoose.Schema.ObjectId],
});

const Company = mongoose.model("Company", companyModel);
module.exports = { Company };
