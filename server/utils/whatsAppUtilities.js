const axios = require("axios");
const {
  WHATSAPP_API_URL,
  WHATSAPP_MEDIA_API,
  WHATSAPP_IdInstance,
  WHATSAPP_ApiTokenInstance,
} = process.env;

//messageType = { groupMessage, chatMessage }
const sendWhatsAppMessage = async (phoneNumber, message, messageType) => {
  const baseURL = `${WHATSAPP_API_URL}/waInstance${WHATSAPP_IdInstance}/sendMessage/${WHATSAPP_ApiTokenInstance}`;
  let chatType = null;
  if (!messageType) {
    chatType = "@c.us";
  } else if (messageType == "groupMessage") {
    chatType = "@g.us";
  } else {
    chatType = "@c.us";
  }

  let res = await axios({
    method: "POST",
    data: {
      chatId: `${phoneNumber}${chatType}`,
      message: `${message}`,
    },
    url: baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });
  const messageID = res.data;
  console.log("message ID ", messageID);
  return messageID;
};

module.exports = {
  sendWhatsAppMessage,
};
