const { Router } = require("express");

const sendNewApplicantMail = require("./sendNewApplicantMail");

// @TODO make this a standalone microservice
const mailServiceRoutes = () => {
  const router = Router();

  router.post("/send-new-applicant-mail", sendNewApplicantMail);

  return router;
};

module.exports = { mailServiceRoutes };
