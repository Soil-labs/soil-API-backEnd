const sendEmailUtil = require("./sendEmail");

const msg = {
  from: { email: "eloi@joineden.ai", name: "Eden" },
  personalizations: [
    {
      to: [{ email: "" }],
      dynamic_template_data: {
        hiringManagerName: "",
        jobTitle: "",
        candidateName: "",
        dashboardUrl: "",
      },
    },
  ],
  template_id: "d-b2e14fb93f014e29b7179d5e3a7cc575",
};

const sendNewApplicantMailFunc = async (msgData) => {
  try {
    const { mailTo, hiringManagerName, jobTitle, candidateName, dashboardUrl } =
      msgData;

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
            hiringManagerName: hiringManagerName,
            jobTitle: jobTitle,
            candidateName: candidateName,
            dashboardUrl: dashboardUrl,
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

module.exports = sendNewApplicantMailFunc;
