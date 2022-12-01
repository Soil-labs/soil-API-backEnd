const axios = require("axios");
const QueryString = require("qs");

const fetchDiscordUser = async (code, redirect_uri) => {
  if (!code) throw new Error("Invalid Code supplied");

  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = process.env;

  let data = QueryString.stringify({
    client_id: DISCORD_CLIENT_ID?.toString() || "",
    client_secret: DISCORD_CLIENT_SECRET?.toString() || "",
    grant_type: "authorization_code",
    code: code,
    scope: "identify email guilds",
    redirect_uri: redirect_uri,
  });

  const config = {
    method: "post",
    url: "https://discord.com/api/oauth2/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };

  const response = await axios(config)
    .then((res) => res.data)
    .catch((err) => {
      console.error(err.response.data);
      throw new Error(
        `Failed to get token: ${err?.response?.data?.error}`
      );
    });

    

  let { token_type, access_token } = response;

  const authResponse = await axios
    .get(`https://discord.com/api/oauth2/@me`, {
      headers: {
        authorization: `${token_type} ${access_token}`,
      },
    })
    .catch((err) => {
      console.error(err);
      throw new Error("Failed to get user");
    });
  
  

  let { user } = authResponse?.data;
  return { user, access_token } ;
};

module.exports = fetchDiscordUser;
