const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");

module.exports = {
  addMessage: async (parent, args, context, info) => {
    const { creator, mentioned, message } = args.fields;
    console.log("Mutation > addMessage > args.fields = ", args.fields);
    try {
      if (!creator)
        throw new ApolloError("The creator of the message is required.");
      if (!mentioned) throw new ApolloError("The mentioned array is required");
      if (!message) throw new ApolloError("The message is required");

      let fields = {
        createdAt: new Date(),
      };

      fields.message = message;
      fields.creator = creator;
      fields.mentioned = mentioned;

      const newAIData = await new AI(fields);

      newAIData.save();
      console.log("new ai data : ", newAIData);
      return newAIData;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "addMessage", {
        component: "aiMutation > addMessage",
      });
    }
  },
  addMessages: async (parent, args, context, info) => {
    const { data } = args.fields;
    console.log("Mutation > addMessages > args.fields = ", args.fields);
    try {
      if (!data || !data.length || data.length === 0)
        throw new ApolloError("The array of messages is required");
      let validData = [];
      data.forEach((addMessageInputData) => {
        const { creator, mentioned, message } = addMessageInputData;
        let valid = false;
        if (creator && mentioned && message) {
          valid = true;
        }

        if (valid) {
          addMessageInputData.createdAt = new Date();
          validData.push(addMessageInputData);
        }
      });

      if (validData.length === 0)
        throw new ApolloError("The passed data were not valid");

      console.log("valid data ", validData);

      //multiple insert
      const newAIDataArray = await AI.insertMany(validData);
      console.log("new ai data : ", newAIDataArray);
      return newAIDataArray;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addMessages",
        {
          component: "aiMutation > addMessages",
        }
      );
    }
  },
  updateMessage: async (parent, args, context, info) => {
    const { messageID, edenAI } = args.fields;
    console.log("Mutation > updateMessage > args.fields = ", args.fields);
    try {
      if (!messageID) throw new ApolloError("The messageID is required");
      if (!edenAI) throw new ApolloError("The edenAI array is required");

      if (edenAI && edenAI.length === 0)
        throw new ApolloError("The edenAI array length must be greater than 0");

      let aiData = await AI.findOne({ _id: messageID });
      if (!aiData) throw new ApolloError("The message does not exist");

      aiData = await AI.findOneAndUpdate(
        { _id: messageID },
        {
          $set: {
            edenAI: edenAI,
          },
        },

        { new: true }
      ).lean();

      const embeddingData = convertEmbeddingToFloat(aiData.edenAI.keywords);
      aiData.edenAI.keywords = embeddingData;
      return aiData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateMessage",
        {
          component: "aiMutation > updateMessage",
        }
      );
    }
  },
};

const convertEmbeddingToFloat = (keywordsArray) => {
  let buildArray = [...keywordsArray];
  for (let i = 0; i < keywordsArray.length; i++) {
    let embeddingArray = keywordsArray[i].embedding;
    let newEmbeddingArray = [];
    embeddingArray.forEach((embedding) => {
      newEmbeddingArray.push(parseFloat(embedding.toString()));
    });

    buildArray[i].embedding = newEmbeddingArray;
  }

  return buildArray;
};
