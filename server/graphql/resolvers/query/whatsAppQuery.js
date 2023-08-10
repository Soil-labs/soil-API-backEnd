const { ApolloError } = require("apollo-server-express");

const {
  sendMessagessFromWhatsAppUsingTwilio,
} = require("../../../utils/whatsAppUtilities");

module.exports = {
  sendWhatsAppMessage: async (parent, args, context, info) => {
    const { from, to, body } = args.fields;
    console.log("Query > sendWhatsAppMessage > args.fields = ", args.fields);

    if (!from || !to || !body) {
      throw new Error(
        "The message body, the to phone number and the from number are required"
      );
    }

    try {
      const message = await sendMessagessFromWhatsAppUsingTwilio(
        from,
        to,
        body
      );
      return true;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "sendWhatsAppMessage",
        { component: "whatsappQuery > sendWhatsappMessage" }
      );
    }
  },
};
