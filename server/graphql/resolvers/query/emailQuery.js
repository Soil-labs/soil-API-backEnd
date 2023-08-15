const { ApolloError } = require("apollo-server-express");

const { sendEmailUsingSendGrid } = require("../../../utils/sendEmail");

module.exports = {
  sendEmailViaSendGrid: async (parent, args, context, info) => {
    const { text, to, subject, html, from } = args.fields;
    console.log("Query > sendEmailUsingSendGrid > args.fields = ", args.fields);

    if (!from || !to || !subject || !text) {
      throw new Error(
        "The fields to, from, subject and text are required fields"
      );
    }

    let msg = {
      to,
      from,
      subject,
      text,
    };

    if (html) {
      msg.html = html;
    }

    try {
      await sendEmailUsingSendGrid(msg);
      return true;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "sendEmailViaSendGrid",
        { component: "emailQuery > sendEmailViaSendGrid" }
      );
    }
  },
};
