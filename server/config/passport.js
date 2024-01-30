const passport = require("passport");
const { DynamicStrategy } = require("@dynamic-labs/passport-dynamic");

// passport.serializeUser(function (user, cb) {
//   cb(null, user);
// });

const options = {
  publicKey: process.env.DYNAMIC_PUBLIC_KEY,
};

const strategy = new DynamicStrategy(options, (payload, done) => {
  try {
    const user = { id: 1, email: "hello@example.com" };

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
});

passport.use(strategy);
