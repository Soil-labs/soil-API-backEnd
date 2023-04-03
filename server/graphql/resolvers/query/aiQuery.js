const { AI } = require("../../../models/aiModel");
const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");

const { ApolloError } = require("apollo-server-express");
const mongoose = require("mongoose");
const axios = require("axios");

const fetch = require("node-fetch");

const { PineconeClient } = require("@pinecone-database/pinecone");
// import { PineconeClient } from "@pinecone-database/pinecone";
const { Configuration, OpenAIApi } = require("openai");

const { printC } = require("../../../printModule");

globalThis.fetch = fetch;

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

function remapValues(data, min, max, newMin, newMax) {
  const range = max - min;
  const newRange = newMax - newMin;
  for (let i = 0; i < data.length; i++) {
    const normalizedValue = (data[i].value - min) / range;
    const newValue = normalizedValue * newRange + newMin;
    data[i].value = Math.round(newValue);
  }
  return data;
}
async function useGPT(prompt, temperature = 0.7, model = "text-davinci-003") {
  const configuration = new Configuration({
    apiKey: "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",
  });
  const openai = new OpenAIApi(configuration);
  // let model = "text-curie-001";
  // let model = "text-davinci-003";
  const response = await openai.createCompletion({
    model: model,
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

async function useGPTchatHelloWorld() {
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: [{ role: "user", content: "Hello!" }],
      model: "gpt-3.5-turbo",
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

async function useGPTchat(
  userNewMessage,
  discussion,
  systemPrompt,
  userQuestion = "",
  temperature = 0.7
) {
  discussion.unshift({
    role: "system",
    content: systemPrompt,
  });

  discussion.push({
    role: "user",
    content: userNewMessage + "\n" + userQuestion,
  });

  console.log("discussion = ", discussion);

  let OPENAI_API_KEY = chooseAPIkey();
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
  // console.log("response = " , response)

  // console.log("response.data = " , response.data)

  return response.data.choices[0].message.content;
}

async function useGPTchatSimple(prompt, temperature = 0.7) {
  discussion = [
    {
      role: "user",
      content: prompt,
    },
  ];

  let OPENAI_API_KEY = chooseAPIkey();
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

  return response.data.choices[0].message.content;
}
async function useGPT4Simple(prompt, temperature = 0.7) {
  discussion = [
    {
      role: "user",
      content: prompt,
    },
  ];

  let OPENAI_API_KEY = chooseAPIkey();
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

async function findBestEmbedings(message, filter, topK = 3) {
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

  embed = await createEmbedingsGPT(message);

  // console.log("embed = " , embed)

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

  // console.log("filter = " , filter)
  // console.log("queryRequest = " , queryRequest)

  const queryResponse = await index.query({ queryRequest });

  // console.log("change = " , change)

  // console.log("queryResponse = " , queryResponse)

  // const contexts = queryResponse.matches.map(x => x.metadata.name + ": " + x.metadata.text);

  return queryResponse.matches;
}

async function findBestEmbedingsArray(arr, filter, topK = 3) {
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

  embed = await createEmbedingsGPT(arr);

  console.log("embed = ", embed);

  // matchesRes = []

  keywordsObj = {};

  for (let i = 0; i < embed.length; i++) {
    embedN = embed[i];

    let queryRequest = {
      topK: topK,
      vector: embed[i],
      includeMetadata: true,
      filter: {
        label: "AI_KG4_Context",
      },
    };

    let queryResponse = await index.query({ queryRequest });
    console.log("queryResponse.matches = ", queryResponse.matches);

    // matchesRes.push(queryResponse.matches[0])

    if (!keywordsObj[queryResponse.matches[0]?.metadata?.keyword]) {
      // keywordsObj[queryResponse.matches[0].metadata.keyword] = queryResponse.matches[0].score

      // matchesRes.push({
      //   score: queryResponse.matches[0].score,
      //   metaData: queryResponse.matches[0].metadata,
      //   originalKeywordMatch: arr[i],
      //   exactMatch: false,
      // })
      keywordsObj[queryResponse.matches[0].metadata.keyword] = {
        score: queryResponse.matches[0].score,
        metaData: queryResponse.matches[0].metadata,
        originalKeywordMatch: arr[i],
        exactMatch: false,
      };
    } else {
      if (
        queryResponse.matches[0].score >
        keywordsObj[queryResponse.matches[0]?.metadata?.keyword].score
      ) {
        // keywordsObj[queryResponse.matches[0].metadata.keyword] = queryResponse.matches[0].score
        // matchesRes.push({
        //   score: queryResponse.matches[0].score,
        //   metaData: queryResponse.matches[0].metadata,
        //   originalKeywordMatch: arr[i],
        //   exactMatch: false,
        // })
        keywordsObj[queryResponse.matches[0].metadata.keyword] = {
          score: queryResponse.matches[0].score,
          metaData: queryResponse.matches[0].metadata,
          originalKeywordMatch: arr[i],
          exactMatch: false,
        };
      }
    }
  }

  console.log("change = -------------------------------------- 0.2");

  for (let i = 0; i < embed.length; i++) {
    embedN = embed[i];

    let queryRequest = {
      topK: topK,
      vector: embed[i],
      includeMetadata: true,
      // filter: {
      //   // label:["AI_KG4","AI_KG4_Industry"],
      //   label: "AI_KG4",
      // }
      filter: { label: { $in: ["AI_KG4", "AI_KG4_Industry"] } },
    };

    let queryResponse = await index.query({ queryRequest });

    // matchesRes.push(queryResponse.matches)
    console.log("queryResponse.matches = 2", queryResponse.matches);

    if (!keywordsObj[queryResponse.matches[0]?.metadata?.keyword]) {
      console.log("change = -0------------------------------------- 0");

      // keywordsObj[queryResponse.matches[0].metadata.keyword] = queryResponse.matches[0].score

      // matchesRes.push({
      //   score: queryResponse.matches[0].score,
      //   metaData: queryResponse.matches[0].metadata,
      //   originalKeywordMatch: arr[i],
      //   exactMatch: true,
      // })
      keywordsObj[queryResponse.matches[0].metadata.keyword] = {
        score: queryResponse.matches[0].score,
        metaData: queryResponse.matches[0].metadata,
        originalKeywordMatch: arr[i],
        exactMatch: false,
      };
    } else {
      console.log("change = -------------------------------------- 1");
      if (
        queryResponse.matches[0].score >
        keywordsObj[queryResponse.matches[0]?.metadata?.keyword].score
      ) {
        //   keywordsObj[queryResponse.matches[0].metadata.keyword] = queryResponse.matches[0].score
        //   matchesRes.push({
        //     score: queryResponse.matches[0].score,
        //     metaData: queryResponse.matches[0].metadata,
        //     originalKeywordMatch: arr[i],
        //     exactMatch: true,
        //   })
        // }
        keywordsObj[queryResponse.matches[0].metadata.keyword] = {
          score: queryResponse.matches[0].score,
          metaData: queryResponse.matches[0].metadata,
          originalKeywordMatch: arr[i],
          exactMatch: false,
        };
      }
    }
  }
  // sdf

  console.log("keywordsObj = ", keywordsObj);

  // asdf

  const matchesRes = Object.keys(keywordsObj).map((key) => keywordsObj[key]);

  // console.log("matchesRes = " , matchesRes)
  // asf22

  // // const contexts = queryResponse.matches.map(x => x.metadata.name + ": " + x.metadata.text);

  return {
    matchesRes,
    matchesObj: keywordsObj,
  };
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
  edenGPTEndorseChatAPI: async (parent, args, context, info) => {
    const { message, conversation, userID } = args.fields;
    console.log("Query > edenGPTEndorseChatAPI > args.fields = ", args.fields);

    let systemPrompt = `
        You are an assistant tasked with evaluating the expertise level of an individual (the endorsee) based on an endorsement from another user (the endorser). Conduct a short conversation with the endorser, asking 2-5 questions to understand the endorsee's skill level in a specific area. Make sure your questions are relevant and progressively focus on the endorsee's expertise. Remember to ask one question at a time. After gathering sufficient information, conclude the conversation by directing the endorser to press the ENDORSE button on the bottom right of the screen.
    `;

    // userQuestion = `Ask me a question about the user's skills being reviewed should have based on the context that you have.`;
    let userQuestion = ``;

    try {
      responseGPTchat = await useGPTchat(
        message,
        conversation,
        systemPrompt,
        userQuestion
      );

      return {
        reply: responseGPTchat,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTEndorseChatAPI",
        {
          component: "aiQuery > edenGPTEndorseChatAPI",
        }
      );
    }
  },
  messageMapKG_V3: async (parent, args, context, info) => {
    const { message,assistantMessage } = args.fields;
    console.log("Query > messageMapKG_V3 > args.fields = ", args.fields);
    try {

      // // -------------- find keywords with GPT -------------
      //   prompt_general = "paragraph: " + message + "\n\n"

      
      //   prompt_general += "Find the minimum Keywords of the paragraph\n\n"

      //   prompt_general += "Keywords separated by comma:"

      //   keywordsGPTresult = await useGPTchatSimple(prompt_general)
      //   console.log("keywordsGPTresult ChatGPT= " , keywordsGPTresult)
      //   // -------------- find keywords with GPT -------------

        // -------------- find keywords with GPT V2-------------
        conversation =  [
          {"role": "assistant", "content": "Assistant: " + assistantMessage},
          {"role": "user", "content": "Last Message: " + message},
        ]


        
        keywordsGPTresult = await useGPTchat(
          "Find the minimum Skills based on the conversation \n Result, skills/keywords separated by comma:",
          conversation,
          "Your task is to take a 2 message conversation and find the skills based on the context"
        );
        console.log("keywordsGPTresult ChatGPT= " , keywordsGPTresult)
        if (keywordsGPTresult.includes("cannot find") || keywordsGPTresult.includes("cannot provide") || keywordsGPTresult.includes("I'm sorry")|| keywordsGPTresult.includes("cannot determine")
        || keywordsGPTresult.includes("unable to")|| keywordsGPTresult.includes("don't have access")){
          return [{}]
        }
      // -------------- find keywords with GPT V2-------------


    
        
        keywordsGPTresult = keywordsGPTresult.replace(/[\d.]/g, '');

        console.log("keywordsGPTresult = " , keywordsGPTresult)

        let GPTkeywords = keywordsGPTresult.split(/[,|]\s*/);
        
        console.log("GPTkeywords = " , GPTkeywords)
        // asdf9



      // -------------- Find best keywrods from embeding per keyword -------------
      let filter = {
        label: "AI_KG4_Context",
      }


      console.log("change = 1")

      // sdf4

      let resT = await findBestEmbedingsArray(GPTkeywords,filter ,topK = 1)
      console.log("change = 2")


      bestKeywordsFromEmbed = resT.matchesRes
      let keywordEmbedObj = resT.matchesObj


      console.log("keywordEmbedObj = " , keywordEmbedObj)
     

      finalKeywords = []
      testKeywords = []


      // --------------- prepare prompt keyword -----------
      keywords_str = ""
      numKeywords = 0
      for (let i = 0; i < bestKeywordsFromEmbed.length; i++) {
        const element = bestKeywordsFromEmbed[i];

        console.log("element = " , element)

        if (element.score >= 0.96){
          finalKeywords.push({
            keyword: element.metaData.keyword,
            confidence: parseInt(element.score*10),
          })
          continue;
        }

        if (element.exactMatch == false && element.score >= 0.74){
          keywords_str +=  element.metaData.keyword + "\n "

          numKeywords += 1

          // testKeywords.push(element.metaData.keyword)
          testKeywords.push({
            keyword: element.metaData.keyword,
            confidence: element.score,
          })
        }

        if (element.exactMatch == true && element.score >= 0.92){
          // keywords_str +=  element.metaData.keyword + " - "+element.originalKeywordMatch +"\n "
          keywords_str +=  element.metaData.keyword + "\n "

          numKeywords += 1

          // testKeywords.push(element.metaData.keyword)
          testKeywords.push({
            keyword: element.metaData.keyword,
            confidence: element.score,
          })

        }
      }
      
      keywords_str += "ReactJS" +"\n "
      keywords_str += "Angular" +"\n "
      keywords_str += "C++" +"\n "

      console.log("keywords_str = " , keywords_str)
      console.log(" " )
      // adf
      // --------------- prepare prompt keyword -----------


      //   // -------------- Find best keywrods from prompt engineering -------------
      //   prompt_general = "Given a paragraph, determine if the skills provided as input exist within it.  \n\n"
      //   prompt_general += "Paragraph: " + message + "\n\n"
      //   prompt_general += "Skills: " + keywords_str + "\n\n"
      //   prompt_general += "Answers for every skill only TRUE or FALSE : \n"
        

      //   console.log("prompt_general = " , prompt_general)


      //   // res_gpt = await useGPT(prompt_general,0.7,"text-davinci-003")
      //   res_gpt = await useGPTchatSimple(prompt_general)
      //   console.log("res_gpt davinci= " , res_gpt)
      // // -------------- Find best keywrods from prompt engineering -------------


      // -------------- Find best keywrods from prompt engineering V2-------------
       conversation =  [
        {"role": "assistant", "content": "Assistant: " + assistantMessage},
        {"role": "user", "content": "Last Message: " + message},
      ]


      
      res_gpt = await useGPTchat(
        "Determine if the skills provided as input exist within the conversation \n Answers for every skill only TRUE or FALSE: ",
        conversation
      );
      console.log("res_gpt ChatGPT= " , res_gpt)
      // -------------- Find best keywrods from prompt engineering V2-------------






        const trueFalseArr = res_gpt.split('\n').reduce((acc, str) => {
          const match = str.match(/(TRUE|FALSE)/);
          
          if (match) {
            acc.push(match[1]);
          }
          return acc;
        }, []);
        
        console.log("trueFalseArr = ",trueFalseArr);
        // sadf3

        console.log("-------------- " , "testKeywords[i]", "-------------")
        for (let i = 0; i < trueFalseArr.length; i++) {
          console.log("testKeywords[i] = " , testKeywords[i])
          if (trueFalseArr[i] == "TRUE" && testKeywords[i]?.keyword && testKeywords[i]?.confidence){
            finalKeywords.push({
              keyword: testKeywords[i].keyword,
              confidence: parseInt(testKeywords[i].confidence*10),
            })
          }
        }
        

        let nodeData = await Node.find({name: finalKeywords.map(value => value.keyword)}).select("_id name");

        nodeDataObj = {}
        nodeData.forEach((node) => {
          nodeDataObj[node.name] = node._id
        })

        finalKeywords = finalKeywords.map((value) => {
          return {
            ...value,
            nodeID: nodeDataObj[value.keyword]
          }
        })
        
      // sort an keywordsValues based on object value confidence 
      finalKeywords.sort((a, b) => (a.confidence > b.confidence) ? -1 : 1)

      return {
        keywords: finalKeywords,

      }

    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "messageMapKG_V3",
        {
          component: "aiQuery > messageMapKG_V3",
        }
      );
    }
  },
  edenGPTReviewChatAPI: async (parent, args, context, info) => {
    const { message, conversation, userID } = args.fields;
    console.log("Query > edenGPTReviewChatAPI > args.fields = ", args.fields);

    systemPrompt = `
      You are a Technical Performance Reviewer.  The only thing that you do is ask one question at a time to help understand the user's review another user on a project they worked together on.  You give as concise and short answers as possible.
      `;

    userQuestion = `Ask me a question about the user's skills being reviewed should have based on the context that you have.`;

    try {
      responseGPTchat = await useGPTchat(
        message,
        conversation,
        systemPrompt,
        userQuestion
      );

      return {
        reply: responseGPTchat,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTReviewChatAPI",
        {
          component: "aiQuery > edenGPTReviewChatAPI",
        }
      );
    }
  },
  messageMapKG_V2: async (parent, args, context, info) => {
    const { message } = args.fields;
    console.log("Query > messageMapKG_V2 > args.fields = ", args.fields);
    try {
      // -------------- find keywords with GPT -------------
      prompt_general = "paragraph: " + message + "\n\n";

      // prompt_general += "Find the keywords (keywords can represent a skill or a role) of the paragraph\n\n"
      // prompt_general += "Find the keywords of the paragraph\n\n"
      // prompt_general += "Find the minimum Skills/keywords of the paragraph\n\n"
      prompt_general += "Find the minimum Keywords of the paragraph\n\n";

      prompt_general += "Keywords separated by comma:";

      // res_gpt = await useGPTchatSimple(prompt_general)

      // keywordsGPTresult = await useGPT(prompt_general,0.7,"text-ada-001")
      // console.log("keywordsGPTresult ada= " , keywordsGPTresult)

      // keywordsGPTresult = await useGPT(prompt_general,0.7,"text-babbage-001")
      // console.log("keywordsGPTresult babbage= " , keywordsGPTresult)

      // keywordsGPTresult = await useGPT(prompt_general,0.7,"text-curie-001")
      // console.log("keywordsGPTresult curie= " , keywordsGPTresult)

      // sdf43
      // keywordsGPTresult = await useGPT(prompt_general,0.7,"text-davinci-003")
      // console.log("keywordsGPTresult davinci= " , keywordsGPTresult)

      keywordsGPTresult = await useGPTchatSimple(prompt_general);
      console.log("keywordsGPTresult ChatGPT= ", keywordsGPTresult);

      // asdf44

      // res_gpt = res_gpt.replace("Keywords:","")

      // console.log("res_gpt = " , res_gpt)
      // asdf4

      // keywordsGPTresult = 'machine learning, fine tuning, model'

      // keywordsGPTresult = `1.Dynamic computational graph, 2.PyTorch, 3. Complex models,`

      // keywordsGPTresult = keywordsGPTresult.replace(/[0-9]/g, '');
      keywordsGPTresult = keywordsGPTresult.replace(/[\d.]/g, "");

      console.log("keywordsGPTresult = ", keywordsGPTresult);

      let GPTkeywords = keywordsGPTresult.split(/[,|]\s*/);

      console.log("GPTkeywords = ", GPTkeywords);
      // asdf9
      // -------------- find keywords with GPT -------------

      // -------------- Find best keywrods from embeding per keyword -------------
      let filter = {
        label: "AI_KG4_Context",
      };

      console.log("change = 1");

      // sdf4

      let resT = await findBestEmbedingsArray(GPTkeywords, filter, (topK = 1));
      console.log("change = 2");

      bestKeywordsFromEmbed = resT.matchesRes;
      let keywordEmbedObj = resT.matchesObj;

      console.log("keywordEmbedObj = ", keywordEmbedObj);
      // asdf99

      // bestKeywordsFromEmbed =  [
      //   {
      //     score: 0.880061328,
      //     metaData: {
      //       category: 'Data Science',
      //       group: 'Software Development',
      //       keyword: 'Machine Learning',
      //       label: 'AI_KG4_Context',
      //       text: ' Machine Learning is a powerful skill that falls under the larger category of Data Science, which is part of the broader Software Development group. It enables users to create algorithms that can learn from data and make predictions or decisions without being explicitly programmed.',
      //       type: 'Skill'
      //     },
      //     originalKeywordMatch: 'machine learning',
      //     exactMatch: false,
      //   },
      //   {
      //     score: 0.795207322,
      //     metaData: {
      //       category: 'Model Optimization',
      //       group: 'Artificial Intelligence and Machine Learning',
      //       keyword: 'Hyperparameter Tuning',
      //       label: 'AI_KG4_Context',
      //       text: ' Hyperparameter Tuning is a skill that falls under the category of Model Optimization and is part of the larger field of Artificial Intelligence and Machine Learning. It involves optimizing the parameters of a model to improve its performance and accuracy.',
      //       type: 'Skill'
      //     },
      //     originalKeywordMatch: 'fine tuning',
      //     exactMatch: false,
      //   },
      //   {
      //     score: 0.788156271,
      //     metaData: {
      //       category: 'Natural Language Processing',
      //       group: 'Artificial Intelligence and Machine Learning',
      //       keyword: 'Transformer Models',
      //       label: 'AI_KG4_Context',
      //       text: ' Transformer Models are a powerful skill within the Natural Language Processing field of Artificial Intelligence and Machine Learning. They are used to process and interpret natural language data, allowing for more accurate and efficient analysis of text.',
      //       type: 'Skill'
      //     },
      //     originalKeywordMatch: 'model',
      //     exactMatch: false,
      //   },
      //   {
      //     score: 1.00000012,
      //     metaData: {
      //       category: 'Skill',
      //       keyword: 'Machine Learning',
      //       keyword_simple: 'machine learning',
      //       label: 'AI_KG4',
      //       text: 'machine learning'
      //     },
      //     originalKeywordMatch: 'machine learning',
      //     exactMatch: true,
      //   },
      //   {
      //     score: 0.878976464,
      //     metaData: {
      //       category: 'Skill',
      //       keyword: 'Performance tuning',
      //       keyword_simple: 'performance tuning',
      //       label: 'AI_KG4',
      //       text: 'performance tuning'
      //     },
      //     originalKeywordMatch: 'fine tuning',
      //     exactMatch: true,
      //   },
      //   {
      //     score: 0.858986,
      //     metaData: {
      //       category: 'Category',
      //       keyword: 'Design',
      //       keyword_simple: 'design',
      //       label: 'AI_KG4',
      //       text: 'design'
      //     },
      //     originalKeywordMatch: 'model',
      //     exactMatch: true,
      //   }
      // ]
      // console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)
      // asdf

      // let bestKeywordsFromEmbed = []
      // for (let i = 0; i < GPTkeywords.length; i++) {
      //   let keywordN = GPTkeywords[i]

      // let filter = {
      //   label: "AI_KG4_Context",
      // }

      //   let bestKeywordsFromEmbedNow = await findBestEmbedings(keywordN,filter ,topK = 1)
      //   bestKeywordsFromEmbedNow[0] = {
      //     ...bestKeywordsFromEmbedNow[0],
      //     originalKeyword: keywordN
      //   }
      //   bestKeywordsFromEmbed.push(bestKeywordsFromEmbedNow[0])
      // }

      // for (let i = 0; i < GPTkeywords.length; i++) {
      //   let keywordN = GPTkeywords[i]

      //   let filter = {
      //     label: "AI_KG4",
      //   }

      //   let bestKeywordsFromEmbedNow = await findBestEmbedings(keywordN,filter ,topK = 1)
      //   bestKeywordsFromEmbedNow[0] = {
      //     ...bestKeywordsFromEmbedNow[0],
      //     originalKeyword: keywordN
      //   }
      //   bestKeywordsFromEmbed.push(bestKeywordsFromEmbedNow[0])
      // }

      // console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)
      // // asdf45

      // -------------- Find best keywrods from embeding per keyword -------------

      // -------------- Find best keywrods from embeding -------------
      // let filter = {
      //   label: "AI_KG4_Context",
      // }
      // bestKeywordsFromEmbed = await findBestEmbedings(res_gpt,filter ,topK = 3)

      // filter = {
      //   label: "AI_KG4",
      // }
      // bestKeywordsFromEmbed2 = await findBestEmbedings(res_gpt,filter ,topK = 3)

      // // combine the two arrays
      // bestKeywordsFromEmbed = bestKeywordsFromEmbed.concat(bestKeywordsFromEmbed2)

      // console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)

      // bestKeywordsFromEmbed = await findBestEmbedingsArray(GPTkeywords,filter ,topK = 7)
      // bestKeywordsFromEmbed = await findBestEmbedings(res_gpt,filter ,topK = 7)

      // console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)
      // asdf41
      // -------------- Find best keywrods from embeding -------------

      // // -------------- map values of keywords -------------
      // // map bestKeywordsFromEmbed to a new object array that has the value and the keyword
      // let minValue = Infinity;
      // let maxValue = -Infinity;

      // let keywordValObj = {}
      // bestKeywordsFromEmbed_cl = bestKeywordsFromEmbed.map((obj) => {
      //   if (obj.score < minValue) {
      //     minValue = obj.score;
      //   }
      //   if (obj.score > maxValue) {
      //     maxValue = obj.score;
      //   }

      //   return {
      //     value: obj.score,
      //     originalValue: obj.score,
      //     keyword: obj.metadata.keyword,
      //     category: obj.metadata.category,
      //     context: obj.metadata.text,
      //   }
      // })

      // // console.log("bestKeywordsFromEmbed_cl = " , bestKeywordsFromEmbed_cl)
      // // console.log("minValue = " , minValue)
      // // console.log("maxValue = " , maxValue)

      // bestKeywordsFromEmbed_map = remapValues(bestKeywordsFromEmbed_cl, minValue, maxValue, 2, 10)
      // console.log("bestKeywordsFromEmbed_map = " , bestKeywordsFromEmbed_map)
      // // asfd1
      // // -------------- map values of keywords -------------

      finalKeywords = [];
      testKeywords = [];

      // --------------- prepare prompt keyword -----------
      keywords_str = "";
      numKeywords = 0;
      for (let i = 0; i < bestKeywordsFromEmbed.length; i++) {
        const element = bestKeywordsFromEmbed[i];

        console.log("element = ", element);

        if (element.score >= 0.96) {
          finalKeywords.push({
            keyword: element.metaData.keyword,
            confidence: parseInt(element.score * 10),
          });
          continue;
        }

        if (element.exactMatch == false && element.score >= 0.74) {
          // keywords_str +=  "Skill: " + element.metaData.keyword + " - Original Skill: "+element.originalKeywordMatch +"\n "
          // keywords_str +=  element.metaData.keyword + " - "+element.originalKeywordMatch +"\n "
          keywords_str += element.metaData.keyword + "\n ";

          numKeywords += 1;

          // testKeywords.push(element.metaData.keyword)
          testKeywords.push({
            keyword: element.metaData.keyword,
            confidence: element.score,
          });
        }

        if (element.exactMatch == true && element.score >= 0.92) {
          // keywords_str +=  element.metaData.keyword + " - "+element.originalKeywordMatch +"\n "
          keywords_str += element.metaData.keyword + "\n ";

          numKeywords += 1;

          // testKeywords.push(element.metaData.keyword)
          testKeywords.push({
            keyword: element.metaData.keyword,
            confidence: element.score,
          });
        }
      }

      // keywords_str += "Skill: Dance" + " = Original Skill: ReactJS" +"\n "
      // keywords_str += "Skill: node" + " = Original Skill: Angular" +"\n "
      // keywords_str += "Skill: VR" + " = Original Skill: C++" +"\n "

      // keywords_str += "Dance" + " - ReactJS" +"\n "
      // keywords_str += "node" + " - Angular" +"\n "
      // keywords_str += "VR" + " - C++" +"\n "
      keywords_str += "ReactJS" + "\n ";
      keywords_str += "Angular" + "\n ";
      keywords_str += "C++" + "\n ";

      console.log("keywords_str = ", keywords_str);
      console.log(" ");
      // adf
      // --------------- prepare prompt keyword -----------

      // -------------- Find best keywrods from prompt engineering -------------

      prompt_general =
        "Given a paragraph, determine if the skills provided as input exist within it.  \n\n";
      prompt_general += "Paragraph: " + message + "\n\n";
      prompt_general += "Skills: " + keywords_str + "\n\n";
      prompt_general += "Answers for every skill only TRUE or FALSE : \n";

      // prompt_general = "You have as input pairs of Skills, return if they have the same context   \n\n"
      // prompt_general += keywords_str + "\n\n"
      // prompt_general += "Answers for every pair only TRUE or FALSE : \n"

      console.log("prompt_general = ", prompt_general);

      // res_gpt = await useGPT(prompt_general,0.7,"text-davinci-003")
      res_gpt = await useGPTchatSimple(prompt_general);
      console.log("res_gpt davinci= ", res_gpt);

      // sadf

      const trueFalseArr = res_gpt.split("\n").reduce((acc, str) => {
        const match = str.match(/(TRUE|FALSE)/);
        // console.log("match = 1" , str.match(/: (TRUE|FALSE)$/))
        // console.log("match = 2" , str.match(/:(TRUE|FALSE)$/))
        // console.log("match = 3" , str.match(/(TRUE|FALSE)$/))
        // console.log("match = 4" , str.match(/(TRUE|FALSE)/))
        if (match) {
          acc.push(match[1]);
        }
        return acc;
      }, []);

      console.log("trueFalseArr = ", trueFalseArr);
      // sadf3

      console.log("-------------- ", "testKeywords[i]", "-------------");
      for (let i = 0; i < trueFalseArr.length; i++) {
        console.log("testKeywords[i] = ", testKeywords[i]);
        if (
          trueFalseArr[i] == "TRUE" &&
          testKeywords[i]?.keyword &&
          testKeywords[i]?.confidence
        ) {
          finalKeywords.push({
            keyword: testKeywords[i].keyword,
            confidence: parseInt(testKeywords[i].confidence * 10),
          });
        }
      }
      console.log("----------------------");
      console.log("finalKeywords = ", finalKeywords);
      // adf7
      // TODO:: ----
      // asdf

      let nodeData = await Node.find({
        name: finalKeywords.map((value) => value.keyword),
      }).select("_id name");

      nodeDataObj = {};
      nodeData.forEach((node) => {
        nodeDataObj[node.name] = node._id;
      });

      finalKeywords = finalKeywords.map((value) => {
        return {
          ...value,
          nodeID: nodeDataObj[value.keyword],
        };
      });
      console.log("finalKeywords = ", finalKeywords);
      // adf7
      // ------------- Put Results Together ----------

      // console.log("nodeData = " , nodeData)
      // console.log("keywordsNameOnly = " , keywordsNameOnly)
      // asf1

      // } else {
      //   keywordsValues = []
      // }
      // -------------- Find best keywrods from prompt engineering -------------

      // console.log("keywordValObj = " , keywordValObj)

      // console.log("keywordsValues = " , keywordsValues)

      // sort an keywordsValues based on object value confidence
      finalKeywords.sort((a, b) => (a.confidence > b.confidence ? -1 : 1));

      return {
        keywords: finalKeywords,
        // keywords: [{
        //   keyword:"Backend Development",
        //   confidence: 100,
        //   nodeID: "6416af7a48d9ba5ceefb6bf5"
        // },{
        //   keyword:"Backend Development2",
        //   confidence: 100,
        //   nodeID: "6416af7a48d9ba5ceefb6bf6"
        // },],
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "messageMapKG_V2",
        {
          component: "aiQuery > messageMapKG_V2",
        }
      );
    }
  },
  messageMapKG: async (parent, args, context, info) => {
    const { message } = args.fields;
    console.log("Query > messageMapKG > args.fields = ", args.fields);
    try {
      // -------------- Find best keywrods from embeding -------------
      const filter = {
        label: "AI_KG4_Context",
      };

      bestKeywordsFromEmbed = await findBestEmbedings(
        message,
        filter,
        (topK = 7)
      );

      // console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)
      // -------------- Find best keywrods from embeding -------------

      // -------------- map values of keywords -------------
      // map bestKeywordsFromEmbed to a new object array that has the value and the keyword
      let minValue = Infinity;
      let maxValue = -Infinity;

      let keywordValObj = {};
      bestKeywordsFromEmbed_cl = bestKeywordsFromEmbed.map((obj) => {
        if (obj.score < minValue) {
          minValue = obj.score;
        }
        if (obj.score > maxValue) {
          maxValue = obj.score;
        }

        return {
          value: obj.score,
          originalValue: obj.score,
          keyword: obj.metadata.keyword,
          category: obj.metadata.category,
          context: obj.metadata.text,
        };
      });

      // console.log("bestKeywordsFromEmbed_cl = " , bestKeywordsFromEmbed_cl)
      // console.log("minValue = " , minValue)
      // console.log("maxValue = " , maxValue)

      bestKeywordsFromEmbed_map = remapValues(
        bestKeywordsFromEmbed_cl,
        minValue,
        maxValue,
        2,
        10
      );
      console.log("bestKeywordsFromEmbed_map = ", bestKeywordsFromEmbed_map);
      // asfd1
      // -------------- map values of keywords -------------

      // --------------- prepare prompt keyword -----------
      keywords_str = "";
      numKeywords = 0;
      for (let i = 0; i < bestKeywordsFromEmbed_map.length; i++) {
        const element = bestKeywordsFromEmbed_map[i];

        if (!keywordValObj[element.keyword.toLowerCase().trim()]) {
          keywordValObj[element.keyword.toLowerCase().trim()] = {
            value: element.value,
            originalKeyword: element.keyword,
          };
        }

        if (element.value >= 4 && element.originalValue >= 0.74) {
          // if (element.value >= 6 && element.originalValue >= 0.76){
          // keywords_str += element.keyword + " | "
          // keywords_str += element.keyword + ": "  +element.context.replace("\n","").replace("\n","")+  " | \n\n"
          // keywords_str += element.keyword + ": " + element.value + " - " +element.context.replace("\n","").replace("\n","")+  " | "
          // keywords_str += element.keyword + ": " + element.value +  " | "
          keywords_str += "*" + element.keyword + "* \n ";

          numKeywords += 1;
        }
      }
      console.log("keywords_str = ", keywords_str);
      console.log(" ");
      // --------------- prepare prompt keyword -----------

      // -------------- Find best keywrods from prompt engineering -------------

      if (numKeywords > 0) {
        prompt_general = "paragraph: " + message + "\n\n";

        prompt_general += "keywords: " + keywords_str + "\n\n";

        // prompt_general += "You have as input a paragraph, and keywords together with their explanation \n\n"
        // prompt_general += "You have as input a paragraph, and keywords with the score of how related they are, from 0 to 10 together with their explanation \n\n"
        // prompt_general += "You have as input a paragraph, and keywords with the score of how related they are, from 0 to 10 \n\n"
        prompt_general += "You have as input a paragraph, and keywords \n\n";

        // prompt_general += "You try to find the skills and interest from the paragraph \n\n"

        prompt_general +=
          "Be Extremly cretical and choose ONLY keywords that exist on the paragraph! \n\n";

        prompt_general += "Always put keywords between * * \n\n";

        // prompt_general += "Choose the keywords that best describe the paragraph! you can give 0 keywords as response for no keywords! you can choose maximum 8 keywords \n\n" + "Result: "
        // prompt_general += "Choose the smallest number of keywords that describe accurately the paragraph! you can give 0 keywords as response for no keywords! you can choose maximum 8 keywords \n\n" + "Result: "
        // prompt_general += "Choose only keywords that exist on the paragraph! choose the smallest number of keywords to describe paragraph!  you can give 0 keywords as response for no keywords! you can choose maximum 8 keywords \n\n" + "Result: "
        // prompt_general += "Choose only keywords that exist on the paragraph! choose the smallest number of keywords to describe paragraph!  you can give 0 keywords as response for no keywords! \n\n" + "Result: "
        prompt_general +=
          "Choose the smallest number of keywords to describe paragraph!  you can give 0 keywords as response for no keywords! \n\n" +
          "Result: ";
        // prompt_general += "Try to choose the smallest number of keywords that best describe the paragraph! you can choose from 0 to 5 keywords \n\n" + "keywords: "
        // prompt_general += "Choose keywords that best describe the paragraph! Don't put any unesesary keywords! you can choose from 0 to 5 keywords \n\n" + "keywords: "

        // console.log("prompt_general = " , prompt_general)
        // asfd1

        // res_gpt = await useGPT(prompt_general,0.7,"text-curie-001")
        // res_gpt = await useGPT(prompt_general)
        res_gpt = await useGPTchatSimple(prompt_general);

        res_gpt = res_gpt.replace("Keywords:", "");

        console.log("res_gpt = ", res_gpt);

        // --------- Critisie the results ---------

        prompt_general = "paragraph: " + message + "\n\n";

        prompt_general += "keywords: " + res_gpt + "\n\n";

        prompt_general +=
          " Critisise this results! Judge if this keywords represent the paragraph that was given\n\n";
        // prompt_general += " Critisise this results! Judge if this keywords represent the paragraph that was given, Its better to say Wrong than Correct!! \n\n"
        prompt_general +=
          " Answers for every keyword can be, Correct, Wrong, Not Sure, you can only answere in the format of the examples \n\n";
        prompt_general +=
          " Example 1: React framework: Correct \n Javascript: Wrong \n\n";
        prompt_general +=
          " Example 2: next JS: Correct \n web development: Not Sure \n\n";
        // prompt_general += " Example 3: Not Sure \n\n"
        prompt_general += " Result: \n";

        Critic = await useGPTchatSimple(prompt_general);

        console.log("Critic = ", Critic);
        // asdf9

        // if (Critic.includes("|")) { // First format
        //   splitCritic = Critic.split("|")
        // } else { // Second format
        //   splitCritic = Critic.split("\n")
        // }

        // splitCritic.forEach(line => {
        //   console.log("line = " , line)
        //   if (line.includes('Wrong')) {
        //     // console.log('Wrong');
        //     keepKeyword.push(false)
        //   } else if (line.includes('Correct')) {
        //     // console.log('Correct');
        //     keepKeyword.push(true)
        //   } else {
        //     // console.log('Not Sure');
        //     keepKeyword.push(true) // SOS 🆘 -> this means that the critic is too easy, change here to make it harder

        //   }
        // });

        let CriticWords = Critic.split(":").map((word) => {
          if (word.indexOf("\n") != -1) {
            return word.substring(0, word.indexOf("\n")).trim();
          } else {
            return word.trim();
          }
        });
        console.log("CriticWords = ", CriticWords);
        CriticWords = CriticWords.slice(1);
        console.log("CriticWords = ", CriticWords);

        keepKeyword = [];
        CriticWords.forEach((line) => {
          if (line.includes("Wrong")) {
            keepKeyword.push(false);
          } else if (line.includes("Correct")) {
            keepKeyword.push(true);
          } else {
            keepKeyword.push(false); // SOS 🆘 -> this means that the critic is too easy, change here to make it harder
          }
        });

        console.log("keepKeyword = ", keepKeyword);

        // --------- Critisie the results ---------

        // ------------- Put Results Together ----------
        const regex = /\*(.*?)\*/g; // matches anything inside asterisks

        let match;
        let keywords = [];
        while ((match = regex.exec(res_gpt))) {
          // console.log(match[1]); // print each keyword
          keywords.push(match[1]);
        }
        // sadf5
        // if (res_gpt.includes(",")){
        //   keywords = res_gpt.split(",")
        // } else if (res_gpt.includes("|")){
        //   keywords = res_gpt.split("|")
        // } else {
        //   keywords = [res_gpt]
        // }

        keywords = keywords.map((strT) => strT.replace("\n", "").trim());

        console.log("keywords = ", keywords);

        keywordsValues = [];
        keywordsNameOnly = [];
        keywords.forEach((keyword, index) => {
          if (keepKeyword[index] == true) {
            let keyword_cl = keyword.split(":").shift();

            if (keywordValObj[keyword_cl.toLowerCase()]) {
              keywordsValues.push({
                keyword: keyword_cl,
                confidence: parseInt(
                  keywordValObj[keyword_cl.toLowerCase()].value
                ),
              });
              keywordsNameOnly.push(
                keywordValObj[keyword_cl.toLowerCase()].originalKeyword
              );
            }
          }
        });

        let nodeData = await Node.find({ name: keywordsNameOnly }).select(
          "_id name"
        );

        nodeDataObj = {};
        nodeData.forEach((node) => {
          nodeDataObj[node.name] = node._id;
        });

        keywordsValues = keywordsValues.map((keyword) => {
          return {
            ...keyword,
            nodeID: nodeDataObj[keyword.keyword],
          };
        });
        // ------------- Put Results Together ----------

        // console.log("nodeData = " , nodeData)
        // console.log("keywordsNameOnly = " , keywordsNameOnly)
        // asf1
      } else {
        keywordsValues = [];
      }
      // -------------- Find best keywrods from prompt engineering -------------

      // console.log("keywordValObj = " , keywordValObj)

      console.log("keywordsValues = ", keywordsValues);

      // sort an keywordsValues based on object value confidence
      keywordsValues.sort((a, b) => (a.confidence > b.confidence ? -1 : 1));

      return {
        keywords: keywordsValues,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "messageMapKG",
        {
          component: "aiQuery > messageMapKG",
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

      console.log("change = 1");

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

      console.log("change = 2");

      // // -------------- Find Keywords -------------
      // // let keywordsEdenArray = [];
      // const response_keywords = await openai.createCompletion({
      //   model: "curie:ft-eden-protocol-2023-02-23-08-44-12",
      //   prompt: message + "\nKeywords:",
      //   temperature: 0.7,
      //   stop: ["==END=="],
      //   max_tokens: 300,
      //   // top_p: 1,
      //   // frequency_penalty: 0,
      //   // presence_penalty: 0,
      // });

      // let keywordsEden = response_keywords.data.choices[0].text;
      // // console.log("keywordsEden = " , keywordsEden)

      // var keywordsEdenArray = keywordsEden.split(',');
      // // -------------- Find Keywords -------------

      console.log("change = 3");

      return {
        reply: replyEden,
        // keywords: keywordsEdenArray
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
    const { message, memorySort, userID } = args.fields;
    console.log("Query > edenGPTreplyMemory > args.fields = ", args.fields);
    try {
      const filter = {
        label: "long_term_memory",
      };
      if (userID) {
        filter._id = userID;
      }

      longTermMemories = await findBestEmbedings(message, filter, (topK = 3));

      // console.log("longTermMemories = " , longTermMemories)
      // ads

      let prompt_longTermMemory = "Long Term Memory:";
      for (let i = 0; i < longTermMemories.length; i++) {
        prompt_longTermMemory =
          prompt_longTermMemory + "\n" + longTermMemories[i].metadata.text;
      }

      console.log("prompt_longTermMemory = ", prompt_longTermMemory);
      // asdf

      prompot_General = `
      You are playing the role of Eden
      - Eden is an recruiter that match projects to people, so it tries to find the best person for the job

      - Eden is an expert recruiter that knows exactly the role that the manager is looking for so it can ask really insightful quesitons in order to uderstand the skills and expertise that the candidate should have

      - Eden only ask one quesiton at a time
      - ask questions back to uderstand in detail the skills and expertise that the candidate should have!!
      `;

      prompot_General = prompot_General + "\n" + prompt_longTermMemory;

      // console.log("prompot_General = 1" , prompot_General)

      if (memorySort) {
        prompot_General =
          prompot_General + "\n\n\n" + "Conversation so far: " + memorySort;
      }

      // console.log("prompot_General = 2" , prompot_General)

      prompot_General =
        prompot_General +
        "\n\n\n" +
        "Question from user: " +
        "\n" +
        message +
        "\n" +
        "Reply:";

      // console.log("prompot_General = 3" , prompot_General)
      // asdf

      reply = useGPT(prompot_General);

      // // -------------- Find Keywords -------------
      // const configuration = new Configuration({
      //   apiKey: "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",
      // });
      // const openai = new OpenAIApi(configuration);
      // // let keywordsEdenArray = [];
      // const response_keywords = await openai.createCompletion({
      //   model: "curie:ft-eden-protocol-2023-02-23-08-44-12",
      //   prompt: message + "\nKeywords:",
      //   temperature: 0.7,
      //   stop: ["==END=="],
      //   max_tokens: 300,
      //   // top_p: 1,
      //   // frequency_penalty: 0,
      //   // presence_penalty: 0,
      // });

      // let keywordsEden = response_keywords.data.choices[0].text;
      // // console.log("keywordsEden = " , keywordsEden)

      // var keywordsEdenArray = keywordsEden.split(',');

      // // delete any empty string
      // keywordsEdenArray = keywordsEdenArray.filter(function (el) {
      //   return el != "";
      // });

      // // -------------- Find Keywords -------------

      return {
        reply: reply,
        // keywords: keywordsEdenArray
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
  edenGPTreplyChatAPI: async (parent, args, context, info) => {
    const { message, conversation, userID } = args.fields;
    console.log("Query > edenGPTreplyChatAPI > args.fields = ", args.fields);
    try {
      // ----- ORIGINAL ------
      systemPrompt = `You are a recruiter, The only think that you do is ask only 1 questions at a time to understand the skills that the candidate should have.
      You give as consise as small answeres as possible`;
      // ----- ORIGINAL ------

      // // ----- TOM ------
      // systemPrompt = `You are an AI with the name Eden and you have access to a vibrant talent community.
      // You are acting as a specialized recruiter who knows everyone in the talent pool assisting a person in helping them find the exact candidate for their needs.
      // You ask one helpful question at a time. Your answers are concise and to the point. Your main objective is to help find the perfect candidate`
      // // ----- TOM ------

      // // ----- TOM 2------
      // systemPrompt = `You are an AI with the name Eden.
      // You are acting as a specialized recruiter who knows everyone in the talent pool assisting a person in helping them find the exact candidate for their needs.
      // You ask one helpful question at a time. Your answers are concise and to the point. Your main objective is to help find the perfect candidate
      // Only ask me 2 sentense question about skills that candidate should have based on the context`
      // // ----- TOM 2------

      responseGPTchat = await useGPTchat(
        message,
        conversation,
        systemPrompt,
        "ask me only 1 questino what other skills candidate should have based on the context that you have"
      );
      // responseGPTchat = await useGPTchat(message,conversation,systemPrompt)

      return {
        reply: responseGPTchat,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTreplyChatAPI",
        {
          component: "aiQuery > edenGPTreplyChatAPI",
        }
      );
    }
  },
  edenGPTreplyChatAPI_V2: async (parent, args, context, info) => {
    const { message, conversation } = args.fields;
    console.log("Query > edenGPTreplyChatAPI_V2 > args.fields = ", args.fields);
    try {
      // -------------- Find best keywrods from embeding -------------
      const filter = {
        label: "instructions_edenAI",
      };

      bestKeywordsFromEmbed = await findBestEmbedings(
        message,
        filter,
        (topK = 3)
      );

      printC(bestKeywordsFromEmbed, "1", "bestKeywordsFromEmbed", "b");
      // -------------- Find best keywrods from embeding -------------

      // -------------- Find best Instruction to use -----------
      prompt_T =
        "What is the most related command to use for the quesiton of the user \n\n";

      prompt_T += "Question: " + message + "\n\n";
      prompt_T +=
        "Command_1: " + bestKeywordsFromEmbed[0].metadata.text + "\n\n";
      prompt_T +=
        "Command_2: " + bestKeywordsFromEmbed[1].metadata.text + "\n\n";
      prompt_T +=
        "Command_3: " + bestKeywordsFromEmbed[2].metadata.text + "\n\n";

      prompt_T +=
        "Result just tell me to use the most related of the two. you can only say command_1, command_2, command_3 \n\n";

      printC(prompt_T, "1", "prompt_T", "r");

      reply = await useGPTchatSimple(prompt_T, 0.05);

      printC(reply, "2", "reply", "r");
      // sdf3
      // -------------- Find best Instruction to use -----------

      // // ----- ORIGINAL ------
      // systemPrompt = `You are a recruiter, The only think that you do is ask only 1 questions at a time to understand the skills that the candidate should have.
      // You give as consise as small answeres as possible`
      // // ----- ORIGINAL ------

      // // ----- TOM ------
      // systemPrompt = `You are an AI with the name Eden and you have access to a vibrant talent community.
      // You are acting as a specialized recruiter who knows everyone in the talent pool assisting a person in helping them find the exact candidate for their needs.
      // You ask one helpful question at a time. Your answers are concise and to the point. Your main objective is to help find the perfect candidate`
      // // ----- TOM ------

      // // ----- TOM 2------
      // systemPrompt = `You are an AI with the name Eden.
      // You are acting as a specialized recruiter who knows everyone in the talent pool assisting a person in helping them find the exact candidate for their needs.
      // You ask one helpful question at a time. Your answers are concise and to the point. Your main objective is to help find the perfect candidate
      // Only ask me 2 sentense question about skills that candidate should have based on the context`
      // // ----- TOM 2------

      // ----- Instruction auto choose ------
      systemPrompt = "";
      userQuestion = "";
      if (reply.includes("Command_1")) {
        systemPrompt = bestKeywordsFromEmbed[0].metadata.systemPrompt;
        userQuestion = bestKeywordsFromEmbed[0].metadata.userPrompt;
      } else if (reply.includes("Command_2")) {
        systemPrompt = bestKeywordsFromEmbed[1].metadata.systemPrompt;
        userQuestion = bestKeywordsFromEmbed[1].metadata.userPrompt;
      } else if (reply.includes("Command_3")) {
        systemPrompt = bestKeywordsFromEmbed[2].metadata.systemPrompt;
        userQuestion = bestKeywordsFromEmbed[2].metadata.userPrompt;
      } else {
        systemPrompt = "You are a recruiter, The only think that you do is ask only 1 questions at a time to understand the skills that the candidate should have. You give as consise as small answeres as possible"
        userQuestion = "ask me only 1 questino what other skills candidate should have based on the context that you have"
        // return {
        //   reply: "I don't understand what you mean",
        // }
      }
      // ----- Instruction auto choose ------

      // systemPrompt = "You are a recruiter, The only think that you do is ask only 1 questions at a time to understand the Industry and Sectors that the candidate shuold have worked on. You give as consise as small answeres as possible"
      // systemPrompt = "As a recruiter, I talk to a manager and try to uderstand what is the industry and sector experience that the candidate should have. My answers are concise and to the point."
      // userQuestion = "ask me 1 question related to what other Industries or Sectors the candidate should have worked on based on the context of the conversation"

      responseGPTchat = await useGPTchat(
        message,
        conversation,
        systemPrompt,
        userQuestion,
        0.3
      );
      // responseGPTchat = await useGPTchat(message,conversation,systemPrompt,"ask me only 1 questino what other skills candidate should have based on the context that you have")
      // responseGPTchat = await useGPTchat(message,conversation,systemPrompt)

      return {
        reply: responseGPTchat,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTreplyChatAPI_V2",
        {
          component: "aiQuery > edenGPTreplyChatAPI_V2",
        }
      );
    }
  },
  edenGPTsummaryProfile: async (parent, args, context, info) => {
    const { conversation, memberID } = args.fields;
    console.log(
      "Query > edenGPTsummaryProfile 22> args.fields = ",
      args.fields
    );
    try {
      // ----------- Find Nodes Member -----------
      const memberData = await Members.findOne({ _id: memberID }).select(
        "_id name nodes"
      );

      // console.log("memberData = " , memberData)

      const nodesID = memberData.nodes.map((node) => {
        return node._id;
      });

      // console.log("nodesID = " , nodesID)

      const nodesData = await Node.find({ _id: { $in: nodesID } }).select(
        "_id name"
      );

      // console.log("nodesData = " , nodesData)

      // saf92
      // ----------- Find Nodes Member -----------

      // console.log("memberData = " , memberData)
      // sadf34

      // -------------- Prompt of the conversation ------------
      let prompt_conversation = "Conversation so far:";
      let roleN;
      for (let i = 0; i < conversation.length; i++) {
        roleN = "Manager";
        if (conversation[i].role == "assistant") roleN = "Recruiter";
        prompt_conversation =
          prompt_conversation + "\n" + roleN + ": " + conversation[i].content;
      }
      console.log("prompt_conversation = ", prompt_conversation);
      // adsf
      // -------------- Prompt of the conversation ------------

      // -------------- Search the conversation for related thinks for the user ------------
      const filter = {
        _id: memberID,
      };
      let bestEmbedProfile = await findBestEmbedings(
        prompt_conversation,
        filter,
        (topK = 5)
      );
      console.log("bestEmbedProfile = ", bestEmbedProfile);

      let promptcontexts = "information of the user: \n";
      promptcontexts += bestEmbedProfile.map((x) => x.metadata.text);

      // // --------- Add skills user -------
      // promptcontexts += "\n\n Skills that the user has: \n"
      // promptcontexts += nodesData.map(x => x.name+" ");
      // // --------- Add skills user -------

      console.log("promptcontexts = ", promptcontexts);
      // -------------- Search the conversation for related thinks for the user ------------

      // ------------ Sumary of Profile for the conversation -------------
      prompt_summary = "";
      prompt_summary +=
        "Conversation of manager and recruiter, goal is to find a new Employ: \n" +
        prompt_conversation;

      // prompt_summary = prompt_summary + "\n\n" + "Information that the recruiter has about the User: \n" + promptcontexts
      prompt_summary =
        prompt_summary + "\n\n" + "Information User: \n" + promptcontexts;

      // prompt_summary = prompt_summary + "\n\n" + "Create a summary of the profile of the Employ that will be hyper relevant to the Manager!:"

      prompt_summary =
        prompt_summary +
        "\n\n" +
        "Don't ever lie and use information that User Don't have";

      // prompt_summary = prompt_summary + "\n\n" + "output should be one small sentence and 3 small bullet points:"
      prompt_summary =
        prompt_summary +
        "\n\n" +
        "Summarise with 3 small bullet points the User with information that is related to what the manager is looking for:";

      // prompt_summary = prompt_summary + "\n\n" + "Highlight thte most importnat information start with symbol * end with symbol *"

      // keywordsGPTresult = await useGPT(prompt_summary,0.7,"text-babbage-001")
      // console.log("keywordsGPTresult babbage= -------=" , keywordsGPTresult)

      // reply = await useGPT(prompt_summary,0.7,"text-curie-001")
      // console.log("reply curie ------= " , reply)

      // reply = await useGPT(prompt_summary,0,"text-davinci-003")
      // console.log("reply curie ------= " , reply)

      reply = await useGPTchatSimple(prompt_summary, 0.05);

      console.log("reply chatGPT -------= ", reply);
      // ------------ Sumary of Profile for the conversation -------------

      return {
        reply: reply,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "edenGPTsummaryProfile",
        {
          component: "aiQuery > edenGPTsummaryProfile",
        }
      );
    }
  },
  edenGPTsearchProfiles: async (parent, args, context, info) => {
    const { message, profileIDs } = args.fields;
    console.log(
      "Query > edenGPTsearchProfiles 22> args.fields = ",
      args.fields
    );
    try {
      const pinecone = new PineconeClient();
      await pinecone.init({
        environment: "us-east1-gcp",
        apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
      });

      const index = await pinecone.Index("profile-eden-information");

      embed = await createEmbedingsGPT(message);

      let queryRequest = {
        topK: 3,
        vector: embed[0],
        includeMetadata: true,
      };

      if (profileIDs != undefined) {
        queryRequest = {
          ...queryRequest,
          filter: {
            _id: profileIDs[0],
          },
        };
      }

      const queryResponse = await index.query({ queryRequest });

      console.log("queryResponse = ", queryResponse);

      const contexts = queryResponse.matches.map(
        (x) => x.metadata.name + ": " + x.metadata.text
      );

      const promptStart =
        "Answer the question based on the context below. \n\nContext:\n";
      const promptEnd = `\n\nQuestion: ${message}\nAnswer:`;

      const limit = 3750;
      let prompt = "";

      for (let i = 0; i < contexts.length; i++) {
        if (contexts.slice(0, i).join("\n\n---\n\n").length >= limit) {
          prompt =
            promptStart +
            "\n\n---\n\n" +
            contexts.slice(0, i - 1).join("\n\n---\n\n") +
            promptEnd;
          break;
        } else if (i === contexts.length - 1) {
          prompt =
            promptStart +
            "\n\n---\n\n" +
            contexts.join("\n\n---\n\n") +
            promptEnd;
        }
      }

      console.log("prompt = ", prompt);
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
