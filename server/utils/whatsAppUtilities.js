const { twilioClient } = require("./twilioClient");

const sendMessagessFromWhatsAppUsingTwilio = async (from, to, body) => {
  try {
    const message = await twilioClient.messages.create({
      body,
      to,
      from,
    });
    console.log(message);
    return message;
  } catch (error) {
    console.log("error from sending ", error);
  }
};

module.exports = {
  sendMessagessFromWhatsAppUsingTwilio,
};
