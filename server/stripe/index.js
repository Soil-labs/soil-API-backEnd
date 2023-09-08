const { Router } = require("express");
const createCheckoutSession = require("./createCheckoutSession");
const subscriptionWebhook = require("./subscriptionWebhook");

const bodyParser = require("body-parser");

const stripeRoutes = () => {
  const router = Router();

  router.post("/create-checkout-session", createCheckoutSession);

  return router;
};

const stripeWebhookRoutes = () => {
  const router = Router();

  router.post(
    "/subscription-webhook",
    bodyParser.raw({ type: "application/json" }),
    subscriptionWebhook
  );

  return router;
};

module.exports = { stripeRoutes, stripeWebhookRoutes };
