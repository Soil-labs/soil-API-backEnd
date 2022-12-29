const { Members } = require("../models/membersModel");
const { ServerTemplate } = require("../models/serverModel");
const axios = require("axios");

const DISCORD_BASE_URL = "https://discord.com/api/v10";

//get all servers the bot is 💠
const getServersBotsIn = async () => {
  const servers = await ServerTemplate.find({});
  return servers;
};

// get the servers the login user is a member of
const _getServersLoginUserIn = async (access_token) => {
  const res = await axios
    .get(`${DISCORD_BASE_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
    .catch((error) => {
      console.log("error", error);
      throw new Error("Failed to get user guilds");
    });

  const serversArray = res.data;
  // console.log("servers array ", serversArray);
  return serversArray;
};

// compare and save the common servers into the database using updateMember function

const _updateUserServerField = async (dbUser, commonServers) => {
  const previousServers = dbUser.serverID ? dbUser.serverID : [];
  const uniqueServers = new Set([...previousServers, ...commonServers]);
  const newServers = Array.from(uniqueServers);

  // console.log("new servers", newServers);
  await Members.findOneAndUpdate(
    { _id: dbUser._id },
    {
      $set: {
        serverID: newServers,
      },
    }
  );
};

const retrieveAndMergeServersUserIsIn = async (accessToken, dbUser) => {
  try {
    const userServersArray = await _getServersLoginUserIn(accessToken);
    const botServersArray = await getServersBotsIn();
    const commonServers = [];
    botServersArray.map(({ _id }) => {
      if (userServersArray.some((el) => el.id === _id)) {
        if (!commonServers.includes(_id)) {
          commonServers.push(_id);
        }
      }
    });
    console.log("common servers ", commonServers);
    await _updateUserServerField(dbUser, commonServers);
    //update the user profile with the servers
  } catch (error) {
    console.log("Error ", error);
  }
};

module.exports = { retrieveAndMergeServersUserIsIn };
