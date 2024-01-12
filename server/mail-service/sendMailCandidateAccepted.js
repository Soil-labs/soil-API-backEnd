const sendMailCandidateAcceptedFunc = require("../utils/email/sendMailCandidateAcceptedFunc");

const sendMailCandidateAccepted = async (req, res) => {
  try {
    console.log("POST - send mail candidate accepted");

    const newMessage = await sendMailCandidateAcceptedFunc(req.body);

    res.json({ mail: newMessage });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = sendMailCandidateAccepted;
