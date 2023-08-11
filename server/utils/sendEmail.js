const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendEmailUsingSendGrid = async (msg) => {
  try {
    await sgMail.send(msg);
    console.log("email sent");
  } catch (error) {
    console.log("error sending email ", error);
  }
};

module.exports = {
  sendEmailUsingSendGrid,
};
