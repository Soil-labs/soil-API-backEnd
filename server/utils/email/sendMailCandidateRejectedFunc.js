const sendEmailUtil = require("./sendEmail");

const msg = {
  from: { email: "eloi@joineden.ai", name: "Eden" },
  personalizations: [
    {
      to: [{ email: "" }],
      dynamic_template_data: {
        candidateName: "",
        jobTitle: "",
        companyName: "",
        message: "",
      },
    },
  ],
  template_id: "d-de6919280c4242c3958a044807fcce5d",
};

const sendMailCandidateRejectedFunc = async (msgData) => {
  try {
    const { mailTo, candidateName, jobTitle, companyName, message } = msgData;

    const newMessage = {
      ...msg,
      personalizations: [
        {
          to: [{ email: mailTo }],
          dynamic_template_data: {
            candidateName: candidateName,
            jobTitle: jobTitle,
            companyName: companyName,
            message: message,
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

module.exports = sendMailCandidateRejectedFunc;
