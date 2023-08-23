const jwt = require("jsonwebtoken");
const { Members } = require("../models/membersModel");
const fetchDiscordUser = require("./utils/fetchDiscordUser");
const {
  retrieveAndMergeServersUserIsIn,
} = require("../utils/updateUserServersInDB");
const {
  createNode_neo4j,
} = require("../neo4j/func_neo4j");
const { saveDailyLogin } = require("../utils/saveLoginData");

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const login = async ({ body }, res,req) => {
  try {
    //const { code, redirect_uri } = body;

    // get user from discord
    // const { user, access_token } = await fetchDiscordUser(
    //   code,
    //   redirect_uri
    // );
    const { accessToken } = body;

    // Verify the token from Google and extract user information
    const ticket = await client.verifyIdToken({
          idToken: accessToken,
          audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userid = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];


    // Find if user is in database
    let dbUser = await Members.findOne({ _id: userid }).select('_id name');
    console.log("user", userid, email, name, picture);

    // if user is not in database, save user to database and save the node
    if (!dbUser) {

      // let fields = {
      //   _id: user.id,
      //   discordName: user.username,
      //   discordAvatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
      //   discriminator: user.discriminator,
      //   registeredAt: new Date(),
      // };

      let fields = {
        _id: userid,
        discordName: name,
        discordAvatar: picture,
        //discriminator: user.discriminator,
        registeredAt: new Date(),
      };
      dbUser = await new Members(fields);
      dbUser.save();
      //save a connection
      createNode_neo4j({
        // await createNode_neo4j({
        node: "Member",
        id: dbUser._id,
        name: dbUser.discordName,
        serverID: [],
      });
    }

    // Generate auth token
    // const token = jwt.sign(
    //   { _id: dbUser._id, discordName: user.username },
    //   process.env.JWT_SECRET || "",
    //   {
    //     expiresIn: "7d",
    //   }
    // );

    const token = jwt.sign(
      { _id: dbUser._id, discordName: name },
      process.env.JWT_SECRET || "",
      {
        expiresIn: "7d",
      }
    );

    console.log("auth token", token);

    //await retrieveAndMergeServersUserIsIn(access_token, dbUser);

    //save the daily login detail🧷 
    // saveDailyLogin(dbUser._id, new Date())

    
    // Return user and token
    res.json({ discord_user: dbUser, eden_user: dbUser, token });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
module.exports = login;
