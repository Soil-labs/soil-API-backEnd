const { EdenMetrics } = require("../../../models/edenMetrics");
const { Members } = require("../../../models/membersModel");
const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");

module.exports = {
  newMemberStats: async (parent, args, context, info) => {
    try {
      const { startPeriod, endPeriod } = args.fields;
      if (!startPeriod && !endPeriod)
        throw new ApolloError("The start period and end period is required");

      const usersCount = await Members.countDocuments({
        registeredAt: {
          $gte: new Date(startPeriod),
          $lte: new Date(endPeriod),
        },
      });
      console.log("member number : ", usersCount);
      return +usersCount;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "newMemberStats",
        {
          component: "edenMetricsQuery > newMemberStats",
        }
      );
    }
  },
  activeMembersStats: async (parent, args, context, info) => {
    try {
      const { startPeriod, endPeriod } = args.fields;
      if (!startPeriod && !endPeriod)
        throw new ApolloError("The start period and end period is required");

      const usersCount = await Members.countDocuments({
        $and: [
          { bio: { $ne: null } },
          {
            registeredAt: {
              $gte: new Date(startPeriod),
              $lte: new Date(endPeriod),
            },
          },
        ],
      });

      console.log("active members number : ", usersCount);
      return +usersCount;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "newMemberStats",
        {
          component: "edenMetricsQuery > newMemberStats",
        }
      );
    }
  },
};
