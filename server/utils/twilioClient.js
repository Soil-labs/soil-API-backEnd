const { TwILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

const twilioClient = require("twilio")(TwILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

module.exports = { twilioClient };
