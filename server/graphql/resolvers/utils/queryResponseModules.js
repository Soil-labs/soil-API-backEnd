
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { request, gql} = require('graphql-request');

const { REACT_APP_API_URL, REACT_APP_API_CRON_URL } = process.env;


  const addToFilter = async (_id,phase,sentFlag,senderID,senderType,responderID,responderType,question,conversationID,answer) => {
    filter = {}

    if (_id) {
      filter._id = _id;
    }

    if (senderID && senderType) {
      if (senderType == "USER") {
        filter={
          ...filter,
          sender: {}
        }
        filter.sender.userID = senderID;
      } else if (senderType == "POSITION") {
        filter={
          ...filter,
          sender: {}
        }
        filter.sender.positionID = senderID;
      }
    }



    if (responderID && responderType) {
      if (responderType == "USER") {
        filter={
          ...filter,
          responder: {}
        }
        filter.responder.userID = responderID;
      } else if (responderType == "POSITION") {
        filter={
          ...filter,
          responder: {}
        }
        filter.responder.positionID = responderID;
      }
    }

    if (phase) {
      filter.phase = phase;
    }

    if (sentFlag) {
      filter.sentFlag = sentFlag;
    }

    if (question) {
      filter={
        ...filter,
        question: {}
      }
      filter.question.content = question;
    }

    if (answer) {
      filter={
        ...filter,
        answer: {}
      }
      filter.answer.content = answer;
    }

    
    return filter;
  };


module.exports = {
      addToFilter,
  };