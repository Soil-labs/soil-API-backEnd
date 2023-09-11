const jwt = require("jsonwebtoken");
const {} = require("../utils/updateUserServersInDB");
const { Members } = require("../models/membersModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async ({ body }, res, req) => {
  try {
    if (!stripe) throw Error("Stripe Checkout Session Error");
    if (!body.price_id) throw Error("price_id is required");
    if (!body.success_url) throw Error("success_url is required");
    if (!body.cancel_url) throw Error("cancel_url is required");
    if (!body.userid) throw Error("userid is required");

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: body.price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${body.success_url}?success=true`,
      cancel_url: `${body.cancel_url}?canceled=true`,
      automatic_tax: { enabled: true },
    });

    // console.log(session);
    const _member = await Members.findOne({ _id: body.userid });

    const _stripeObj = _member.stripe
      ? {
          ..._member.stripe,
          session: {
            ID: session.id,
          },
          // product: { ID: "" },
        }
      : {
          session: {
            ID: session.id,
          },
          // product: { ID: "" },
        };

    await Members.findOneAndUpdate(
      { _id: body.userid },
      {
        stripe: _stripeObj,
      }
    );

    res.send(200, session.url);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

module.exports = createCheckoutSession;
