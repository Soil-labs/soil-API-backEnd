const sendEmailUtil = require("./sendEmail");

const msg = {
  from: { email: "eloi@joineden.ai", name: "Eden" },
  personalizations: [
    {
      to: [{ email: "" }],
      dynamic_template_data: {
        companyName: "",
        inviteUrl: "",
      },
    },
  ],
  template_id: "d-8bc7987ec42c4a41ac964733bd4d4669",
};

const sendMailInviteEmployeeFunc = async (msgData) => {
  try {
    const { mailTo, companyName, inviteUrl } = msgData;

    const mailToArray =
      typeof mailTo === "string"
        ? [{ email: mailTo }]
        : mailTo.map((_email) => ({ email: _email }));

    const newMessage = {
      ...msg,
      personalizations: [
        {
          to: mailToArray,
          dynamic_template_data: {
            companyName: companyName,
            inviteUrl: inviteUrl,
          },
        },
      ],
    };

    await sendEmailUtil(newMessage);

    return newMessage;
  } catch (error) {
    throw error;
  }
};

module.exports = sendMailInviteEmployeeFunc;
