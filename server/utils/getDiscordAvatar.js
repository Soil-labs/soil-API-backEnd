const { Members } = require("../models/membersModel");
const axios = require("axios");

const { DISCORD_BOT_TOKEN } = process.env;
const ImageBaseURL = "https://cdn.discordapp.com";

const _retrieveAvatarHash = (avatar) => {
  if (avatar) {
    const index = avatar.lastIndexOf("/");
    const hash = avatar.substring(index + 1).split(".")[0];
    return hash;
  }
};

const updateAvatar = async (avatar, discordID) => {
  if (avatar) {
    await Members.findOneAndUpdate(
      {
        _id: discordID,
      },

      {
        $set: { discordAvatar: avatar },
      },

      { new: true }
    );
  }
};

const getDiscordAvatar = async (discordID) => {
  const baseURL = `https://discord.com/api/v10/users/${discordID}`;
  let res = await axios({
    method: "GET",
    url: baseURL,
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
  });

  const jsonData = res.data;
  const { avatar } = jsonData;
  return avatar;
};

const cronFunctionToUpdateAvatar = async () => {
  //get members
  const members = await Members.find({});
  //loop through members toArray
  for (let i = 0; i < members.length; i++) {
    const { _id, discordAvatar } = members[i];
    const oldAvatar = _retrieveAvatarHash(discordAvatar);
    const currentAvatar = await getDiscordAvatar(_id);
    if (currentAvatar && oldAvatar != currentAvatar) {
      //perform the update here
      const newAvatar = `${ImageBaseURL}/avatars/${_id}/${currentAvatar}.png`;
      console.log("the new avatar is ", newAvatar);
      await updateAvatar(newAvatar, _id);
    }
  }
};

module.exports = {
  cronFunctionToUpdateAvatar,
};
