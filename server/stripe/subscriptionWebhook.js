const jwt = require("jsonwebtoken");
const {} = require("../utils/updateUserServersInDB");
const { Members } = require("../models/membersModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const fulfillOrder = async (session) => {
  const _session = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
  });

  await Members.findOneAndUpdate(
    {
      stripe: {
        session: {
          ID: session.id,
        },
      },
    },
    {
      stripe: {
        customerID: session.customer,
        product: {
          ID: _session.line_items.data[0].price.product,
        },
      },
    }
  );
};

const createOrder = (session) => {
  // TODO: fill me in
  console.log("Creating order", session);
};

const emailCustomerAboutFailedPayment = (session) => {
  // TODO: fill me in
  console.log("Emailing customer", session);
};

const subscriptionWebhook = async (req, res) => {
  const payload = req.body;
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Save an order in your database, marked as 'awaiting payment'
      createOrder(session);

      // Check if the order is paid (for example, from a card payment)
      //
      // A delayed notification payment will have an `unpaid` status, as
      // you're still waiting for funds to be transferred from the customer's
      // account.
      if (session.payment_status === "paid") {
        fulfillOrder(session);
      }

      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;

      // Fulfill the purchase...
      fulfillOrder(session);

      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object;

      // Send an email to the customer asking them to retry their order
      emailCustomerAboutFailedPayment(session);

      break;
    }
  }

  res.status(200).end();
};

module.exports = subscriptionWebhook;
