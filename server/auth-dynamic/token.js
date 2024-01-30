const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Members } = require("../models/membersModel");
const {
  retrieveAndMergeServersUserIsIn,
} = require("../utils/updateUserServersInDB");
const { createNode_neo4j } = require("../neo4j/func_neo4j");
const { ACCESS_LEVELS, OPERATORS } = require("../auth/constants");

const mapUserFromCredentials = (tokenData) => {
  const credentials = tokenData.verified_credentials;

  let user;

  if (
    credentials.find(
      (cred) => cred.format === "oauth" && cred.oauth_provider === "google"
    )
  ) {
    const _cred = credentials.find(
      (cred) => cred.format === "oauth" && cred.oauth_provider === "google"
    );
    user = {
      id: _cred.oauth_account_id,
      email: tokenData.email,
      name: _cred.oauth_display_name,
      picture: _cred.oauth_account_photos[0] || null,
    };
  } else if (credentials.find((cred) => cred.format === "email")) {
    user = {
      id: tokenData.sub,
      email: tokenData.email,
      name: tokenData.email.split("@")[0],
      picture: null,
    };
  } else {
    throw new Error("Could not map user from credentials");
  }

  return user;
};

const token = async ({ body }, res) => {
  try {
    const { accessToken } = body;
    console.log("start accessing the token here", accessToken);
    console.log(
      "process.env.DYNAMIC_PUBLIC_KEY",
      process.env.DYNAMIC_PUBLIC_KEY
    );

    if (!accessToken) throw new Error("Invalid Token supplied");

    // Verify the token from Dynamic and extract user information
    let tokenData;
    await jwt.verify(
      accessToken,
      process.env.DYNAMIC_PUBLIC_KEY,
      {
        algorithms: ["RS256"],
      },
      function (err, decodedToken) {
        console.log("DECODED TOKEN ------>", decodedToken);
        console.log("ERR ------>", err);
        tokenData = decodedToken;
      }
    );

    console.log("TICKET ------>", tokenData);
    const user = mapUserFromCredentials(tokenData);

    // Find if user is in database
    let dbUser = await Members.findOne({ _id: user.id });
    // console.log("user", user);

    // if user is not in database, save user to database
    let firstTimeLogin = false;

    if (!dbUser) {
      let fields = {
        _id: user.id,
        discordName: user.name,
        discordAvatar: user.picture,
        //discriminator: user.discriminator,
        registeredAt: new Date(),
        conduct: { email: user.email },
      };

      dbUser = await new Members(fields);
      dbUser.save();
      //save a connection
      // await createNode_neo4j({
      //   node: "Member",
      //   id: dbUser._id,
      //   name: dbUser.discordName,
      //   serverID: [],
      // });
      firstTimeLogin = true;
    }

    //await retrieveAndMergeServersUserIsIn(accessToken, dbUser);

    // Check if user is an operator
    let userAccess;
    if (OPERATORS.includes(dbUser._id)) {
      userAccess = ACCESS_LEVELS.OPERATOR_ACCESS;
    } else {
      userAccess = ACCESS_LEVELS.MEMBER_ACCESS;
    }

    const token = jwt.sign(
      {
        _id: dbUser._id,
        discordName: user.name,
        accessLevel: userAccess,
      },
      process.env.JWT_SECRET || "",
      {
        expiresIn: "7d",
        // expiresIn: "60s",
      }
    );

    res.json({ edenToken: token, firstTimeLogin: firstTimeLogin });
  } catch (error) {
    console.log("the error is ", error);
    res.status(500).send({ error: error.message });
  }
};

module.exports = token;
