const { ChatExternalApp } = require("../../../models/chatExternalAppModel");

const { ApolloError } = require("apollo-server-express");

const { printC } = require("../../../printModule");


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
  checkLimitMessagesExternalApp: async (parent, args, context, info) => {
    const { chatID_TG,userID,projectID,communicationAuthorType,limitMinute,limitHour,limitDay} = args.fields;
    console.log("Query > checkLimitMessagesExternalApp > args.fields = ", args.fields);

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

    filter = {
      ...filter,
      senderRole: "user",
    }
    
    try {

      // 
      // const chatExternalAppData = await ChatExternalApp.find(filter).sort({ timeStamp: -1 }).limit(lastNumMessages)

      const chatExternalAppData = await ChatExternalApp.find(filter).sort({ timeStamp: -1 }).limit(1000)
      
      
      // filter the messages that was sent in the last minute
      const lastMinute = new Date(new Date().getTime() - 60 * 1000);
      const chatExternalAppDataLastMinute = chatExternalAppData.filter( (message) => message.timeStamp > lastMinute )
      printC(chatExternalAppDataLastMinute.length, "0", "chatExternalAppDataLastMinute.length", "b")
      // printC(chatExternalAppDataLastMinute, "0", "chatExternalAppDataLastMinute", "b")
      


      // find the number of messages that was sent in the last hour 
      const lastHour = new Date(new Date().getTime() - 60 * 60 * 1000);
      const chatExternalAppDataLastHour = chatExternalAppData.filter( (message) => message.timeStamp > lastHour )
      printC(chatExternalAppDataLastHour.length, "0", "chatExternalAppDataLastHour.length", "r");
      // printC(chatExternalAppDataLastHour, "0", "chatExternalAppDataLastHour", "r");

      

      // filter the messages that was sent in the last day
      const lastDay = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
      const chatExternalAppDataLastDay = chatExternalAppData.filter( (message) => message.timeStamp > lastDay )
      printC(chatExternalAppDataLastDay.length, "0", "chatExternalAppDataLastDay.length", "b")

      // check if the number of messages that was sent in the last minute is greater than the limitMinute
      if (chatExternalAppDataLastMinute.length >= limitMinute) {
        return {
          limitExceeded: true,
          message: "Limit of messages per minute exceeded, please try again later",
          limitExceededMinute: true,
          limitExceededHour: false,
          limitExceededDay: false,
        }
      }

      // check if the number of messages that was sent in the last hour is greater than the limitHour
      if (chatExternalAppDataLastHour.length >= limitHour) {
        return {
          limitExceeded: true,
          message: "Limit of messages per hour exceeded, please try again later",
          limitExceededMinute: false,
          limitExceededHour: true,
          limitExceededDay: false,
        }
      }

      // check if the number of messages that was sent in the last day is greater than the limitDay
      if (chatExternalAppDataLastDay.length >= limitDay) {
        return {
          limitExceeded: true,
          message: "Limit of messages per day exceeded, please try again later",
          limitExceededMinute: false,
          limitExceededHour: false,
          limitExceededDay: true,
        }
      }

      return {
        limitExceeded: false,
        message: "Limit of messages not exceeded",
        limitExceededMinute: false,
        limitExceededHour: false,
        limitExceededDay: false,
      }

    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "checkLimitMessagesExternalApp", {
        component: "chatExternalAppQuery > checkLimitMessagesExternalApp",
      });
    }
  },
};
