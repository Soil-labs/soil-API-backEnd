const sendMailCandidateRejectedFunc = require("../utils/email/sendMailConfirmApplicationFunc");

const sendMailCandidateRejected = async (req, res) => {
  try {
    console.log("POST - send mail candidate rejected");

    const newMessage = await sendMailCandidateRejectedFunc(req.body);

    res.json({ mail: newMessage });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = sendMailCandidateRejected;
