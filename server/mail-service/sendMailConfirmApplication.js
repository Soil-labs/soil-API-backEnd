const sendMailConfirmApplicationFunc = require("../utils/email/sendMailConfirmApplicationFunc");

const sendMailConfirmApplication = async (req, res) => {
  try {
    console.log("POST - send mail confirm application");

    const newMessage = await sendMailConfirmApplicationFunc(req.body);

    res.json({ mail: newMessage });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = sendMailConfirmApplication;
