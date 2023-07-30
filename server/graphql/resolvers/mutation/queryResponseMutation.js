const { ApolloError } = require("apollo-server-express");

const { QueryResponse } = require("../../../models/queryResponseModel");

module.exports = {
  updateQueryResponse: async (parent, args, context, info) => {
    const { _id,phase,senderID,senderType,responderID,responderType,question } = args.fields;
    console.log("Mutation > updateQueryResponse > args.fields = ", args.fields);

    try {

      // -------------- filter --------------
      filter = {
        sender: {},
        responder: {},
        question: {},
        answer: {},
      }

      if (_id) {
        filter._id = _id;
      }

      if (senderID && senderType) {
        if (senderType == "USER") {
          filter.sender.userID = senderID;
        } else if (senderType == "POSITION") {
          filter.sender.positionID = senderID;
        }
      }

      if (responderID && responderType) {
        if (responderType == "USER") {
          filter.responder.userID = responderID;
        } else if (responderType == "POSITION") {
          filter.responder.positionID = responderID;
        }
      }

      if (phase) {
        filter.phase = phase;
      }

      if (question) {
        filter.question.content = question;
      }
      // -------------- filter --------------




      if (_id) {
        queryResponseData = await QueryResponse.findOne({ _id });

        // update using the filter
        if (filter.phase) queryResponseData.phase = filter.phase;
        if (filter.sender) queryResponseData.sender = filter.sender;
        if (filter.responder) queryResponseData.responder = filter.responder;
        if (filter.question) queryResponseData.question = filter.question;
        if (filter.answer) queryResponseData.answer = filter.answer;

      } else {
        queryResponseData = await new QueryResponse(
          filter
        );
      }

      await queryResponseData.save();



      return queryResponseData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateQueryResponse",
        { component: "companyMutation > updateQueryResponse" }
      );
    }
  },

};
