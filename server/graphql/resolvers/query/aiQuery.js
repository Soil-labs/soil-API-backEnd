const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");
const { Configuration, OpenAIApi } = require("openai");


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
  edenGPTreply: async (parent, args, context, info) => {
    const { message } = args.fields;
    console.log("Query > edenGPTreply > args.fields = ", args.fields);
    try {

      const configuration = new Configuration({
        apiKey: "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",
      });
      const openai = new OpenAIApi(configuration);

      // -------------- Find Reply -------------
      const response = await openai.createCompletion({
        model: "davinci:ft-eden-protocol-2023-02-22-13-21-15",
        prompt: message + "\nReply:",
        temperature: 0.7,
        stop: ["==END=="],
        max_tokens: 500,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0,
      });
    
      let replyEden = response.data.choices[0].text;
      // -------------- Find Reply -------------


      // -------------- Find Keywords -------------
      const response_keywords = await openai.createCompletion({
        model: "curie:ft-eden-protocol-2023-02-23-08-44-12",
        prompt: message + "\nKeywords:",
        temperature: 0.7,
        stop: ["==END=="],
        max_tokens: 300,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0,
      });
    
      let keywordsEden = response_keywords.data.choices[0].text;
      // console.log("keywordsEden = " , keywordsEden)

      var keywordsEdenArray = keywordsEden.split(',');
      // -------------- Find Keywords -------------


      return {
        reply: replyEden,
        keywords: keywordsEdenArray
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTreply",
        {
          component: "aiQuery > edenGPTreply",
        }
      );
    }
  },
};
