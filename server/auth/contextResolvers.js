require("dotenv").config();
const jwt = require("jsonwebtoken");
const { AuthenticationError } = require("apollo-server-express");

const { JWT_SECRET } = process.env;

const contextResolver = ({ req, req: { headers } }) => {
  try {
    if (req.body) {
      req.body.query = req.body.query;
    }
    req.headers["Access-Control-Allow-Origin"] = "*";
    req.headers["Access-Control-Allow-Headers"] =
      "Origin, X-Requested-With, Content-Type, Accept";
    if (headers.authorization) {
      headers.authorization.replace(/[&#,+()$~%.:*?<>]/g, "");
      const contextPayload = jwt.verify(
        headers.authorization.replace("Bearer ", ""),
        JWT_SECRET || ""
      );

      console.log("request payload", contextPayload);

      if (
        !(contextPayload && contextPayload._id && contextPayload.discordName)
      ) {
        //cannot retrive stored data in token. should throw error but for simplicity return null
        req.user = null;
      } else {
        //token available here and valid
        req.user = contextPayload;
      }
    } else {
      req.user = null;
    }
    return req;
  } catch (err) {
    console.error(err);
    throw new AuthenticationError(err.message);
  }
};

module.exports = contextResolver;
