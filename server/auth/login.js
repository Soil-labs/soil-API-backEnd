const jwt = require("jsonwebtoken");
const { Members } = require("../models/membersModel");
const fetchDiscordUser = require("./utils/fetchDiscordUser");

const login = async ({ body }, res) => {
  try {
    const { code, redirect_uri } = body;

    // get user from discord
    const user = await fetchDiscordUser(code, redirect_uri);
    // Find if user is in database
    let dbUser = await Members.findOne({ _id: user.id });
    console.log("user", user)
    console.log({ dbUser });

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

    // Generate auth token
    const token = jwt.sign(
      { _id: dbUser._id, discordName: user.username },
      process.env.JWT_SECRET || "",
      {
        expiresIn: "7d",
      }
    );

    console.log("auth token", token)

    // Return user and token
    res.json({ discord_user: user, eden_user: dbUser, token });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
module.exports = login;
