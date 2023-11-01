const { Conversation } = require("../../../models/conversationModel");

const { printC } = require("../../../printModule");

const { ApolloError } = require("apollo-server-express");

const {
  findConversationFunc,
} = require("../utils/conversationModules");

module.exports = {
  findConversation: async (parent, args, context, info) => {
    const { _id,userID,subjectConv,typeConversation } = args.fields;
    console.log("Query > findConversation > args.fields = ", args.fields);

    try {
      let convData = await findConversationFunc(args.fields)

      
      return convData;
      
    } catch (err) {
      printC(err, "-1", "err", "r")
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findConversation",
        { component: "conversationQuery > findConversation" }
      );
    }
  },
  findConversations: async (parent, args, context, info) => {
    const { _id, userID,positionID, convKey,positionTrainEdenAI, summaryReady} = args.fields;
    console.log("Query > findConversations > args.fields = ", args.fields);


    let searchQuery_and = [];
    let searchQuery = {};


    if (_id) {
      searchQuery_and.push({ _id: _id });
    }
    if (userID) {
      searchQuery_and.push({ userID: userID });
    } 
    if (convKey != undefined){
      searchQuery_and.push({ convKey: convKey });
    } 
    if (summaryReady != undefined) {
      searchQuery_and.push({ summaryReady: summaryReady });
    } 
    if (positionTrainEdenAI != undefined) {
      searchQuery_and.push({ positionTrainEdenAI: positionTrainEdenAI });
    } 
    if (positionID) {
      // searchQuery_and.push({ positionID: positionID });
      searchQuery_and.push({ $or: [{ positionID: positionID }, { extraPositionsID: { $in: positionID } }] });
    } 

    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }

    try {

      console.log("searchQuery = " , searchQuery)
      console.log("searchQuery = " , searchQuery['$and'])

      let convData = await Conversation.find(searchQuery);

      return convData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findConversations",
        { component: "converstaionQuery > findConversations" }
      );
    }
  },
};
