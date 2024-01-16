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
  template_id: "d-2b594070083b47048247c9893bb06ff5",
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
