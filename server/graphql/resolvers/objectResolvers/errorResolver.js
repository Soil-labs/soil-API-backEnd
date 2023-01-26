const { Members } = require("../../../models/membersModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  ErrorLog: {
    memberInfo: async (parent, args, context, info) => {
      // console.log("parent = " , parent)

      try {
        const memberID = parent.memberID;

        const memberData = await Members.findOne({ _id: memberID });

        return memberData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "userResolver > members",
            user: context.req.user?._id,
          }
        );
      }
    },
  },
};
