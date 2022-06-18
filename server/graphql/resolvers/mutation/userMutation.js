const { User } = require("../../../models/user");
const short = require("short-uuid");
const {
  AuthenticationError,
  ApolloError,
  UserInputError,
} = require("apollo-server-express");
const {
  sendPassChange,
  sendMessageToClient,
} = require("../../../utils/twilio");

const client = require("../../../elastic_config")

const { checkAccess } = require("../../../utils/checkAccess");
const authorize = require("../../../utils/isAuth");
const { now } = require("mongoose");
require("dotenv").config();

const accessOrder = {
  superAdmin: 4,
  admin: 3,
  regular: 2,
  junior: 1,
};


module.exports = {
  
  // deleteAllUsers: async (parent, args, context, info) => {
  //   const { req } = context;

  //   try {
  //     const deletedUsers = await User.deleteMany();

  //     return deletedUsers.deletedCount;
  //   } catch (err) {
  //     throw new ApolloError(err.message);
  //   }
  // },

};
