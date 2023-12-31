const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailUtil = async (msg) => {
  try {
    await sgMail.send(msg);
  } catch (error) {
    throw error;
  }
};

module.exports = sendEmailUtil;
