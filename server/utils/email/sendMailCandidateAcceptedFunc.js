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
        url: "",
      },
    },
  ],
  template_id: "d-b0fed05d5d334e60b63776e0149e81b8",
};

const sendMailCandidateAcceptedFunc = async (msgData) => {
  try {
    const { mailTo, candidateName, jobTitle, companyName, message, url } =
      msgData;

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
            url: url,
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

module.exports = sendMailCandidateAcceptedFunc;
