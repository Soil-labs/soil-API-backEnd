const mongoose = require("mongoose");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");

const { ChatExternalApp } = require("../../../models/chatExternalAppModel");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  addChatExternalApp: async (parent, args, context, info) => {
    const { _id,chatID_TG,message,senderRole} = args.fields;
    let {userID,projectID,communicationAuthorType} = args.fields;

    console.log("Mutation > addChatExternalApp > args.fields = ", args.fields);


    // ------------------ Find user and project from ChatID_TG ------------------
    if (!chatID_TG && !userID && !projectID) {
      throw new ApolloError(
        "chatID_TG or userID or projectID is required",
      );
    }

    if (!userID && !projectID) {
      // find the user or project based on the chatID_TG

      let memberData = await Members.findOne({ "conduct.telegramChatID": chatID_TG }).select('_id discordName conduct ');

      if (memberData) {
        userID = memberData._id;
        communicationAuthorType = "USER";

      } else {
        let positionData = await Position.findOne({ "conduct.telegramChatID": chatID_TG }).select('_id name conduct ');

        if (positionData) {
          projectID = positionData._id;
          communicationAuthorType = "POSITION";
        } else {
          throw new Error("Didn't find any Member or Positions with this code, try again");
        }

      }
    }
    // ------------------ Find user and project from ChatID_TG ------------------




    // add to filter 
    let filter = {}

    if (chatID_TG) filter.chatID_TG = chatID_TG;
    if (userID) filter.userID = userID;
    if (projectID) filter.projectID = projectID;
    if (communicationAuthorType) filter.communicationAuthorType = communicationAuthorType;
    if (message) filter.message = message;
    if (senderRole) filter.senderRole = senderRole;

    filter.timeStamp = new Date();

    console.log("filter", filter);



    
    
    try {

      if (_id) {
        const chatExternalApp = await ChatExternalApp.findOne({ _id: _id })

        if (chatExternalApp) {
          chatExternalApp.chatID_TG = chatID_TG;
          chatExternalApp.userID = userID;
          chatExternalApp.projectID = projectID;
          chatExternalApp.communicationAuthorType = communicationAuthorType;
          chatExternalApp.message = message;
          chatExternalApp.senderRole = senderRole;
          chatExternalApp.timeStamp = new Date();


          await chatExternalApp.save();

          return chatExternalApp;
        } else {
          // create new one
          const newChatExternalApp = await new ChatExternalApp({
            _id: new mongoose.Types.ObjectId(),
            chatID_TG,
            userID,
            projectID,
            communicationAuthorType,
            message,
            senderRole,
            timeStamp: new Date()
          });

          await newChatExternalApp.save();

          return newChatExternalApp;
        }

      } else {
        // create new one
        const newChatExternalApp = await new ChatExternalApp({
          _id: new mongoose.Types.ObjectId(),
          chatID_TG,
          userID,
          projectID,
          communicationAuthorType,
          message,
          senderRole,
          timeStamp: new Date()
        });

        console.log("newChatExternalApp", newChatExternalApp);

        await newChatExternalApp.save();

        return newChatExternalApp;
      }

      
      return "ok";
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addChatExternalApp",
        {
          component: "addChatExternalAppMutation > addChatExternalApp",
        }
      );
    }
  },
};
