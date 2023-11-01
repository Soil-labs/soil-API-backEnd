const { Conversation } = require("../../../models/conversationModel");

const { printC } = require("../../../printModule");

const { ApolloError } = require("apollo-server-express");


module.exports = {
  findConversation: async (parent, args, context, info) => {
    const { _id,userID,subjectConv,typeConversation } = args.fields;
    let {limit, skip} = args.fields;
    console.log("Query > findConversation > args.fields = ", args.fields);

    if (!limit) limit = 1000;
    if (!skip) skip = 0;

    // const limitConversation = { conversation: { $slice: [skip, limit] } }
    const limitConversation = { conversation: { $slice: [ -limit - skip, limit ]  } }

    try {

      let convData = null;

      if (_id){
        convData = await Conversation.findOne({ _id: _id }, limitConversation);

        if (!convData) throw new ApolloError("Conversation not found")

        printC(convData, "0", "convData", "b");

        return convData;
      }

      filter = {}

      if (userID) filter.userID = userID;
      if (subjectConv.userIDs) filter["subjectConv.userIDs"] = { $all: subjectConv.userIDs };
      if (subjectConv.positionIDs) filter["subjectConv.positionIDs"] = { $all: subjectConv.positionIDs };
      if (subjectConv.companyIDs) filter["subjectConv.companyIDs"] = { $all: subjectConv.companyIDs };
      if (typeConversation) filter.typeConversation = typeConversation;
      


      
      conversationsData = await Conversation.find(filter, limitConversation);

      printC(conversationsData, "0", "conversationsData", "b");
      // f1

      if (conversationsData.length == 1) {
        convData = conversationsData[0]
      } else if (conversationsData.length > 1) {
        // TODO return multiple conversation IDs later, for now we will return the last one
        convData = conversationsData[conversationsData.length - 1]
      }


      if (convData == null) {
        convData = await new Conversation({
          userID: userID,
          subjectConv: subjectConv,
          typeConversation: typeConversation,
          conversation: [],
          summaryReady: false,
          positionTrainEdenAI: false,
        });

        await convData.save();
      }




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
