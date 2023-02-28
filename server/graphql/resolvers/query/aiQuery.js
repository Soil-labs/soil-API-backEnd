const { AI } = require("../../../models/aiModel");
const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");
const axios = require("axios");

const fetch = require("node-fetch")

const { PineconeClient } = require("@pinecone-database/pinecone");
// import { PineconeClient } from "@pinecone-database/pinecone";
const { Configuration, OpenAIApi } = require("openai");

globalThis.fetch = fetch


function chooseAPIkey() {
  // openAI_keys = [
  //   "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",
  //   // "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",
  //   "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",
  //   "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",
  // ];
  openAI_keys = ["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"];

  // randomly choose one of the keys
  let randomIndex = Math.floor(Math.random() * openAI_keys.length);
  let key = openAI_keys[randomIndex];

  return key;
}

async function useGPT(prompt, temperature = 0.7) {
  const configuration = new Configuration({
    apiKey: "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",
  });
  const openai = new OpenAIApi(configuration);
  // let model = "text-curie-001";
  let model = "text-davinci-003";
  const response = await openai.createCompletion({
    model,
    prompt,
    temperature,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  // ----------- Clean up the Results ---------
  let generatedText = response.data.choices[0].text;

  // ----------- Clean up the Results ---------

  return generatedText;
}

async function findBestEmbedings(message,filter,topK = 3) {

  //  filter: {
  //   '_id': profileIDs[0]
  //    'label': "long_term_memory",
  // }
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east1-gcp",
    apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
  });


  const index = await pinecone.Index("profile-eden-information");


  embed = await createEmbedingsGPT(message)

  // console.log("embed = " , embed)
  

  let queryRequest = {
    topK: topK,
    vector: embed[0],
    includeMetadata: true,
  }

  if (filter != undefined){
    queryRequest = {
      ...queryRequest,
      filter: filter
    }
  }

  console.log("filter = " , filter)
  console.log("queryRequest = " , queryRequest)
  
  const queryResponse = await index.query({ queryRequest })


  console.log("queryResponse = " , queryResponse)

  // const contexts = queryResponse.matches.map(x => x.metadata.name + ": " + x.metadata.text);

  return queryResponse.matches;
}


async function createEmbedingsGPT(words_n) {
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


const DEFAULT_PAGE_LIMIT = 20;

module.exports = {
  findMessage: async (parent, args, context, info) => {
    const {
      request: { discordID, serverID },
      after,
      before,
      limit,
      sortBy,
    } = args.fields;
    console.log("Query > findMessage > args.fields = ", args.fields);

    if (!discordID && !serverID)
      throw new ApolloError("The discordID or serverID is required");

    try {
      let options = {
        limit: limit || DEFAULT_PAGE_LIMIT,
      };

      if (sortBy) {
        options.field = sortBy.field || "_id";
        options.sort = {
          [sortBy.field]: sortBy.direction == "ASC" ? 1 : -1,
        };
        options.direction = sortBy.direction == "ASC" ? 1 : -1;
      } else {
        options.field = "_id";
        options.sort = {
          _id: 1,
        };
        options.direction = 1;
      }

      let than_key_next = options.direction === 1 ? "$gt" : "$lt";
      let than_key_prev = options.direction === -1 ? "$gt" : "$lt";

      if (after) {
        let after_key = after;
        if (options.field === "_id") after_key = mongoose.Types.ObjectId(after);
        options.filters = {
          [options.field]: {
            [than_key_next]: after_key,
          },
        };
      } else if (before) {
        let before_key = before;
        if (options.field === "_id")
          before_key = mongoose.Types.ObjectId(before);
        options.filters = {
          [options.field]: {
            [than_key_prev]: before_key,
          },
        };
        options.sort[options.field] = -1 * options.sort[options.field];
      }

      let searchTerm = {};

      if (discordID && serverID) {
        searchTerm = {
          $and: [{ creator: discordID }, { serverID: serverID }],
        };
      } else if (discordID) {
        searchTerm = {
          $and: [{ creator: discordID }],
        };
      } else if (serverID) {
        searchTerm = {
          $and: [{ serverID: serverID }],
        };
      }

      let data = await AI.find({ ...searchTerm, ...options.filters })
        .sort(options.sort)
        .limit(options.limit);

      if (before) data.reverse();

      let hasNextPage =
        data.length > 0
          ? !!(await AI.findOne({
              ...searchTerm,
              [options.field]: {
                [than_key_next]: data[data.length - 1][options.field],
              },
            }))
          : !!before;

      let hasPrevPage =
        data.length > 0
          ? !!(await AI.findOne({
              ...searchTerm,
              [options.field]: {
                [than_key_prev]: data[0][options.field],
              },
            }))
          : !!after;

      return {
        data,
        pageInfo: {
          hasNextPage,
          hasPrevPage,
          start: data.length > 0 ? data[0][options.field] : after,
          end: data.length > 0 ? data[data.length - 1][options.field] : before,
        },
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMessage",
        {
          component: "aiQuery > findMessage",
        }
      );
    }
  },
  edenGPTreply: async (parent, args, context, info) => {
    const { message } = args.fields;
    console.log("Query > edenGPTreply > args.fields = ", args.fields);
    try {

      const configuration = new Configuration({
        apiKey: "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",
      });
      const openai = new OpenAIApi(configuration);

      console.log("change = 1" )

      // -------------- Find Reply -------------
      const response = await openai.createCompletion({
        model: "davinci:ft-eden-protocol-2023-02-22-13-21-15",
        prompt: message + "\nReply:",
        temperature: 0.7,
        stop: ["==END=="],
        max_tokens: 500,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0,
      });
    
      let replyEden = response.data.choices[0].text;
      // -------------- Find Reply -------------

      console.log("change = 2" )


      // -------------- Find Keywords -------------
      // let keywordsEdenArray = [];
      const response_keywords = await openai.createCompletion({
        model: "curie:ft-eden-protocol-2023-02-23-08-44-12",
        prompt: message + "\nKeywords:",
        temperature: 0.7,
        stop: ["==END=="],
        max_tokens: 300,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0,
      });
    
      let keywordsEden = response_keywords.data.choices[0].text;
      // console.log("keywordsEden = " , keywordsEden)

      var keywordsEdenArray = keywordsEden.split(',');
      // -------------- Find Keywords -------------

      console.log("change = 3" )

      return {
        reply: replyEden,
        keywords: keywordsEdenArray
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTreply",
        {
          component: "aiQuery > edenGPTreply",
        }
      );
    }
  },
  edenGPTreplyMemory: async (parent, args, context, info) => {
    const { message,memorySort,userID } = args.fields;
    console.log("Query > edenGPTreplyMemory > args.fields = ", args.fields);
    try {

      const filter = {
        label: "long_term_memory",
      }
      if (userID) {
        filter._id = userID;
      }

      longTermMemories = await findBestEmbedings(message,filter ,topK = 3)

      // console.log("longTermMemories = " , longTermMemories)
      // ads

      
      let prompt_longTermMemory = "Long Term Memory:";
      for (let i = 0; i < longTermMemories.length; i++) {

        prompt_longTermMemory = prompt_longTermMemory + "\n" + longTermMemories[i].metadata.text;
      }

      console.log("prompt_longTermMemory = " , prompt_longTermMemory)
      // asdf

      prompot_General = `
      You are playing the role of Eden
      - Eden is an recruiter that match projects to people, so it tries to find the best person for the job

      - Eden is an expert recruiter that knows exactly the role that the manager is looking for so it can ask really insightful quesitons in order to uderstand the skills and expertise that the candidate should have

      - Eden only ask one quesiton at a time
      - ask questions back to uderstand in detail the skills and expertise that the candidate should have!!
      `

      prompot_General = prompot_General + "\n" + prompt_longTermMemory ;

      // console.log("prompot_General = 1" , prompot_General)

      if (memorySort) {
        prompot_General = prompot_General + "\n\n\n" + "Conversation so far: " + memorySort;
      }

      // console.log("prompot_General = 2" , prompot_General)

      prompot_General = prompot_General + "\n\n\n" + "Question from user: " + "\n"+message + "\n" + "Reply:";


      // console.log("prompot_General = 3" , prompot_General)
      // asdf

      reply = useGPT(prompot_General)


      // -------------- Find Keywords -------------
      const configuration = new Configuration({
        apiKey: "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",
      });
      const openai = new OpenAIApi(configuration);
      // let keywordsEdenArray = [];
      const response_keywords = await openai.createCompletion({
        model: "curie:ft-eden-protocol-2023-02-23-08-44-12",
        prompt: message + "\nKeywords:",
        temperature: 0.7,
        stop: ["==END=="],
        max_tokens: 300,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0,
      });
    
      let keywordsEden = response_keywords.data.choices[0].text;
      // console.log("keywordsEden = " , keywordsEden)

      var keywordsEdenArray = keywordsEden.split(',');

      // delete any empty string
      keywordsEdenArray = keywordsEdenArray.filter(function (el) {
        return el != "";
      });
      
      // -------------- Find Keywords -------------


      return {
        reply: reply,
        keywords: keywordsEdenArray
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTreplyMemory",
        {
          component: "aiQuery > edenGPTreplyMemory",
        }
      );
    }
  },
  edenGPTsearchProfiles: async (parent, args, context, info) => {
    const { message,profileIDs } = args.fields;
    console.log("Query > edenGPTsearchProfiles 22> args.fields = ", args.fields);
    try {



      const pinecone = new PineconeClient();
      await pinecone.init({
        environment: "us-east1-gcp",
        apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
      });


      const index = await pinecone.Index("profile-eden-information");


      embed = await createEmbedingsGPT(message)

      

      let queryRequest = {
        topK: 3,
        vector: embed[0],
        includeMetadata: true,
      }

      if (profileIDs!= undefined){
        queryRequest = {
          ...queryRequest,
          filter: {
            '_id': profileIDs[0]
          }
        }
      }
      
      const queryResponse = await index.query({ queryRequest })


      console.log("queryResponse = " , queryResponse)

      const contexts = queryResponse.matches.map(x => x.metadata.name + ": " + x.metadata.text);

      

      const promptStart = "Answer the question based on the context below. \n\nContext:\n";
      const promptEnd = `\n\nQuestion: ${message}\nAnswer:`;

      const limit=3750
      let prompt = "";


      for (let i = 0; i < contexts.length; i++) {
        if (contexts.slice(0, i).join("\n\n---\n\n").length >= limit) {
          prompt = promptStart + "\n\n---\n\n" + contexts.slice(0, i-1).join("\n\n---\n\n") + promptEnd;
          break;
        } else if (i === contexts.length - 1) {
          prompt = promptStart + "\n\n---\n\n" + contexts.join("\n\n---\n\n") + promptEnd;
        }
      }

      console.log("prompt = ",prompt);
      // asdf1

      
      const configuration = new Configuration({
        apiKey: "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",
      });
      const openai = new OpenAIApi(configuration);

       // -------------- Find Reply -------------
       const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.0,
        // stop: ["==END=="],
        max_tokens: 300,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0,
      });
    
      let replyEden = response.data.choices[0].text;
      // -------------- Find Reply -------------

      return {
        reply: replyEden,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTsearchProfiles",
        {
          component: "aiQuery > edenGPTsearchProfiles",
        }
      );
    }
  },
  
};
