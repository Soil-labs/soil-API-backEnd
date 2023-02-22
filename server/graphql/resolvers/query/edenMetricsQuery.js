const { EdenMetrics } = require("../../../models/edenMetrics");
const { Members } = require("../../../models/membersModel");
const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");

module.exports = {
  membersStats: async (parent, args, context, info) => {
    try {
      const { startDate, endDate, range } = args.fields;
      if (!startDate && !endDate)
        throw new ApolloError("The start period and end period is required");
      let start = new Date(startDate * 1000);
      let end = new Date(endDate * 1000);

      if (range == "months") {
        const countArray = await Members.aggregate([
          {
            $match: {
              registeredAt: {
                $gte: start,
                $lte: end,
              },
            },
          },

          {
            $project: {
              month: { $month: "$registeredAt" },
              year: { $year: "$registeredAt" },
            },
          },

          {
            $group: {
              _id: {
                month: "$month",
                year: "$year",
              },
              count: { $sum: 1 },
            },
          },

          {
            $project: {
              _id: 0,
              date: {
                month: "$_id.month",
                year: "$_id.year",
              },
              count: "$count",
            },
          },
          {
            $sort: {"date.month": 1}
          }
        ]);
        console.log("count of months ", countArray);
        return countArray;
      } else {
        const countArray = await Members.aggregate([
          {
            $match: {
              registeredAt: {
                $gte: start,
                $lte: end,
              },
            },
          },

          {
            $project: {
              dayOfMonth: { $dayOfMonth: "$registeredAt" },
              month: { $month: "$registeredAt" },
              year: { $year: "$registeredAt" },
            },
          },

          {
            $group: {
              _id: {
                dayOfMonth: "$dayOfMonth",
                month: "$month",
                year: "$year",
              },
              count: { $sum: 1 },
            },
          },

          {
            $project: {
              _id: 0,
              date: {
                day: "$_id.dayOfMonth",
                month: "$_id.month",
                year: "$_id.year",
              },
              count: "$count",
            },
          },
          {
            $sort: {"date.month": 1, "date.day": 1}
          }
        ]);
        console.log("count of months ", countArray);
        return countArray;
      }
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
  lurkersContributorsQuery: async (parent, args, context, info) => {
    try {
      const contributors = await EdenMetrics.countDocuments();
      const totalMembers = await Members.countDocuments();

      const lurkers = +totalMembers - +contributors;

      return {
        lurkers,
        contributors,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "lurkersContributorsQuery",
        {
          component: "edenMetricsQuery > lurkersContributorsQuery",
        }
      );
    }
  },
  activeMembersStats: async (parent, args, context, info) => {
    const { startDate, endDate, range } = args.fields;
    let start = new Date(startDate * 1000);
    let end = new Date(endDate * 1000);

    console.log("start date ", start);
    console.log("end date ", end);
    //range = day| month | week
    try {
      if (range == "months") {
        const countArray = await EdenMetrics.aggregate([
          {
            $match: {
              activeUserLogin: {
                $elemMatch: {
                  date: {
                    $gte: start,
                    $lte: end,
                  },
                },
              },
            },
          },
          {
            $unwind: "$activeUserLogin",
          },

          {
            $project: {
              month: { $month: "$activeUserLogin.date" },
              year: { $year: "$activeUserLogin.date" },
            },
          },

          {
            $group: {
              _id: {
                month: "$month",
                year: "$year",
              },
              count: { $sum: 1 },
            },
          },

          {
            $project: {
              _id: 0,
              date: {
                month: "$_id.month",
                year: "$_id.year",
              },
              count: "$count",
            },
          },
        ]);
        console.log("count of months ", countArray);
        return countArray;
      }
      const countArray = await EdenMetrics.aggregate([
        {
          $match: {
            activeUserLogin: {
              $elemMatch: {
                date: {
                  $gte: start,
                  $lte: end,
                },
              },
            },
          },
        },
        {
          $unwind: "$activeUserLogin",
        },

        {
          $project: {
            dayOfMonth: { $dayOfMonth: "$activeUserLogin.date" },
            month: { $month: "$activeUserLogin.date" },
            year: { $year: "$activeUserLogin.date" },
          },
        },

        {
          $group: {
            _id: {
              dayOfMonth: "$dayOfMonth",
              month: "$month",
              year: "$year",
            },
            count: { $sum: 1 },
          },
        },

        {
          $project: {
            _id: 0,
            date: {
              day: "$_id.dayOfMonth",
              month: "$_id.month",
              year: "$_id.year",
            },
            count: "$count",
          },
        },
      ]);

      console.log("count ", countArray);
      return countArray;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "activeUsersLoginQuery",
        {
          component: "edenMetricsQuery > activeUsersLoginQuery",
        }
      );
    }
  },
};
