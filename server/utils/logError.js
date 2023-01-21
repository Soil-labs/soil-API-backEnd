const { ErrorLog } = require("../models/error");
const colors = require("colors");

const logError = async (error) => {
  try {
    const errorObj = {
      name: error.name,
      code: error.extensions.code || "Not given",
      component: error.path?.join("/"),
      message: error.message,
      stacktrace: error.extensions.exception.stacktrace.slice(0, 3),
    };

    if (error.extensions?.user) errorObj.user = error.extensions.user;

    // console.log(`${error.name}:`.red, errorObj);

    // logging for db in production
    if (process.env.NODE_ENV === "production") {
      const newError = new ErrorLog(errorObj);
      await newError.save();
      // console.log('error logged to database'.yellow);
    }
    return error;
  } catch (err) {
    // console.log(err);
  }
};

const customErrorObject = (user, component) => {
  return {
    component,
    user: user?.name || user?.email || "user not logged in",
  };
};

module.exports = { logError, customErrorObject };
