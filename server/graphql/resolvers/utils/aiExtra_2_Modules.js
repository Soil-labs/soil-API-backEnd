require("dotenv").config();
const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const axios = require("axios");
const { PineconeClient } = require("@pinecone-database/pinecone");


async function onlyGPTchat(prompt, temperature = 0.7, chooseAPI = "API 1") {
  let OPENAI_API_KEY = chooseAPIkey(chooseAPI);

  discussion = [
    {
      role: "user",
      content: prompt,
    },
  ];

  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: "gpt-3.5-turbo",
      temperature: temperature,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  console.log("response.data = ", response.data);

  return response.data.choices[0].message.content;
}


async function onlyGPTDavinci(
  prompt,
  temperature = 0.7,
  chooseAPI = "API 1",
  max_tokens = 3000
) {
  const configuration = new Configuration({
    apiKey: chooseAPIkey(chooseAPI),
  });

  const openai = new OpenAIApi(configuration);

  // let model = "text-curie-001";
  let model = "text-davinci-003";
  const response = await openai.createCompletion({
    model,
    prompt,
    temperature,
    max_tokens: max_tokens,
  });

  // ----------- Clean up the Results ---------
  let generatedText = response.data.choices[0].text;

  // ----------- Clean up the Results ---------

  return generatedText;
}

async function useGPT4Simple(prompt, temperature = 0.7,chooseAPI = "API 1") {
  discussion = [
    {
      role: "user",
      content: prompt,
    },
  ];

  let OPENAI_API_KEY = chooseAPIkey(chooseAPI);
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: "gpt-4",
      temperature: temperature,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.choices[0].message.content;
}

async function useGPTchatSimple(
  prompt,
  temperature = 0.7,
  chooseAPI = "API 1",
  useMode = "chatGPT"
) {
  let success = false;
  let retries = 0;
  let apiKey = chooseAPI;

  let extraTimeWait = 0;

  let resContent;
  while (!success && retries < 4) {
    try {
      console.log("TRY OPENAI = ", apiKey, useMode);

      if (useMode == "chatGPT")
        resContent = await onlyGPTchat(prompt, temperature, apiKey);
      else if (useMode == "davinci") {
        resContent = await onlyGPTDavinci(prompt, temperature, apiKey);
      } else if (useMode == "chatGPT4") {
        resContent = await useGPT4Simple(prompt, temperature, apiKey);
      }
      success = true;
    } catch (e) {
      console.log("Error OpenAI = ", e.response);

      // Sleep for a while before trying again
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Switch to the other API key
      apiKey = apiKey === "API 1" ? "API 2" : "API 1";
    }
    retries++;

    extraTimeWait += 2000;
  }

  if (!success) {
    console.error("Failed to get response from OpenAI API");
    return;
  }

  // console.log("resContent = ", resContent);

  return resContent;
}

function chooseAPIkey(chooseAPI = "") {

  let openAI_keys = [process.env.REACT_APP_OPENAI_1];

  if (chooseAPI == "API 2") {
    openAI_keys = [process.env.REACT_APP_OPENAI_2];
  } else if (chooseAPI == "API 1") {
    openAI_keys = [process.env.REACT_APP_OPENAI_1];
  }

  // randomly choose one of the keys
  let randomIndex = Math.floor(Math.random() * openAI_keys.length);
  let key = openAI_keys[randomIndex];

  return key;
}

async function createEmbeddingsGPT(words_n) {
  // words_n = ["node.js", "react", "angular"];
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: words_n,
      // model: "text-similarity-davinci-001",
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



async function findBestEmbedings(message, filter, topK = 3) {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east1-gcp",
    apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
  });

  const index = await pinecone.Index("profile-eden-information");

  embed = await createEmbeddingsGPT(message);

  let queryRequest = {
    topK: topK,
    vector: embed[0],
    includeMetadata: true,
  };

  if (filter != undefined) {
    queryRequest = {
      ...queryRequest,
      filter: filter,
    };
  }

  const queryResponse = await index.query({ queryRequest });

  return queryResponse.matches;
}

module.exports = {
  findBestEmbedings,
  useGPTchatSimple,
};
