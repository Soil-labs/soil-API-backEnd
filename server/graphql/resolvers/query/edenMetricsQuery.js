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
            $sort: { "date.month": 1 },
          },
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
            $sort: { "date.month": 1, "date.day": 1 },
          },
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

  activeUsersQueryStats: async (parent, args, context, info) => {
    try {
      //daily - weekly - monthly
      const { startDate, endDate, range } = args.fields;
      let start = new Date(startDate * 1000);
      let end = new Date(endDate * 1000);
      if (range === "daily" || range === "weekly") {
        let stop = startDate * 1000 + 86400000;
        let stopDailyDate = range === "daily" ? new Date(stop) : end;

        const count = await EdenMetrics.aggregate([
          {
            $match: {
              actions: {
                $elemMatch: {
                  actionDate: {
                    $gte: start,
                    $lt: stopDailyDate,
                  },
                },
              },
            },
          },

          {
            $unwind: "$actions",
          },

          {
            $match: {
              "actions.actionDate": { $gte: start, $lt: stopDailyDate },
            },
          },

          {
            $group: {
              _id: {
                member: "$memberID",
                date: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$actions.actionDate",
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: { a: "$_id.member", date: "$_id.date" },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: "$_id.date",
              count: { $sum: "$count" },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              count: 1,
            },
          },

          {
            $sort: { date: 1 },
          },
        ]);

        console.log("count data ", count);
        return count;
      } else if (range === "months") {
        const count = await EdenMetrics.aggregate([
          {
            $match: {
              actions: {
                $elemMatch: {
                  actionDate: {
                    $gte: start,
                    $lt: end,
                  },
                },
              },
            },
          },
          {
            $unwind: "$actions",
          },
          {
            $match: {
              "actions.actionDate": { $gte: start, $lt: end },
            },
          },

          {
            $group: {
              _id: {
                member: "$memberID",
                date: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$actions.actionDate",
                  },
                },
              },
            },
          },


          {
            $group: {
              _id: {
                member: "$_id.memberID",
                month: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: { $toDate: "$_id.date"},
                  },
                },
              },
              count : { $sum : 1}
            },
          },
          // {
          //   $group: {
          //     _id: { a: "$_id.member", month: "$_id.month" },
          //     count: { $sum: 1 },
          //   },
          // },
          {
            $group: {
              _id: "$_id.month",
              count: { $sum: "$count" },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              count: 1,
            },
          },
          {
            $sort: { date: 1 },
          },
        ]);

        console.log("count : ", count)
        return count;
      }
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "dailyActiveUserQuery",
        {
          component: "edenMetricsQuery > dailyActiveUserQuery",
        }
      );
    }
  },
};

// [
//   { member: "518418233968295940", date: "Wed Mar 15 2023" },
//   { member: "518418233968295940", date: "Wed Mar 15 2023" },
//   { member: "518418233968295940", date: "Fri Mar 17 2023" },
//   { member: "908392557258604544", date: "Sun Mar 19 2023" },
//   { member: "908392557258604544", date: "Wed Mar 15 2023" },
//   { member: "908392557258604544", date: "Fri Mar 17 2023" },
//   { member: "901188444057907310", date: "Thu Mar 16 2023" },
//   { member: "901188444057907310", date: " Mar 15 2023" },
//   { member: "901188444057907310", date: "Sun Mar 19 2023" },
//   { member: "702954417946886286", date: "Fri Mar 17 2023" },
//   { member: "702954417946886286", date: " Mar 15 2023" },
//   { member: "702954417946886286", date: "Fri Mar 17 2023" },
//   { member: "812342397790191638", date: "Sat Mar 18 2023" },
//   { member: "812342397790191638", date: " Mar 15 2023" },
//   { member: "812342397790191638", date: "Sat Mar 18 2023" },
//   { member: "812526237074456577", date: "Mon Mar 20 2023" },
//   { member: "812526237074456577", date: "Wed Mar 15 2023" },
//   { member: "961730944170090516", date: "Wed Mar 15 2023" },
//   { member: "961730944170090516", date: "Thu Mar 16 2023" },
//   { member: "961730944170090516", date: "Fri Mar 17 2023" },
// ];
