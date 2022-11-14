const { ServerTemplate } = require("../models/serverModel");
const axios = require("axios");

const { DISCORD_BOT_TOKEN2 } = process.env;
const ImageBaseURL = "https://cdn.discordapp.com";


const sleepABit = (ms) => new Promise((res) => setTimeout(res, ms));

const _retrieveAvatarHash = (icon) => {
  if (icon) {
    const index = icon.lastIndexOf("/");
    const hash = icon.substring(index + 1).split(".")[0];
    return hash;
  }
};

const updateServerIcon = async (icon, serverID) => {
  if (icon) {
    await ServerTemplate.findOneAndUpdate(
      {
        _id: serverID,
      },

      {
        $set: { serverAvatar: icon },
      },

      { new: true }
    );
  }
};

const getDiscordIconAvatar = async (serverID) => {
  const baseURL = `https://discord.com/api/v10/guilds/${serverID}`;
  try {
    let res = await axios({
      method: "GET",
      url: baseURL,
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN2}`,
      },
    });
    const jsonData = res.data;
    console.log("json data", jsonData)
    const { icon } = jsonData;
    return icon;
  } catch (error) {
    console.log("error getting guild icon ", error);
  }
};

const cronJobToUpdateServerIcon = async () => {
  //get servers
  const servers = await ServerTemplate.find({});
  //loop through servers toArray
  for (let i = 0; i < servers.length; i++) {
    const { _id, serverAvatar } = servers[i];
    const oldAvatar = _retrieveAvatarHash(serverAvatar);
    const currentAvatar = await getDiscordIconAvatar(_id);
    console.log("old server icon", oldAvatar);
    console.log("current server icon", currentAvatar);
    await sleepABit(2000);
    if (currentAvatar && oldAvatar != currentAvatar ) {
      //perform the update here
      const newIcon = `${ImageBaseURL}/icons/${_id}/${currentAvatar}.png`;
      console.log("the new icon is ", newIcon);
      await updateServerIcon(newIcon, _id);
    }
  }
};

module.exports = {
  cronJobToUpdateServerIcon,
};
