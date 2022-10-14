const { Members } = require("../../../models/membersModel");
const { Chats } = require("../../../models/chatsModel");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  addNewChat: async (parent, args, context, info) => {
    const {
      message,
      senderID,
      receiverID,
      projectID,
      projectRoleID,
      threadID,
    } = args.fields;
    console.log("Mutation > addNewChat > args.fields = ", args.fields);

    if (!message)
      throw new ApolloError("The message is required to create a chat");
    if (!senderID || !receiverID)
      throw new ApolloError(
        "The senderID and the receiverID is a required field"
      );

    if (senderID === receiverID)
      throw new ApolloError("Sender can not also be the receiver");

    let fields = {
      createdAt: new Date(),
    };

    fields.message = message;
    fields.senderID = senderID;
    fields.receiverID = receiverID;
    if (projectID) fields.projectID = projectID;
    if (projectRoleID) fields.projectRoleID = projectRoleID;
    if (threadID) fields.threadID = threadID;

    try {
      const newChat = await new Chats(fields);
      newChat.save();
      console.log("new chat", newChat);
      return newChat;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "addNewChat", {
        component: "chatMutation > addNewChat",
      });
    }
  },
  updateChatReply: async (parent, args, context, info) => {
    const { _id, senderReply, receiverReply } = args.fields;
    console.log("Mutation > updateChatReply > args.fields = ", args.fields);

    if (!_id || !senderReply || !receiverReply)
      throw new ApolloError(
        "The chat _id with the senderReply and receiverReply field are required"
      );

    //find the chat in the DB

    try {
      let chat = await Chats.findOne({ _id: _id });

      if (!chat) throw new ApolloError("The chat _id is not valid");

      const receiverID = chat.receiverID;
      const senderID = chat.senderID;

      const chatReciever = await Members.findOne({ _id: receiverID });
      const chatSender = await Members.findOne({ _id: senderID });

      //chat receiver exist and replied
      if (chatReciever && receiverReply && !chat.reply.receiver) {
        let chatCountReceiver;

        if (isEmptyObject((chatReciever.chat = {}))) {
          chatCountReceiver = { numChat: 0, numReply: 0 };
        } else {
          chatCountReceiver = chatReciever.chat;
        }

        chatCountReceiver = {
          ...chatCountReceiver,
          numReply: chatCountReceiver.numReply + 1,
        };

        await Members.findOneAndUpdate(
          { _id: receiverID },
          { $set: { chat: chatCountReceiver } },
          { new: true }
        );
      }

      //chat sender exist and replied and has not replied before
      if (chatSender && senderReply && !chat.reply.sender) {
        let previousChatCount;
        if (isEmptyObject((chatSender.chat = {}))) {
          previousChatCount = { numChat: 0, numReply: 0 };
        } else {
          previousChatCount = chatSender.chat;
        }

        previousChatCount = {
          ...previousChatCount,
          numChat: previousChatCount.numChat + 1,
        };

        await Members.findOneAndUpdate(
          { _id: senderID },
          { $set: { chat: previousChatCount } },
          { new: true }
        );
      }

      //update the chat with the reply
      chat = await Chats.findOneAndUpdate(
        { _id: _id },
        {
          $set: {
            reply: { sender: senderReply, receiver: receiverReply },
          },
        },
        { new: true }
      );

      return chat;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateChatReply",
        {
          component: "chatMutation > updateChatReply",
        }
      );
    }
  },
  updateChatResult: async (parent, args, context, info) => {
    const { _id, result } = args.fields;
    console.log("Mutation > addNewChat > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("The _id is required");
    if (!result) throw new ApolloError("The result is required");
    try {
      let chat = await Chats.findOne({ _id: _id });
      if (!chat)
        throw new ApolloError(
          "The chat _id is invalid. Please supply a valid _id"
        );
      chat = await Chats.findOneAndUpdate(
        { _id: _id },
        { $set: { result: result } },
        { new: true }
      );
      return chat;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateChatResult",
        {
          component: "chatMutation > updateChatResult",
        }
      );
    }
  },
};

function isEmptyObject(obj) {
  return JSON.stringify(obj) === "{}";
}
