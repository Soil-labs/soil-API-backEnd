

const init = ({ query }, res ) => {
  const BASE_URL = "https://discord.com/api/oauth2/authorize";
  let { redirect_uri } = query;
  const params = new URLSearchParams();
  params.append("client_id", process.env.DISCORD_CLIENT_ID?.toString() || "");
  params.append("redirect_uri", redirect_uri?.toString() || "");
  params.append("response_type", "code");
  params.append("scope", "identify");

  res.send({ loginUrl: `${BASE_URL}?${params.toString()}` });
};

module.exports = init;
