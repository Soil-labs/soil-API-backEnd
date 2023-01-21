const { ErrorLog } = require("../../../models/error");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  createError: async (parent, args, context, info) => {
    const {
      errorType,

      name,
      code,
      component,
      message,
      stacktrace,

      memberID,
      url,
      path,
    } = args.fields;
    console.log("Mutation > createError > args.fields = ", args.fields);

    // if (!_id) throw new ApolloError("_id -> serverID is required");

    // if (!title) throw new ApolloError( "title is required");

    let fields = {
      createdAt: new Date(),
    };

    if (errorType) fields.errorType = errorType;
    if (name) fields.name = name;
    if (code) fields.code = code;
    if (component) fields.component = component;
    if (message) fields.message = message;
    if (stacktrace) fields.stacktrace = stacktrace;

    if (memberID) fields.memberID = memberID;
    if (url) fields.url = url;
    if (path) fields.path = path;

    try {
      const newError = new ErrorLog(fields);
      await newError.save();

      return newError;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember" }
      );
    }
  },
};
