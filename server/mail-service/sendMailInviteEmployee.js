const sendMailInviteEmployeeFunc = require("../utils/email/sendMailInviteEmployeeFunc");

const sendMailInviteEmployee = async (req, res) => {
  try {
    console.log("POST - send mail invite employee");

    const newMessage = await sendMailInviteEmployeeFunc(req.body);

    res.json({ mail: newMessage });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = sendMailInviteEmployee;
