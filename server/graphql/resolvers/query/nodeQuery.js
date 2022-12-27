const { Node } = require("../../../models/nodeModal");
const { ServerTemplate } = require("../../../models/serverModel");

const mongoose = require("mongoose");

const { ApolloError } = require("apollo-server-express");
const e = require("express");

const DEFAULT_PAGE_LIMIT = 20;

module.exports = {
  findNode: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findSkill > args.fields = ", args.fields);

    // if (!_id) throw new ApolloError( "You need to specify the id of the skill");

    let searchQuery = {};

    if (_id) {
      searchQuery = { _id: _id };
    } else {
      throw new ApolloError("You need to specify the id of the skill");
    }

    try {
      let nodeData = await Node.findOne(searchQuery);

      return nodeData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  findNodes: async (parent, args, context, info) => {
    const { _id, node, recalculate_en, show_match_v2 } = args.fields;
    console.log("Query > findNode > args.fields = ", args.fields);

    let searchQuery_and = [];

    if (recalculate_en == "Member") {
      searchQuery_and.push({
        "match_v2_update.member": true,
      });
    } else if (recalculate_en == "ProjectRole") {
      searchQuery_and.push({
        "match_v2_update.projectRole": true,
      });
    } else if (recalculate_en == "All") {
      searchQuery_and.push({
        $or: [
          {
            "match_v2_update.projectRole": true,
          },
          {
            "match_v2_update.member": true,
          },
        ],
      });
    }

    if (_id) {
      searchQuery_and.push({ _id: _id });
    } else if (node) {
      searchQuery_and.push({ node: node });
    }

    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }

    try {
      let selectT = "-match_v2"; // optimization because match_v2 is really heavy, the more places we take it out the better
      if (show_match_v2) {
        // except if we want to show it
        selectT = "";
      }

      let nodeData = await Node.find(searchQuery).select(selectT);

      return nodeData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
};
