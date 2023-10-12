const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Conversation } = require("../../../models/conversationModel");

const { ApolloError } = require("apollo-server-express");


const { Configuration, OpenAIApi } = require("openai");

const axios = require("axios");
const { PineconeClient } = require("@pinecone-database/pinecone");

const { request, gql } = require("graphql-request");

const { printC } = require("../../../printModule");

const {
  updateAnsweredQuestionFunc,
  findAndUpdateConversationFunc,
} = require("../utils/conversationModules");

const {
  addMultipleQuestionsToEdenAIFunc,
} = require("../utils/questionsEdenAIModules");
const { model } = require("mongoose");


const { REACT_APP_API_URL, REACT_APP_API_CRON_URL } = process.env;

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CandidateNotesEdenAIAPICallF = async (memberID, positionID) => {
  try {
    const query = gql`
      query candidateNotesEdenAI($fields: candidateNotesEdenAIInput) {
        candidateNotesEdenAI(fields: $fields) {
          categoryName
          score
          reason
        }
      }
    `;

    const variables = {
      fields: {
        memberID: memberID,
        positionID: positionID,
      },
    };

    printC(variables, "1", "variables", "r");

    res = await request(
      // "https://soil-api-backend-kgfromai2.up.railway.app/graphql",
      // "https://soil-api-backend-kgfromaicron.up.railway.app/graphql",
      REACT_APP_API_CRON_URL,
      query,
      variables
    );

    return res.candidateNotesEdenAI;
  } catch (err) {

    console.log( "err = " , err)
  
    return null;   
  }
};

async function useGPTchat(
  userNewMessage,
  discussionOld,
  systemPrompt,
  userQuestion = "",
  temperature = 0.7,
  chooseAPI = "API 1"
) {
  let discussion = [...discussionOld];

  discussion.unshift({
    role: "system",
    content: systemPrompt,
  });

  discussion.push({
    role: "user",
    content: userNewMessage + "\n" + userQuestion,
  });

  console.log("discussion = ", discussion);

  let OPENAI_API_KEY = chooseAPIkey(chooseAPI);
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

const gptFunctions = {
  giveExamplesCandidate: {
      name: "giveExamplesCandidate",
      description: "Collect Memories and Give Examples of a particular Candidate",
      parameters: {
          type: "object",
          properties: {
              topicOfInterest: {
                  type: "string",
                  description: "What topic the questioner is interested to know about the candidate",
              },
              extraInfo: {
                type: "string",
                description: "Extra information",
              },
          },
          required: ["topicOfInterest"],
      },
  },
  giveQualificationsCandidate: {
    name: "giveQualificationsCandidate",
    description: "Collect Memories and Give Qualifications of a particular Candidate",
    parameters: {
        type: "object",
        properties: {
            topicOfInterest: {
                type: "string",
                description: "What Qualifications the questioner is interested to know about the candidate",
            },
            extraInfo: {
              type: "string",
              description: "Extra information",
            },
        },
        required: ["topicOfInterest"],
    },
},
giveInformationRelatedToPosition: {
  name: "giveInformationRelatedToPosition",
  description: "Collect Memories and Give Information Related to the Position and Candidate, been used when there is questions around Position",
  parameters: {
      type: "object",
      properties: {
          question: {
              type: "string",
              description: "What is the question between the position and the candidate",
          },
      },
      required: ["question"],
    },
  },
  isCandidateAvailable: {
    name: "isCandidateAvailable",
    description: "search if candidate is still available for this position",
    parameters: {
        type: "object",
        properties: {
            detailsOfQuestion: {
                type: "string",
                description: "details of the question for availability of candidate",
            },
            extraInfo: {
              type: "string",
              description: "Extra information",
            },
        },
        required: ["detailsOfQuestion"],
    },
  },
  
}

async function useGPTFunc(
  discussionOld,
  systemPrompt,
  functionsUse,
  functionResult = {},
  temperature = 0.7,
  chooseAPI = "API 1"
) {

  // --------------- Add functions ----------------
  functionUseGPT = []

  for (let i = 0; i < functionsUse.length; i++) {
    if (gptFunctions[functionsUse[i]] != undefined) {
      functionUseGPT.push(gptFunctions[functionsUse[i]])
    }
  }
  // --------------- Add functions ----------------

  
  let discussion = [...discussionOld];

  discussion.unshift({
    role: "system",
    content: systemPrompt,
  });


  // ---------------- Add Result of function ----------------
  if (functionResult.role != undefined) {
    discussion.push(functionResult)
  }
  // ---------------- Add Result of function ----------------

  printC(discussion, "10", "discussion", "g")
  
  // let modelT = "gpt-3.5-turbo-0613";
  let modelT = "gpt-4-0613";

  let OPENAI_API_KEY = chooseAPIkey(chooseAPI);
  let response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: modelT,
      temperature: temperature,
      functions: functionUseGPT,
      function_call: "auto", 
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );

  printC(response.data.choices[0], "1", "response.data..choices[0]", "r")

  // Check if it is a function or if it is a normal message
  if (response.data.choices[0].message.content == null) { // Function
    // console.log(response.data.choices[0].message.function_call.arguments)
    printC(response.data.choices[0].message.function_call.arguments, "1", "response.data.choices[0].message.function_call.arguments", "r")


    // --------------- parse arguments of function ----------------
    let argFunc = response.data.choices[0].message.function_call.arguments

    const regex = /"([^"]+)":\s*"([^"]*)"/g;
    const matches = argFunc.matchAll(regex);
    const result = {};

    for (const match of matches) {
      const [, key, value] = match;
      result[key] = value;
    }

    console.log(result);
    // --------------- parse arguments of function ----------------


    return {
      content: null,
      function_call: {
        functionName: response.data.choices[0].message.function_call.name,
        ...result,
      },
    }
  } else { // message
    return {
      content: response.data.choices[0].message.content
    }
  }

  return {
    content: null
  }

}

async function chooseFunctionForGPT(resGPTFunc) {

  printC(resGPTFunc, "1", "resGPTFunc", "g")

  // run the function with name resGPTFunc.function_call.functionName

  funcOutput = {}

  if (resGPTFunc.function_call.functionName == "giveExamplesCandidate") {

    funcOutput = await giveQualificationsCandidate(resGPTFunc)


  } else if (resGPTFunc.function_call.functionName == "giveQualificationsCandidate") {

    funcOutput = await giveQualificationsCandidate(resGPTFunc)


  } else if (resGPTFunc.function_call.functionName == "giveInformationRelatedToPosition") {

    funcOutput = await  giveInformationRelatedToPosition(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "isCandidateAvailable") {

    funcOutput = await isCandidateAvailable(resGPTFunc)

  } else {

    console.log("this is a mistake there is not function")

  }

  funcOutput = {
    ...funcOutput,
    name: resGPTFunc.function_call.functionName
  }


  return funcOutput

}

async function isCandidateAvailable(funcInput) {


  funcOutput = {
    role: "function",
    content: "- there is no information about availability ask the user if they want me to ask the candidate",
  }

  return funcOutput

}


async function giveInformationRelatedToPosition(funcInput) {

  let {question} = funcInput.function_call
  let {userID,positionID} = funcInput


  let promptSearch = question + "\n\n"


  // ----------------- User -----------------
  let filter = {}
  
  filter.label = {"$in": ["CV_user_memory","conv_with_user_memory"]}
  filter._id = userID;

  printC(filter, "1", "filter", "b")


  longTermMemories_user = await findBestEmbedings(promptSearch, filter, (topK = 5), "User");

  printC(longTermMemories_user, "1", "longTermMemories_user", "b")
  // ----------------- User -----------------

  // ----------------- Position -----------------

  filter.label =  {"$in": ["requirements_position_memory","conv_for_position_memory"]}
  filter._id = positionID;

  longTermMemories_Position = await findBestEmbedings(promptSearch, filter, (topK = 5), "User");



  // ----------------- Position -----------------



  funcOutput = {
    role: "function",
    content: "",
    memoriesUser: longTermMemories_user,
    memoriesPosition: longTermMemories_Position,
  }

  funcOutputContent = "Memories User (delimited <>): <"
  for (let i = 0; i < longTermMemories_user.length; i++) {
    funcOutputContent += "- " + longTermMemories_user[i].metadata.text + "\n"
  }
  funcOutputContent += ">\n\n"


  funcOutputContent += "Memories Position (delimited <>): <"
  for (let i = 0; i < longTermMemories_Position.length; i++) {
    funcOutputContent += "- " + longTermMemories_Position[i].metadata.text + "\n"
  }
  funcOutputContent += "> \n\n"


  funcOutputContent += "Only Use Memories that are related to the Question!!!! "

  funcOutput.content = funcOutputContent

  printC(funcOutput, "1", "funcOutput", "b")

  // s9
  return funcOutput


}


async function giveQualificationsCandidate(funcInput) {

  let {topicOfInterest,extraInfo} = funcInput.function_call
  let {userID} = funcInput


  let promptSearch = topicOfInterest + "\n\n" + extraInfo

  filter = {}
  
  filter.label = {"$in": ["CV_user_memory","conv_with_user_memory"]}
  filter._id = userID;

  printC(filter, "1", "filter", "b")


  longTermMemories_userCV = await findBestEmbedings(promptSearch, filter, (topK = 5), "User");

  printC(longTermMemories_userCV, "1", "longTermMemories_userCV", "b")

  funcOutput = {
    role: "function",
    content: "",
    memories: longTermMemories_userCV
  }

  funcOutputContent = "All Memories collected: \n"

  for (let i = 0; i < longTermMemories_userCV.length; i++) {
    funcOutputContent += "- " + longTermMemories_userCV[i].metadata.text + "\n"
  }

  funcOutputContent += "Only Use Memories that are related to the Question!!!! "

  funcOutput.content = funcOutputContent

  printC(funcOutput, "1", "funcOutput", "b")

  // s9
  return funcOutput


}

async function useGPT4chat(
  userNewMessage,
  discussionOld,
  systemPrompt,
  userQuestion = "",
  temperature = 0.7,
  chooseAPI = "API 1"
) {
  let discussion = [...discussionOld];

  discussion.unshift({
    role: "system",
    content: systemPrompt,
  });

  if (userNewMessage != "") {
    discussion.push({
      role: "user",
      content: userNewMessage + "\n" + userQuestion,
    });
  }

  console.log("discussion = ", discussion);

  // ssd2

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


// Generates a random 6-digit ID
async function generateRandomID(numDigit = 8) {
  // Define a string of possible characters to choose from
  const possibleChars = "0123456789abcdefghijklmnopqrstuvwxyz";
  // Initialize an empty string to hold the ID
  let id = "";

  // Loop 6 times to generate each digit of the ID
  for (let i = 0; i < numDigit; i++) {
    // Generate a random index into the possibleChars string
    const randomIndex = Math.floor(Math.random() * possibleChars.length);
    // Get the character at the random index and add it to the ID
    id += possibleChars.charAt(randomIndex);
  }

  // Return the generated ID
  return id;
}


async function upsertEmbedingPineCone(data) {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east1-gcp",
    apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
  });

  const index = await pinecone.Index("profile-eden-information");

  id_message = await generateRandomID(8);

  const embed = await createEmbeddingsGPT(data.text);

  let metadata = {
    text: data.text,
    label: data.label,
  };

  if (data._id) {
    metadata = {
      ...metadata,
      _id: data._id,
    };
  }

  if (data.convKey) {
    metadata = {
      ...metadata,
      convKey: data.convKey,
    };
  }

  const upsertRequest = {
    vectors: [
      {
        id: id_message,
        values: embed[0],
        metadata: metadata,
      },
    ],
  };

  console.log("id_message = ", id_message);

  let upsertResponse = await index.upsert({ upsertRequest });

  upsertResponse = {
    ...upsertResponse,
    pineConeID: id_message,
  };

  return upsertResponse;
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

const categoryMessageCategoryEnum = {
  1: "GENERAL_CONVERSATION",
  2: "ASK_ABOUT_POSITION_ALREADY_APPLIED",
  3: "ASK_FIND_NEW_POSITION",
  4: "GIVE_MORE_INFO_ABOUT_BACKGROUND",
  5: "REJECT_CANDIDATE",
  6: "ACCEPT_CANDIDATE",
  7: "ASK_CANDIDATE",
  8: "PITCH_POSITION_CANDIDATE",
};

const categoryMessageCategoryEnumReverse = {
  "GENERAL_CONVERSATION":{
    number: 1,
    promptReply: "Reply to the message with a general conversation",
    promptInput: "General Conversation",
  } ,
  "ASK_ABOUT_POSITION_ALREADY_APPLIED":{
    number: 2,
    promptReply: "Reply to the message using the MEMORIES about the position",
    promptInput: "Asking about a position already applied",
  } ,
  "ASK_FIND_NEW_POSITION":{
    number: 3,
    promptReply: "Reply to the message by giving information about potential positions that can be a good fit using the MEMORIES",
    promptInput: "Asking to find a new position",
  } ,
  "GIVE_MORE_INFO_ABOUT_BACKGROUND":{
    number: 4,
    promptReply: "Thank him for the information and ask if there is anything else he wants to share",
    promptInput: "Giving more information about his background, knowledge, skills, experience, etc.",
  } ,
  "REJECT_CANDIDATE":{
    number: 5,
    promptReply: "Discuss about Rejection of candidate",
    promptInput: "Rejecting the candidate",
  },
  "ACCEPT_CANDIDATE":{
    number: 6,
    promptReply: "Discuss about Accepting the candidate",
    promptInput: "Accepting the candidate",
  },
  "ASK_CANDIDATE":{
    number: 7,
    promptReply: "Discuss about question that was asked to candidate",
    promptInput: "Asking the candidate a question",
  },
  "PITCH_POSITION_CANDIDATE":{
    number: 8,
    promptReply: "Discuss about the position that was pitched to the candidate",
    promptInput: "Pitching a position to the candidate",
  },

};


async function identifyCategoryFunc(message,currentState) {


  let currentStatePrompt = ""
  if (currentState != ""){
    currentStatePrompt = `Current State/Category: ${currentState}`
  }

  // ----------------- Create Prompt for all categories based on categoryMessageCategoryEnumReverse --------
  let chooseFollowingCategoryPrompt = ""
  let maxNum = 0
  for (const [key, value] of Object.entries(categoryMessageCategoryEnumReverse)) {
    chooseFollowingCategoryPrompt += `${value.number}. ${value.promptInput}\n`
    maxNum = value.number
  }

  console.log("chooseFollowingCategoryPrompt = " , chooseFollowingCategoryPrompt)
  // ----------------- Create Prompt for all categories based on categoryMessageCategoryEnumReverse --------




  let promptIDentifyCategory = `You have as input a message delimiters <>: <${message}>
  
  ${currentStatePrompt}
  
  - Your task is to identify the category of the message
  - You can choose from the following categories:
  ${chooseFollowingCategoryPrompt}
  
  - it can only be one of the 4 categories
  
  
  What is the Category of the message, please only reply with a number from 1 to ${maxNum} that corresponds to the category
  
  Category only a number from 1 to 4:`;


  let resContent = await useGPTchatSimple(promptIDentifyCategory, 0,"API 2");


  console.log("resContent = " , resContent)

  const match = resContent.match(/\d+/);
  const number = match ? parseInt(match[0]) : null;
  console.log(number); 

  console.log("categoryMessageCategoryEnum[number] = " , categoryMessageCategoryEnum[number])

  // sd22

  if (number != null) {
    return categoryMessageCategoryEnum[number]
  }
 

  return null;
}

async function replyToMessageBasedOnCategoryFunc(message, categoryEnum,discussionOld=[],memoriesPosition = "",memoriesCandidate = "") {

  console.log("discussionOld 232= " , discussionOld)

  replyEnumInfo = categoryMessageCategoryEnumReverse[categoryEnum];

  replyPrompt = replyEnumInfo.promptReply

  console.log("categoryEnum = " , categoryEnum)
  console.log("replyEnumInfo = " , replyEnumInfo)
  console.log("replyPrompt = " , replyPrompt)

    // const memoriesPosition = `
    // - User is applying for a position in Google
    // - User is a FrontEnd developer
    // - User has 5 years of experience in FrontEnd development`


  let memoriesPositionPrompt = ""
  // if (replyEnumInfo.number == 2 || replyEnumInfo.number == 3) {
    memoriesPositionPrompt = `Memories Position Applied (delimited <>): <${memoriesPosition}>`
  // }

  let memoriesCandidatePrompt = `Memories Candidate Applied (delimited <>): <${memoriesCandidate}>`


  printC(memoriesPositionPrompt, "1", "memoriesPositionPrompt", "r")
  printC(memoriesCandidatePrompt, "1", "memoriesCandidatePrompt", "r")

  // ss1

  // only use the memoriesPosition if replyEnumInfo is 2 or 3 with an if statment inside promptReplyTotal

  // let promptReplyTotal = `
  // ${replyPrompt}

  // ${memoriesPrompt}

  // - make a casual 1-4 sentence answer
  // This is the message that you should Reply <>: <${message}>`



  // console.log("promptReplyTotal = " , promptReplyTotal)


  // CV <>

  // TALENT INTERVIEWS <>
  
  // OPPORTUNITIES APPLIED <>
  systemPrompt = `
  
  You're a world-class talent agent named Eden.
  You are in 1 to 1 contact with your talent and you act as the bridge between talent & opportunities.
  You have access to your talent's CV & TALENT INTERVIEWS as well as the OPPORTUNITIES APPLIED.
  You always answer with care yet to the point.
  You are in contact with your talent through Telegram.
  Your main objective is to keep your talent feeling reassured, informed & valued.
  You don't shy away from quirky joke from now and then.
  
  When a user asks how you can help them, say that you can help them staying informed on the status of their applications, help them find other opportunities that might be a great match for them.
  Say that you can also help them doing mock or prep interviews as well as strategize/think about what their next best career step might be and what skills they might need to acquire for that.
  Do not make up information and never mention that you're an AI model.
  
  If you can't find an answer to the question that your talent is answering - say that you will check for them and get back to them as soon as they have an answer.
  If they keep pushing you, say that you're currently in beta and that a lot of your functionality is still being built out.
  Always follow up by mentioning the other things you can help with.
  
  ${memoriesPositionPrompt}

  ${memoriesCandidatePrompt}`

  // sd0

  // let resContent = await useGPTchatSimple(promptReplyTotal, 0,"API 1");
  // let resContent = await useGPTchat(
  //   promptReplyTotal,
  //   discussionOld,
  //   "",
  // );

  let resContent = await useGPT4chat( message,discussionOld,systemPrompt);

  console.log("resContent 2--2= " , resContent)

  return resContent;

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


function chooseAPIkey(chooseAPI = "") {
  // openAI_keys = [
  //   "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",
  //   // "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",
  //   "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",
  //   "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",
  // ];

  let openAI_keys = ["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"];

  if (chooseAPI == "API 2") {
    openAI_keys = ["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"];
  } else if (chooseAPI == "API 1") {
    openAI_keys = ["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"];
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



async function saveScoreToPositionCandidate(memberArray,positionID) {

  // Find the position and the candidates from mongo

  
  positionData = await Position.findOne({ _id: positionID }).select('_id candidates');

  printC(positionData, "1", "positionData", "r");
  printC(memberArray, "1", "memberArray", "b");

  // for each candidate userID, find the memberID and update the score

  if (positionData == null) {
    return false
  }

  for (let i = 0; i < memberArray.length; i++) {

    for (let j = 0; j < positionData.candidates.length; j++) {
        
        if (positionData.candidates[j].userID == memberArray[i].memberID) {
  
          positionData.candidates[j].skillScore = memberArray[i].matchPercentage?.totalPercentage;

          printC(positionData.candidates[j], "1", "positionData.candidates[j]", "y")

          printC(memberArray[i].matchPercentage?.totalPercentage, "1", "memberArray[i].matchPercentage?.totalPercentage", "y")
  
          break;
        }
  
    }
  }

  // printC(positionData.candidates, "1", "positionData.candidates", "r")

  // save the positionData back to mongo
  await positionData.save();


  return true 

  
}


async function findRoleDescriptionAndBenefits(message,positionID) {


  promptReport = ` You have as input the Details of a Job Position
      Job Position (delimiters <>): <${message}>


      - Your task is to organise the Role Description and Benefits of the Job Position in bullet points 
      - you can use from 3 to 6 bullet points for each 



      Role: 
      Benefits:
      `;

      let report = await useGPTchatSimple(promptReport, 0,"API 2");

      printC(report, "1", "report", "r")


    const rolePattern = /Role:([\s\S]*?)Benefits:/;
    const benefitsPattern = /Benefits:([\s\S]*)/;

    const getBulletPoints = (report, pattern) => {
      const match = report.match(pattern);
      if (match) {
        const bulletPoints = match[1].trim().split('\n-');
        return bulletPoints.slice(1).map(bullet => bullet.trim());
      }
      return [];
    };

    const role = getBulletPoints(report, rolePattern);
    const benefits = getBulletPoints(report, benefitsPattern);

    console.log('Role:', role);
    console.log('Benefits:', benefits);


    // update mongoDB for the positoinID

    positionData = await Position.findOne({ _id: positionID }).select('_id positionsRequirements');

    positionData.positionsRequirements.roleDescription = role;
    positionData.positionsRequirements.benefits = benefits;


    await positionData.save();
  
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
  wait,
  CandidateNotesEdenAIAPICallF,
  useGPTchatSimple,
  upsertEmbedingPineCone,
  saveScoreToPositionCandidate,
  findRoleDescriptionAndBenefits,
  useGPT4chat,
  findBestEmbedings,
  identifyCategoryFunc,
  replyToMessageBasedOnCategoryFunc,
  useGPTFunc,
  chooseFunctionForGPT,
  giveQualificationsCandidate,
};
