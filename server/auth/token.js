const axios = require("axios");
const jwt = require("jsonwebtoken");
const { Members } = require("../models/membersModel");
const {
  retrieveAndMergeServersUserIsIn,
} = require("../utils/updateUserServersInDB");

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
        discordName: user.name,
        avatar: user.avatar,
        discriminator: user.discriminator,
        registeredAt: new Date(),
      };
      dbUser = await new Members(fields);
    }

    await retrieveAndMergeServersUserIsIn(accessToken, dbUser);

    const token = jwt.sign(
      { _id: user.id, discordName: user.username },
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
