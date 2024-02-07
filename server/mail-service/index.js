const { Router } = require("express");

const sendNewApplicantMail = require("./sendNewApplicantMail");
const sendMailConfirmApplication = require("./sendMailConfirmApplication");
// const sendMailCandidateAccepted = require("./sendMailCandidateAccepted");
// const sendMailCandidateRejected = require("./sendMailCandidateRejected");
const sendMailInviteEmployee = require("./sendMailInviteEmployee");

// @TODO make this a standalone microservice
const mailServiceRoutes = () => {
  const router = Router();

  router.post("/send-new-applicant-mail", sendNewApplicantMail);
  router.post("/send-mail-confirm-application", sendMailConfirmApplication);
  // router.post("/send-mail-candidate-accepted", sendMailCandidateAccepted);
  // router.post("/send-mail-candidate-rejected", sendMailCandidateRejected);
  router.post("/send-mail-invite-employee", sendMailInviteEmployee);

  return router;
};

module.exports = { mailServiceRoutes };
