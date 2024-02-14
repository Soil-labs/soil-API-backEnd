const { Position } = require("../../../models/positionModel");
const { Company } = require("../../../models/companyModel");

const { ApolloError } = require("apollo-server-express");
const util = require("util");

var ObjectId = require("mongoose").Types.ObjectId;
module.exports = {
  findPosition: async (parent, args, context, info) => {
    const { _id, telegramChatID } = args.fields;
    console.log("Query > findPosition > args.fields = ", args.fields);

    if (!_id && !telegramChatID)
      throw new ApolloError("ID or telegramChatID is required");

    try {
      // const collection = Position.collection;

      // // Rename the collection
      // collection.rename('positions', { dropTarget: true }, (err, result) => {
      //   if (err) {
      //     console.error(err);
      //   } else {
      //     console.log(result);
      //   }
      // });

      let positionData;
      if (_id) {
        positionData = await Position.findOne({ _id: _id });
      } else if (telegramChatID) {
        positionData = await Position.findOne({
          "conduct.telegramChatID": telegramChatID,
        });
      }

      if (!positionData) throw new ApolloError("Position not found");

      console.log("positionData = ", positionData);
      // sdf9

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPosition",
        { component: "positionQuery > findPosition" }
      );
    }
  },
  findPositionCandidate: async (parent, args, context, info) => {
    const { positionID, userID } = args.fields;
    console.log("Query > findPositionCandidate > args.fields = ", args.fields);

    if (!positionID) throw new ApolloError("positionID is required");

    if (!userID) throw new ApolloError("userID is required");

    try {
      let positionData = await Position.findOne({ _id: positionID });

      if (!positionData) throw new ApolloError("Position not found");

      let candidateData = positionData.candidates.find(
        (candidate) => candidate.userID.toString() == userID.toString()
      );

      console.log("candidateData = ", candidateData);
      console.log("scoreCardsPosition = ", candidateData.scoreCardCategoryMemories[0].scoreCardsPosition);
      f1

      return candidateData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPositionCandidate",
        { component: "positionQuery > findPositionCandidate" }
      );
    }
  },
  findPositions: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findPositions > args.fields = ", args.fields);

    let searchQuery_and = [];
    let searchQuery = {};

    if (_id) {
      searchQuery_and.push({ _id: _id });
    }

    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }
    try {
      let positionData = await Position.find(searchQuery);

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPositions",
        { component: "positionQuery > findPositions" }
      );
    }
  },
  findUserTalentListPosition: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log(
      "Query > findUserTalentListPosition > args.fields = ",
      args.fields
    );

    try {
      let positionData = await Position.findOne({
        "talentList._id": _id,
      }).select("_id name talentList");

      // find the talentList _id
      talentListData = positionData.talentList.find(
        (talentList) => talentList._id.toString() == _id.toString()
      );
      // positionData.

      let talentListData_ = {
        ...talentListData._doc,
        positionID: positionData._id,
      };

      // console.log("talentListData_ = " , talentListData_)

      return talentListData_;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findUserTalentListPosition",
        { component: "positionQuery > findUserTalentListPosition" }
      );
    }
  },
  findPositionsOfCommunity: async (parent, args, context, info) => {
    let { communityID, slug } = args.fields;
    console.log(
      "Query > findPositionsOfCommunity > args.fields = ",
      args.fields
    );

    if (communityID && slug)
      throw new ApolloError(" Only one of communityID or slug is required");
    if (!communityID && !slug)
      throw new ApolloError(" One of communityID or slug is required");

    try {
      if (slug) {
        let companyDataSlug = await Company.findOne({ slug: slug }).select(
          "_id"
        );

        communityID = companyDataSlug._id;
      }

      let companyData = await Company.find({
        communitiesSubscribed: { $elemMatch: { $eq: communityID } },
      }).select("_id positions");

      console.log("companyData = ", companyData);

      if (!companyData) throw new ApolloError("Company not found");

      const positionsIDs = companyData
        .map((_comp) => _comp.positions)
        .flat(1)
        .map((_pos) => _pos.positionID);

      let positionsData = await Position.find({
        _id: { $in: positionsIDs },
        status: { $nin: ["DELETED", "ARCHIVED", "UNPUBLISHED"] },
      }).select(
        "_id name status icon companyID generalDetails whatTheJobInvolves whatsToLove whoYouAre"
      );

      // f1

      return positionsData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPositionsOfCommunity",
        { component: "positionQuery > findPositionsOfCommunity" }
      );
    }
  },
};
