const sendEmailUtil = require("./sendEmail");

const msg = {
  from: { email: "notifications@joineden.xyz", name: "Eden" },
  personalizations: [
    {
      to: [{ email: "" }],
      dynamic_template_data: {
        candidateName: "",
        jobTitle: "",
        companyName: "",
        applicationSubmittedUrl: "",
      },
    },
  ],
  template_id: "d-b0fed05d5d334e60b63776e0149e81b8",
};

const sendNewApplicantMailFunc = async (msgData) => {
  try {
    const {
      mailTo,
      candidateName,
      jobTitle,
      companyName,
      recommendUrl,
      applicationSubmittedUrl,
    } = msgData;

    const newMessage = {
      ...msg,
      personalizations: [
        {
          to: [{ email: mailTo }],
          dynamic_template_data: {
            candidateName: candidateName,
            jobTitle: jobTitle,
            companyName: companyName,
            recommendUrl: recommendUrl,
            applicationSubmittedUrl: applicationSubmittedUrl,
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
