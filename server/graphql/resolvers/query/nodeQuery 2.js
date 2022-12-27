const { Node } = require("../../../models/nodeModal");

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
    const { _id,node,recalculateMembers,recalculateProjectRoles,matchByServer_update } = args.fields;
    console.log("Query > findSkill > args.fields = ", args.fields);

    // if (!_id) throw new ApolloError( "You need to specify the id of the skill");

    let searchQuery_and = [];

    if (matchByServer_update!=null) {
      searchQuery_and.push({ matchByServer_update: matchByServer_update });
    } else {

      if  (recalculateMembers!=null && recalculateProjectRoles!=null) {
        searchQuery_and.push({
          $or: [
            {"match.recalculateMembers": recalculateMembers},
            {"match.recalculateProjectRoles": recalculateProjectRoles},
          ]
        })
      } else if (recalculateMembers!=null) {
        searchQuery_and.push({"match.recalculateMembers": recalculateMembers})
      } else if (recalculateProjectRoles!=null){
        searchQuery_and.push({"match.recalculateProjectRoles": recalculateProjectRoles})
      }
    }

    if (_id) {
      searchQuery_and.push({ _id: _id });
    } else if (node) {
      searchQuery_and.push({ node: node });
    }

    if (searchQuery_and.length>0){
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }

    console.log("searchQuery = " , searchQuery_and)

    try {
      let nodeData = await Node.find(searchQuery);
      // let nodeData = await Node.find({"matchByServer_update": true });
      // let nodeData = await Node.find({});


      console.log("nodeData = " , nodeData)

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
