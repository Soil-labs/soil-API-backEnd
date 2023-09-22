const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Company } = require("../models/companyModel");
const {
  retrieveAndMergeServersUserIsIn,
} = require("../utils/updateUserServersInDB");
const { createNode_neo4j } = require("../neo4j/func_neo4j");
const { ACCESS_LEVELS, OPERATORS } = require("./constants");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const companyAuth = async ({ body }, res) => {
  try {
    const { companySlug, userID } = body;

    if (!userID) throw new Error("Invalid user supplied");
    if (!companySlug) throw new Error("No company provided");

    // Find if company is in database
    let dbCompany = await Company.findOne({ slug: companySlug });

    console.log("AAAA", companySlug, userID, dbCompany.employees);

    // if company is not in database
    if (!dbCompany) {
      throw new Error("Company does not exist");
    }

    if (!dbCompany.employees.some((employee) => employee.userID === userID)) {
      throw new Error("Unauthorized user");
    }

    res.json("User authorized");
  } catch (error) {
    console.log("the error is ", error);
    res.status(500).send({ error: error.message });
  }
};

module.exports = companyAuth;
