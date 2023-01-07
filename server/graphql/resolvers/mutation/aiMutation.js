const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");
const axios = require("axios");
// const { Configuration, OpenAIApi } = require("openai");
// const numeric = require("numeric");
const math = require("mathjs");
const fs = require("fs");

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

module.exports = {
  addMessage: async (parent, args, context, info) => {
    const { creator, mentioned, message, serverID } = args.fields;
    console.log("Mutation > addMessage > args.fields = ", args.fields);
    try {
      if (!creator)
        throw new ApolloError("The creator of the message is required.");
      if (!mentioned) throw new ApolloError("The mentioned array is required");
      if (!message) throw new ApolloError("The message is required");

      let fields = {
        createdAt: new Date(),
      };

      if (serverID) fields.serverID = serverID;

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
  useAI_OnMessage: async (parent, args, context, info) => {
    const { message } = args.fields;
    console.log("Mutation > updateMessage > args.fields = ", args.fields);

    try {
      question_ask =
        "Extract keywords from this text, and separate them with comma:\n\n" +
        message +
        "\n\n Result:";

      let keywords_mes, keyword_embed;
      if (fs.existsSync("keywords_mes.txt")) {
        readData("keywords_mes.txt");
      } else {
        keywords_mes = await useGPT(keywords_mes, 0.7);
        cashData("keywords_mes.txt", keywords_mes);
      }

      // if (fs.existsSync("keyword_embed.txt")) {
      //   readData("keyword_embed.txt");
      // } else {
      //   keyword_embed = await createEmbedingsGPT(keywords_mes);
      //   cashData("keyword_embed.txt", keyword_embed);
      // }

      // words_n_base_embed = await addKnowledgeGraph_embedings();

      // console.log("words_n_base_embed.length = ", words_n_base_embed.length);
      // console.log("words_n_base_embed.length = ", words_n_base_embed[0].length);
      // console.log(
      //   "words_n_base_embed.length = ",
      //   words_n_base_embed[0][0].length
      // );
      // console.log("keyword_embed.length = ", keyword_embed.length);
      // console.log("keyword_embed.length = ", keyword_embed[0].length);

      // let testV = keyword_embed[0];

      // let dotProduct = math.dot(
      //   words_n_base_embed[0],
      //   math.transpose(keyword_embed)
      // );

      // console.log(dotProduct); // Output: 11

      // console.log("words_n_base_embed = ", words_n_base_embed);

      return {};
      // return {
      //   res: res,
      // };
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

async function useGPT(prompt, temperature) {
  // let model = "text-curie-001";
  let model = "text-davinci-003";
  // const response = await openai.createCompletion({
  //   model,
  //   prompt,
  //   temperature,
  //   max_tokens: 256,
  //   top_p: 1,
  //   frequency_penalty: 0,
  //   presence_penalty: 0,
  // });

  // // ----------- Clean up the Results ---------
  // let generatedText = response.data.choices[0].text;

  // // console.log("generatedText = ", generatedText);
  // generatedText = generatedText.replace("\n", "");
  // // console.log("generatedText = ", generatedText);

  // arr = generatedText.split(", ");
  // // ----------- Clean up the Results ---------

  // return arr;
}

async function createEmbedingsGPT(words_n) {
  // words_n = ["node.js", "react", "angular"];
  let OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: words_n,
      model: "text-embedding-ada-002",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  res = response.data.data.map((obj) => {
    return obj.embedding;
  });

  // console.log("res = ", res);
  return res;
}

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

async function readData(name) {
  const contents = fs.readFileSync(name);
  const res_array = JSON.parse(contents);

  return res_array;
}

async function cashData(name, array) {
  name = name + ".txt";
  fs.writeFile(name, JSON.stringify(array), function (err) {
    if (err) throw err;
    console.log("Saved!");
  });
}

async function addKnowledgeGraph_embedings() {
  words_n_base = [
    [
      "Design",
      "UX/UI",
      "Graphic Design",
      "Web Design",
      "Game Design",
      "Animation",
      "General Design support from A-Z",
      "NFT Design",
      "Brand Design",
    ],
    [
      "Frontend Developer",
      "UI Implementation",
      "Frontend Architecture",
      "General Frontend Support",
      "Web Development",
      "App Development",
    ],
    [
      "Product Manager",
      "User Research",
      "Market Research",
      "Technical Team Coordination",
      "Design Team Coordination",
      "Ideation",
      "Interviews",
    ],
  ];

  let words_n_base_embed = [];
  if (fs.existsSync("array.txt")) {
    console.log("array.txt exists");

    const fs = require("fs");

    const contents = fs.readFileSync("array.txt");
    const words_n_base_embed = JSON.parse(contents);

    // console.log(words_n_base_embed.length); // [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    // console.log(words_n_base_embed[0].length); // [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
    // console.log(words_n_base_embed[0][0].length); // [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]

    return words_n_base_embed;
  } else {
    console.log("array.txt does not exist");

    // loop words_n_base
    words_n_base_embed = [];
    for (let i = 0; i < words_n_base.length; i++) {
      let words_n = words_n_base[i];
      let res_embed = await createEmbedingsGPT(words_n);
      // put them on an array
      words_n_base_embed.push(res_embed);
    }

    // console.log("words_n_base_embed = ", words_n_base_embed);

    const json = JSON.stringify(words_n_base_embed);

    fs.writeFileSync("array.txt", json);

    console.log("json = ", json);

    return words_n_base_embed;
  }
}
