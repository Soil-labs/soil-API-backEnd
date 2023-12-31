const { Router } = require("express");

const sendNewApplicantMail = require("./sendNewApplicantMail");
const sendMailConfirmApplication = require("./sendMailConfirmApplication");

// @TODO make this a standalone microservice
const mailServiceRoutes = () => {
  const router = Router();

  router.post("/send-new-applicant-mail", sendNewApplicantMail);
  router.post("/send-mail-confirm-application", sendMailConfirmApplication);

  return router;
};

module.exports = { mailServiceRoutes };
