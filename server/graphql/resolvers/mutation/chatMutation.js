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
      serverID,
    } = args.fields;
    console.log("Mutation > addNewChat > args.fields = ", args.fields);

    if (!message)
      throw new ApolloError("The message is required to create a chat message");
    if (!serverID)
      throw new ApolloError("The serverID is required to create a chat");
    if (!projectID)
      throw new ApolloError("The projectID is required to create a chat");
    if (!threadID)
      throw new ApolloError("The threadID is required to create a chat");

    if (!senderID || !receiverID)
      throw new ApolloError(
        "The senderID and the receiverID is a required field"
      );

    if (senderID === receiverID)
      throw new ApolloError("Sender can not also be the receiver");

    let fields = {
      createdAt: new Date(),
      reply: { sender: true, receiver: false },
    };

    fields.message = message;
    fields.senderID = senderID;
    fields.receiverID = receiverID;
    if (projectID) fields.projectID = projectID;
    if (projectRoleID) fields.projectRoleID = projectRoleID;
    if (threadID) fields.threadID = threadID;
    if (serverID) fields.serverID = serverID;

    try {
      const newChat = await new Chats(fields);
      newChat.save();
      console.log("new chat", newChat);
      //update the sender chat counter
      const chatSender = await Members.findOne({ _id: senderID });
      if (chatSender) {
        let previousChatCount;
        if (isEmptyObject(chatSender.chat)) {
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
      return newChat;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "addNewChat", {
        component: "chatMutation > addNewChat",
      });
    }
  },
  updateChatReply: async (parent, args, context, info) => {
    const { _id, receiverReply, threadID, replyUserID } = args.fields;
    console.log("Mutation > updateChatReply > args.fields = ", args.fields);

    if (!_id && !threadID)
      throw new ApolloError("The chat _id or threadID is required");

    if (!receiverReply) throw new ApolloError("The receiverReply is required");

    if (!replyUserID) throw new ApolloError("The replyUserID is required");

    //find the chat in the DB
    try {
      if (_id) {
        searchTerm = { _id: _id };
      } else if (threadID) {
        searchTerm = { threadID: threadID };
      }
      let chat = await Chats.findOne(searchTerm);

      if (!chat) throw new ApolloError("The chat _id or threadID is not valid");

      const receiverID = chat.receiverID;
      const senderID = chat.senderID;

      let replier;

      if (senderID === replyUserID) {
        replier = "sender";
      } else if (receiverID === replyUserID) {
        replier = "receiver";
      } else {
        throw new ApolloError("The replyUserID is not valid");
      }

      if (replier == "receiver") {
        const chatReciever = await Members.findOne({ _id: receiverID });
        //chat receiver exist and replied
        if (chatReciever && receiverReply && !chat.reply.receiver) {
          let chatCountReceiver;

          if (isEmptyObject(chatReciever.chat)) {
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
      }

      if (replier == "sender") {
        const chatSender = await Members.findOne({ _id: senderID });

        //chat receiver exist and replied
        if (chatSender && receiverReply && !chat.reply.sender) {
          let chatCountSender;

          if (isEmptyObject(chatSender.chat)) {
            chatCountSender = { numChat: 0, numReply: 0 };
          } else {
            chatCountSender = chatSender.chat;
          }

          chatCountSender = {
            ...chatCountSender,
            numChat: chatCountSender.numChat + 1,
          };

          await Members.findOneAndUpdate(
            { _id: receiverID },
            { $set: { chat: chatCountSender } },
            { new: true }
          );
        }
      }

      const reply = {};

      if (replier == "sender") {
        reply = {
          sender: receiverReply,
        };
      } else if (replier == "receiver") {
        reply = {
          receiver: receiverReply,
        };
      }

      //update the chat with the reply
      chat = await Chats.findOneAndUpdate(
        { _id: _id },
        {
          $set: {
            reply: reply,
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
    const { _id, result, threadID } = args.fields;
    console.log("Mutation > addNewChat > args.fields = ", args.fields);

    if (!_id && !threadID)
      throw new ApolloError("The _id or threadID is required");
    if (!result) throw new ApolloError("The result is required");
    try {
      let searchTerm = {};
      if (_id) {
        searchTerm = { _id: _id };
      } else if (threadID) {
        searchTerm = { threadID: threadID };
      }
      let chat = await Chats.findOne(searchTerm);
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
  if (obj) {
    return JSON.stringify(obj) === "{}";
  }
  return false;
}
