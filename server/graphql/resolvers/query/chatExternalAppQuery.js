const { ChatExternalApp } = require("../../../models/chatExternalAppModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  findLastNumMessagesChatExternalApp: async (parent, args, context, info) => {
    const { chatID_TG,userID,projectID,communicationAuthorType,lastNumMessages} = args.fields;
    console.log("Query > findLastNumMessagesChatExternalApp > args.fields = ", args.fields);

    filter = {};

    if (!chatID_TG && !userID && !projectID) {
      throw new ApolloError(
        "chatID_TG or userID or projectID is required",
      );
    }

    if (chatID_TG) filter.chatID_TG = chatID_TG;


    if (communicationAuthorType == "POSITION") {

      filter = {
        projectID: projectID,
        communicationAuthorType: communicationAuthorType,
      }

    } else if ( communicationAuthorType == "USER") {

      filter = {
        userID: userID,
        communicationAuthorType: communicationAuthorType,
      }

    } 
    
    try {

      // const chatExternalAppData = await ChatExternalApp.find().sort({ timeStamp: -1 }).limit(lastNumMessages)
      const chatExternalAppData = await ChatExternalApp.find(filter).sort({ timeStamp: -1 }).limit(lastNumMessages)



      return chatExternalAppData

    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "findLastNumMessagesChatExternalApp", {
        component: "chatExternalAppQuery > findLastNumMessagesChatExternalApp",
      });
    }
  },
};
