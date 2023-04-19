const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Members } = require("../models/membersModel");
const {
  retrieveAndMergeServersUserIsIn,
} = require("../utils/updateUserServersInDB");
const { createNode_neo4j } = require("../neo4j/func_neo4j");
const { ACCESS_LEVELS, OPERATORS } = require("./constants");

const token = async ({ body }, res) => {
  try {
    const { accessToken } = body;

    if (!accessToken) throw new Error("Invalid Token supplied");
    const authResponse = await axios
      .get(`https://discord.com/api/oauth2/@me`, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })
      .catch((err) => {
        throw new Error("Failed to get user");
      });

    let { user } = authResponse?.data;


    // Find if user is in database
    let dbUser = await Members.findOne({ _id: user.id });
    // console.log("user", user);

    // if user is not in database, save user to database
    if (!dbUser) {
      let fields = {
        _id: user.id,
        discordName: user.username,
        discordAvatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
        discriminator: user.discriminator,
        registeredAt: new Date(),
      };
      dbUser = await new Members(fields);
      dbUser.save();
      //save a connection
      await createNode_neo4j({
        node: "Member",
        id: dbUser._id,
        name: dbUser.discordName,
        serverID: [],
      });
    }

    await retrieveAndMergeServersUserIsIn(accessToken, dbUser);

    // Check if user is an operator
    if (OPERATORS.includes(user.id)) {
      user.accessLevel = ACCESS_LEVELS.OPERATOR_ACCESS;
    } else {
      user.accessLevel = ACCESS_LEVELS.MEMBER_ACCESS;
    }

    const token = jwt.sign(
      {
        _id: user.id,
        discordName: user.username,
        accessLevel: user.accessLevel,
      },
      process.env.JWT_SECRET || "",
      {
        expiresIn: "7d",
      }
    );

    res.json({ edenToken: token });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = token;
