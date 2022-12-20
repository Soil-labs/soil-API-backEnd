const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");

const DEFAULT_PAGE_LIMIT = 20;

module.exports = {
  findMessage: async (parent, args, context, info) => {
    const {
      request: { discordID, serverID },
      after,
      before,
      limit,
      sortBy,
    } = args.fields;
    console.log("Query > findMessage > args.fields = ", args.fields);

    if (!discordID && !serverID)
      throw new ApolloError("The discordID or serverID is required");

    try {
      let options = {
        limit: limit || DEFAULT_PAGE_LIMIT,
      };

      if (sortBy) {
        options.field = sortBy.field || "_id";
        options.sort = {
          [sortBy.field]: sortBy.direction == "ASC" ? 1 : -1,
        };
        options.direction = sortBy.direction == "ASC" ? 1 : -1;
      } else {
        options.field = "_id";
        options.sort = {
          _id: 1,
        };
        options.direction = 1;
      }

      let than_key_next = options.direction === 1 ? "$gt" : "$lt";
      let than_key_prev = options.direction === -1 ? "$gt" : "$lt";

      if (after) {
        let after_key = after;
        if (options.field === "_id") after_key = mongoose.Types.ObjectId(after);
        options.filters = {
          [options.field]: {
            [than_key_next]: after_key,
          },
        };
      } else if (before) {
        let before_key = before;
        if (options.field === "_id")
          before_key = mongoose.Types.ObjectId(before);
        options.filters = {
          [options.field]: {
            [than_key_prev]: before_key,
          },
        };
        options.sort[options.field] = -1 * options.sort[options.field];
      }

      let searchTerm = {};

      if (discordID && serverID) {
        searchTerm = {
          $and: [{ creator: discordID }, { serverID: serverID }],
        };
      } else if (discordID) {
        searchTerm = {
          $and: [{ creator: discordID }],
        };
      } else if (serverID) {
        searchTerm = {
          $and: [{ serverID: serverID }],
        };
      }

      let data = await AI.find({ ...searchTerm, ...options.filters })
        .sort(options.sort)
        .limit(options.limit);

      if (before) data.reverse();

      let hasNextPage =
        data.length > 0
          ? !!(await AI.findOne({
              ...searchTerm,
              [options.field]: {
                [than_key_next]: data[data.length - 1][options.field],
              },
            }))
          : !!before;

      let hasPrevPage =
        data.length > 0
          ? !!(await AI.findOne({
              ...searchTerm,
              [options.field]: {
                [than_key_prev]: data[0][options.field],
              },
            }))
          : !!after;

      return {
        data,
        pageInfo: {
          hasNextPage,
          hasPrevPage,
          start: data.length > 0 ? data[0][options.field] : after,
          end: data.length > 0 ? data[data.length - 1][options.field] : before,
        },
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMessage",
        {
          component: "aiQuery > findMessage",
        }
      );
    }
  },
};
