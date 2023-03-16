const { AI } = require("../../../models/aiModel");
const { Node } = require("../../../models/nodeModal");

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



function remapValues(data, min, max, newMin, newMax) {
  const range = max - min;
  const newRange = newMax - newMin;
  for (let i = 0; i < data.length; i++) {
    const normalizedValue = (data[i].value - min) / range;
    const newValue = (normalizedValue * newRange) + newMin;
    data[i].value = Math.round(newValue);
  }
  return data;
}
async function useGPT(prompt, temperature = 0.7,model="text-davinci-003") {
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

async function useGPTchatHelloWorld () {
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: [{"role": "user", "content": "Hello!"}],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );


  return response.data.choices[0].message.content

}

async function useGPTchat(userNewMessage,discussion,systemPrompt,userQuestion = "") {
  
  discussion.push({
    "role": "user",
    "content": userNewMessage + "\n" + userQuestion
  })


  discussion.unshift({
    "role": "system", 
    "content": systemPrompt
  });

  console.log("discussion = " , discussion)
  
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: "gpt-3.5-turbo",
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

async function useGPTchatSimple(prompt) {
  
  discussion = [{
    "role": "user",
    "content": prompt
  }]


  
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
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
  messageMapKG: async (parent, args, context, info) => {
    const { message } = args.fields;
    console.log("Query > messageMapKG > args.fields = ", args.fields);
    try {


      // -------------- Find best keywrods from embeding -------------
      const filter = {
        label: "KnowledgeGraph",
      }

      bestKeywordsFromEmbed = await findBestEmbedings(message,filter ,topK = 20)

      console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)
      // -------------- Find best keywrods from embeding -------------



      // -------------- map values of keywords -------------
      // map bestKeywordsFromEmbed to a new object array that has the value and the keyword
      let minValue = Infinity;
      let maxValue = -Infinity;

      let keywordValObj = {}
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
        }
      })

      console.log("bestKeywordsFromEmbed_cl = " , bestKeywordsFromEmbed_cl)
      console.log("minValue = " , minValue)
      console.log("maxValue = " , maxValue)

      bestKeywordsFromEmbed_map = remapValues(bestKeywordsFromEmbed_cl, minValue, maxValue, 2, 10)
      console.log("bestKeywordsFromEmbed_map = " , bestKeywordsFromEmbed_map)
      // asfd1
      // -------------- map values of keywords -------------



      // --------------- prepare prompt keyword -----------
      keywords_str = ""
      numKeywords = 0
      for (let i = 0; i < bestKeywordsFromEmbed_map.length; i++) {
        const element = bestKeywordsFromEmbed_map[i];

        if (!keywordValObj[element.keyword.toLowerCase().trim()]) {
          keywordValObj[element.keyword.toLowerCase().trim()] = {
            value: element.value,
            originalKeyword: element.keyword,
          }
        }
        
        if (element.value >= 5 && element.originalValue >= 0.74){
          // if (element.value >= 6 && element.originalValue >= 0.76){
          // keywords_str += element.keyword + " | "
          // keywords_str += element.keyword + ": "  +element.context.replace("\n","").replace("\n","")+  " | \n\n"
          // keywords_str += element.keyword + ": " + element.value + " - " +element.context.replace("\n","").replace("\n","")+  " | "
          keywords_str += element.keyword + ": " + element.value +  " | "

          numKeywords += 1
        }
      }
      // console.log("keywords_str = " , keywords_str)
      // --------------- prepare prompt keyword -----------


      // -------------- Find best keywrods from prompt engineering -------------

      if (numKeywords > 0){
        prompt_general = "paragraph: " + message + "\n\n"


        prompt_general += "keywords: " + keywords_str + "\n\n"

        // prompt_general += "You have as input a paragraph, and keywords together with their explanation \n\n"
        // prompt_general += "You have as input a paragraph, and keywords with the score of how related they are, from 0 to 10 together with their explanation \n\n"
        prompt_general += "You have as input a paragraph, and keywords with the score of how related they are, from 0 to 10 \n\n"

        // prompt_general += "You try to find the skills and interest from the paragraph \n\n"


        // prompt_general += "Choose the keywords that best describe the paragraph! you can give 0 keywords as response for no keywords! you can choose maximum 8 keywords \n\n" + "Result: "
        // prompt_general += "Choose the smallest number of keywords that describe accurately the paragraph! you can give 0 keywords as response for no keywords! you can choose maximum 8 keywords \n\n" + "Result: "
        prompt_general += "Choose only keywords that exist on the paragraph! choose the smallest number of keywords to describe paragraph!  you can give 0 keywords as response for no keywords! you can choose maximum 8 keywords \n\n" + "Result: "
        // prompt_general += "Try to choose the smallest number of keywords that best describe the paragraph! you can choose from 0 to 5 keywords \n\n" + "keywords: "
        // prompt_general += "Choose keywords that best describe the paragraph! Don't put any unesesary keywords! you can choose from 0 to 5 keywords \n\n" + "keywords: "

        console.log("prompt_general = " , prompt_general)
        // asfd1

        // res_gpt = await useGPT(prompt_general,0.7,"text-curie-001")
        // res_gpt = await useGPT(prompt_general)
        res_gpt = await useGPTchatSimple(prompt_general)

        console.log("res_gpt = " , res_gpt)

        
        if (res_gpt.includes(",")){
          keywords = res_gpt.split(",")
        } else if (res_gpt.includes("|")){
          keywords = res_gpt.split("|")
        } else {
          keywords = [res_gpt]
        }

        keywords = keywords.map(strT => strT.replace("\n", "").trim());

        keywordsValues = []
        keywordsNameOnly = []
        keywords.forEach( (keyword, index) => {
          // console.log("keyword,keywordValObj[keyword] = " , keyword,keywordValObj[keyword.toLowerCase()])

          // let arr = keyword.split(":");
          let keyword_cl = keyword.split(":").shift();

          if (keywordValObj[keyword_cl.toLowerCase()]){
            keywordsValues.push({
              keyword: keyword_cl,
              confidence: parseInt(keywordValObj[keyword_cl.toLowerCase()].value)
            })
            keywordsNameOnly.push(keywordValObj[keyword_cl.toLowerCase()].originalKeyword)
          } 
          // else {
          //   keywordsValues.push({
          //     keyword: keyword_cl,
          //     confidence: undefined
          //   })
          // }
        })

        let nodeData = await Node.find({name: keywordsNameOnly}).select("_id name");

        nodeDataObj = {}
        nodeData.forEach((node) => {
          nodeDataObj[node.name] = node._id
        })

        keywordsValues = keywordsValues.map((keyword) => {
          return {
            ...keyword,
            nodeID: nodeDataObj[keyword.keyword]
          }
        })

        // console.log("nodeData = " , nodeData)
        // console.log("keywordsNameOnly = " , keywordsNameOnly)
        // asf1



      } else {
        keywordsValues = []
      }
      // -------------- Find best keywrods from prompt engineering -------------

      console.log("keywordValObj = " , keywordValObj)

      console.log("keywordsValues = " , keywordsValues)
      
      // sort an keywordsValues based on object value confidence 
      keywordsValues.sort((a, b) => (a.confidence > b.confidence) ? -1 : 1)

      return {
        keywords: keywordsValues,
      }

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

      console.log("change = 3" )

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
    const { message,conversation,userID } = args.fields;
    console.log("Query > edenGPTreplyChatAPI > args.fields = ", args.fields);
    // try {

      systemPrompt = `
      You are a recruiter, The only think that you do is ask one questions at a time to understand the skills that the candidate should have.
      You give as consise as small answeres as possible
      `
      responseGPTchat = await useGPTchat(message,conversation,systemPrompt,"ask me questino what other skills candidate should have based on the cntext that you have")

      return {
        reply: responseGPTchat,
      };
    // } catch (err) {
    //   throw new ApolloError(
    //     err.message,
    //     err.extensions?.code || "edenGPTreplyChatAPI",
    //     {
    //       component: "aiQuery > edenGPTreplyChatAPI",
    //     }
    //   );
    // }
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
