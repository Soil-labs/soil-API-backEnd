const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Members } = require("../models/membersModel");
const {
  retrieveAndMergeServersUserIsIn,
} = require("../utils/updateUserServersInDB");
const { createNode_neo4j } = require("../neo4j/func_neo4j");
const { ACCESS_LEVELS, OPERATORS } = require("./constants");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const token = async ({ body }, res) => {
  try {
    const { accessToken } = body;
    console.log("start accessing the token here ", accessToken);
    console.log("process.env.GOOGLE_CLIENT_ID ", process.env.GOOGLE_CLIENT_ID);
    // Verify the token from Google and extract user information
    const ticket = await client
      .verifyIdToken({
        idToken: accessToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      .catch((err) => {
        console.log(err);
      });
    // console.log("the ticket is ", ticket);

    if (!accessToken) throw new Error("Invalid Token supplied");
    // const authResponse = await axios
    //   .get(`https://discord.com/api/oauth2/@me`, {
    //     headers: {
    //       authorization: `Bearer ${accessToken}`,
    //     },
    //   })
    //   .catch((err) => {
    //     throw new Error("Failed to get user");
    //   });

    //let { user } = authResponse?.data;

    const payload = ticket.getPayload();
    // console.log("payload is ", payload);
    const userid = payload["sub"];
    const email = payload["email"];
    const name = payload["name"];
    const picture = payload["picture"];

    // Find if user is in database
    let dbUser = await Members.findOne({ _id: userid });
    // console.log("user", user);

    // if user is not in database, save user to database
    if (!dbUser) {
      let fields = {
        _id: userid,
        discordName: name,
        discordAvatar: picture,
        //discriminator: user.discriminator,
        registeredAt: new Date(),
        conduct: { email: email },
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
        discordName: name,
        accessLevel: userAccess,
      },
      process.env.JWT_SECRET || "",
      {
        expiresIn: "7d",
        // expiresIn: "60s",
      }
    );

    res.json({ edenToken: token });
  } catch (error) {
    console.log("the error is ", error);
    res.status(500).send({ error: error.message });
  }
};

module.exports = token;
