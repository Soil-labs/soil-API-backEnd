const { ApolloError } = require("apollo-server-express");
const { sendWhatsAppMessage } = require("../../../utils/whatsAppUtilities");

module.exports = {
  sendWhatsAppTextMessage: async (parent, args, context, info) => {
    const { phoneNumber, message, messageType } = args.fields;
    console.log(
      "Query > sendWhatsAppTextMessage > args.fields = ",
      args.fields
    );

    if (!phoneNumber || !message) {
      throw new ApolloError("The phone number and message is required");
    }

    try {
       const messageID = await sendWhatsAppMessage(phoneNumber, message, messageType);
       return messageID;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "findChat", {
        component: "whatsAppQuery > sendWhatsAppTextMessage",
      });
    }
  },
};
