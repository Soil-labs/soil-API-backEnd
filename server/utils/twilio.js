const sgMail = require("@sendgrid/mail");

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.TWILIO_TOKEN;
const client = require("twilio")(accountSid, authToken);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMessageToClient = (number, message) => {
  client.messages
    .create({
      body: message,
      messagingServiceSid: "MG927b44ae2146fe171dcbf9d8624494c1",
      to: `+48${number}`,
    })
    .then((message) => console.log(message.sid))
    .done();
};

const sendPassChange = (address, message, creatingUser = false) => {
  addresses = [address];
  if (creatingUser) addresses.push("platform@finseka.pl");
  const msg = {
    to: addresses, // TODO: remove the test email for production
    from: "platform@finseka.pl",
    subject: "Your password has been set",
    ...message,
  };

  //ES8
  (async () => {
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  })();
};

module.exports = { sendPassChange, sendMessageToClient };
