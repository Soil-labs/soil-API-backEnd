const { Skills } = require("../../../models/skillsModel");

const mongoose = require("mongoose");

const { ApolloError } = require("apollo-server-express");
const e = require("express");

const DEFAULT_PAGE_LIMIT = 20;

module.exports = {
  findSkill: async (parent, args, context, info) => {
    const { _id, id_lightcast } = args.fields;
    console.log("Query > findSkill > args.fields = ", args.fields);

    // if (!_id) throw new ApolloError( "You need to specify the id of the skill");

    let searchQuery = {};

    if (_id) {
      searchQuery = { _id: _id };
    } else if (id_lightcast) {
      searchQuery = { id_lightcast: id_lightcast };
    } else {
      throw new ApolloError("You need to specify the id of the skill");
    }

    try {
      let skillData = await Skills.findOne(searchQuery);

      return skillData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  findSkills: async (parent, args, context, info) => {
    const { _id, id_lightcast } = args.fields;
    console.log("Query > findSkills > args.fields = ", args.fields);

    let searchQuery = {};

    if (_id) {
      searchQuery = {
        $and: [{ _id: _id }, { state: "approved" }],
      };
    } else if (id_lightcast) {
      searchQuery = {
        $and: [{ id_lightcast: id_lightcast }, { state: "approved" }],
      };
    } else {
      searchQuery = {
        $and: [{ state: "approved" }],
      };
    }

    //console.log("fields = " , fields)

    try {
      let membersData;
      // if (_id) {
      // //console.log("change =1 ")

      //     membersData = await Skills.find( {
      //       $and: [
      //         { _id: fields._id },
      //         { state: "approved" },
      //       ]
      //   } )

      // } else {
      // //console.log("change =2 ")

      //   membersData = await Skills.find({state: "approved"})
      // //console.log("membersData = " , membersData)
      // }

      membersData = await Skills.find(searchQuery);

      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  skills: async (parent, args, context, info) => {
    const { request, id_lightcast, after, before, limit, sortBy } = args.fields;
    console.log("Query > findSkills > args.fields = ", args.fields);

    let _id = request && request._id ? request._id : null;

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
      if (options.field === "_id") before_key = mongoose.Types.ObjectId(before);
      options.filters = {
        [options.field]: {
          [than_key_prev]: before_key,
        },
      };
      options.sort[options.field] = -1 * options.sort[options.field];
    }

    let searchQuery = {};
    if (_id) {
      searchQuery = {
        $and: [{ _id: _id }, { state: "approved" }],
      };
    } else if (id_lightcast) {
      searchQuery = {
        $and: [{ id_lightcast: id_lightcast }, { state: "approved" }],
      };
    } else {
      searchQuery = {
        $and: [{ state: "approved" }],
      };
    }

    try {
      let data = await Skills.find({ ...searchQuery, ...options.filters })
        .sort(options.sort)
        .limit(options.limit);

      if (before) data.reverse();

      let hasNextPage =
        data.length > 0
          ? !!(await Skills.findOne({
              ...searchQuery,
              [options.field]: {
                [than_key_next]: data[data.length - 1][options.field],
              },
            }))
          : !!before;

      let hasPrevPage =
        data.length > 0
          ? !!(await Skills.findOne({
              ...searchQuery,
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
      console.error(err);
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  skills_autocomplete: async (parent, args, context, info) => {
    const { search } = args.fields;
    console.log("Query > skills_autocomplete > args.fields = ", args.fields);

    let collection = mongoose.connection.db.collection("skills");

    try {
      console.log("change = 1", search);
      let result = await collection
        .aggregate([
          {
            $search: {
              autocomplete: {
                query: search,
                path: "name",
                fuzzy: {
                  maxEdits: 1,
                },
              },
            },
          },
        ])
        .toArray();

      console.log("result = ", result);

      return result;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  adminFindAllSkillsEveryState: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log(
      "Query > adminFindAllSkillsEveryState > args.fields = ",
      args.fields
    );

    let fields = {};

    if (_id) fields = { ...fields, _id };

    //console.log("fields = " , fields)

    try {
      let membersData;
      if (_id) {
        //console.log("change =1 ")

        membersData = await Skills.find({ _id: fields._id });
      } else {
        //console.log("change =2 ")

        membersData = await Skills.find({});
        //console.log("membersData = " , membersData)
      }

      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
  waitingToAproveSkills: async (parent, args, context, info) => {
    console.log("Query > waitingToAproveSkills > args.fields = ");

    let fields = {};

    try {
      let membersData;

      membersData = await Skills.find({ state: "waiting" });

      return membersData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill" }
      );
    }
  },
};
