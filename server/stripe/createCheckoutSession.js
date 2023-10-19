const jwt = require("jsonwebtoken");
const {} = require("../utils/updateUserServersInDB");
const { Company } = require("../models/companyModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async ({ body }, res, req) => {
  try {
    if (!stripe) throw Error("Stripe Checkout Session Error");
    if (!body.price_id) throw Error("price_id is required");
    if (!body.success_url) throw Error("success_url is required");
    if (!body.cancel_url) throw Error("cancel_url is required");
    if (!body.companySlug) throw Error("companySlug is required");

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
      allow_promotion_codes: true,
    });

    // console.log(session);
    const _company = await Company.findOne({ slug: body.companySlug });

    const _stripeObj = _company.stripe
      ? {
          ..._company.stripe,
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

    await Company.findOneAndUpdate(
      { slug: body.companySlug },
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
