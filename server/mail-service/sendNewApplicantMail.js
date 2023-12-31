const sendNewApplicantMailFunc = require("../utils/email/sendNewApplicantMailFunc");

const sendNewApplicantMail = async (req, res) => {
  try {
    console.log("POST - send mail new applicant");

    const newMessage = await sendNewApplicantMailFunc(req.body);

    res.json({ mail: newMessage });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = sendNewApplicantMail;
