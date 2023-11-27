require("dotenv").config();
const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Conversation } = require("../../../models/conversationModel");

const { ApolloError } = require("apollo-server-express");


const { Configuration, OpenAIApi,OpenAI } = require("openai");

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

require("dotenv").config();



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

  // only keep role and content

  discussion = discussion.map((item) => {
    return {
      role: item.role,
      content: item.content,
    };
  });

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
  printC(OPENAI_API_KEY, "1", "OPENAI_API_KEY", "r");
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
findCompanyInformation: {
  name: "findCompanyInformation",
  description: "Having the job Description, find the company information",
  parameters: {
      type: "object",
      properties: {
          mission: {
              type: "string",
              description: "What is the mission of the company, if you can't find it return back N/A",
          },
          description: {
              type: "string",
              description: "What is the description of the company, if you can't find it return back N/A",
          },
      },
      required: ["mission","description"],
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
  coreMemoryAppend: {
    name: "coreMemoryAppend",
    description: "Append to the contents of core memory, which is focused on position requirements and candidate information. Only append if core memory is NEW",
    parameters: {
        type: "object",
        properties: {
            content: {
                type: "string",
                description: "NEW Content to write to the memory. ",
            },
        },
        required: ["content"],
    },
  },
  coreMemoryReplace: {
    name: "coreMemoryReplace",
    description: "Replace to the contents of core memory. To delete memories, use an empty string for new_content. Focus on position requirements and candidate information",
    parameters: {
        type: "object",
        properties: {
           oldContent: {
                type: "string",
                description: "Trying to replace. Must be an exact match.",
            },
            newContent: {
                type: "string",
                description: "Content to write to the memory.",
            },
        },
        required: ["oldContent","newContent"],
    },
  },
  recallMemorySearch: {
    name: "recallMemorySearch",
    description: "When there is no memory found, search prior conversation history using a string.",
    parameters: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "String to search on conversation history.",
            },
        },
        required: ["query"],
    },
  },
  recallMemoryCandidate: {
    name: "recallMemoryCandidate",
    description: "When the user search for specific information about the candidate, search memories of candidate",
    parameters: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "String to search on the candidate memories.",
            },
        },
        required: ["query"],
    },
  },
  useMemories: {
    name: "useMemories",
    description: "Use the memories to answer to continue the conversation",
    parameters: {
        type: "object",
        properties: {
            MemoryIDsUsed: {
              type: "string",
              description: "the ID of the memories that was used to answer the question",
            },
            MemoryIDsScoreUsed: {
              type: "string",
              description: "the Score on how impactful each ID memory was to answer the question from 0 to 10",
            },
            reply: {
                type: "string",
                description: "answer to the question",
            },
        },
        // required: ["msg","MemoryIDsUsed","MemoryIDsScoreUsed"],
        required: ["MemoryIDsUsed","MemoryIDsScoreUsed","reply"],
    },
  },
  sendMessage: {
    name: "sendMessage",
    description: "Sends a message to the user",
    parameters: {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Message contents",
            },
        },
        required: ["message"],
    },
  },
  
}

async function useGPTFunc(
  discussionOld,
  systemPrompt,
  functionsUse,
  functionResult = {},
  temperature = 0.7,
  chooseAPI = "API 1",
  functionUseVariables = [],
  modelK = ""
) {


  try {
  // --------------- Add functions ----------------
  functionUseGPT = []

  for (let i = 0; i < functionsUse.length; i++) {
    if (gptFunctions[functionsUse[i]] != undefined) {
      functionUseGPT.push(gptFunctions[functionsUse[i]])
    }
  }
  for (let i = 0; i < functionUseVariables.length; i++) {
    functionUseGPT.push(functionUseVariables[i])
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


  let modelT
  if (modelK != "") {
    modelT = modelK
  } else {
    modelT = "gpt-3.5-turbo-0613";
    // modelT = "gpt-4-0613";
  }

  let OPENAI_API_KEY = chooseAPIkey(chooseAPI);
  let response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: modelT,
      temperature: temperature,
      functions: functionUseGPT,
      function_call: "auto", 
      // max_tokens: 150,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  );


  printC(response.data.choices[0].message.function_call, "5", "response.data.choices[0].message.function_call", "r");
  // Check if it is a function or if it is a normal message
  if (response.data.choices[0].message.content == null) { // Function

    // --------------- parse arguments of function ----------------
    let argFunc = response.data.choices[0].message.function_call.arguments

    const regex = /"([^"]+)":\s*"([^"]*)"/g;
    const matches = argFunc.matchAll(regex);
    const result = {};

    for (const match of matches) {
      const [, key, value] = match;
      result[key] = value;
    }
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

} catch (err) {
  console.log("err = -----",err.response.data)
}

  

}

async function chooseFunctionForGPT(resGPTFunc) {

  // printC(resGPTFunc, "1", "resGPTFunc", "gg")

  // run the function with name resGPTFunc.function_call.functionName

  funcOutput = {}

  if (resGPTFunc.function_call.functionName == "giveExamplesCandidate") {

    funcOutput = await giveQualificationsCandidate(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "giveQualificationsCandidate") {

    funcOutput = await giveQualificationsCandidate(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "findCompanyInformation") {

    funcOutput = await findCompanyInformation(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "giveInformationRelatedToPosition") {

    funcOutput = await  giveInformationRelatedToPosition(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "isCandidateAvailable") {

    funcOutput = await isCandidateAvailable(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "coreMemoryAppend") {

    funcOutput = await coreMemoryAppend(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "coreMemoryReplace") {

    funcOutput = await coreMemoryReplace(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "recallMemorySearch") {

    funcOutput = await recallMemorySearch(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "recallMemoryCandidate") {

    funcOutput = await recallMemoryCandidate(resGPTFunc)

  } else if (resGPTFunc.function_call.functionName == "sendMessage") {

    funcOutput = await sendMessage(resGPTFunc)

  } else {
    console.log("this is a mistake there is not function")
  }

  funcOutput = {
    ...funcOutput,
    name: resGPTFunc.function_call.functionName
  }


  return funcOutput

}

async function summarizeOldConversationMessages(conversation) {

  
  let discussionTemp = [...conversation];
  
  if (discussionTemp.length < 2) return null 
  


  const WORD_LIMIT = 100


  const systemPrompt = `Your job is to summarize a history of previous messages in a conversation between an AI persona and a human.
  The conversation you are given is a from a fixed context window and may not be complete.
  Messages sent by the AI are marked with the 'assistant' role.
  Messages the user sends are in the 'user' role.
  Summarize what happened in the conversation from the perspective of the AI (use the first person).
  Keep your summary less than ${WORD_LIMIT} words, do NOT exceed this word limit.
  You are a recruiter so you should mainly keep notes about the candidate and the position. keep everything in detail all the technologies or anything else that is needed 
  Only output the summary, do NOT include anything else in your output.`




  summaryNow = await useGPTchat(systemPrompt,discussionTemp,systemPrompt)
  // summaryNow = await useGPT4chat( systemPrompt,discussionTemp,systemPrompt);


  // f1

  


  return summaryNow

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
  let {userID,positionID,memoriesType} = funcInput


  let promptSearch = question + "\n\n"


  // ----------------- User -----------------
  let filter = {}
  
  if (memoriesType == "NEW") {
    filter.label = "scoreCardMemory"
    filter.userID = userID;
    filter.database = process.env.REACT_APP_MONGO_DATABASE
    
  } else {
    filter.label = {"$in": ["CV_user_memory","conv_with_user_memory"]}
    filter._id = userID;
  }

  printC(filter, "1", "filter", "b")


  longTermMemories_user = await findBestEmbedings(promptSearch, filter, (topK = 5), "User");

  printC(longTermMemories_user, "1", "longTermMemories_user", "b")
  // ----------------- User -----------------

  // ----------------- Position -----------------
  filter = {}
  if (memoriesType == "NEW") {
    filter.label = "scoreCardMemory"
    filter.positionID = positionID;
    filter.database = process.env.REACT_APP_MONGO_DATABASE
    
  } else {
    filter.label =  {"$in": ["requirements_position_memory","conv_for_position_memory"]}
    filter._id = positionID;
  }

  longTermMemories_Position = await findBestEmbedings(promptSearch, filter, (topK = 5), "User");

  printC(longTermMemories_Position, "1", "longTermMemories_Position", "b")
  // d00
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
  // ss9


  // s9
  return funcOutput


}


async function giveQualificationsCandidate(funcInput) {

  // d0

  let {topicOfInterest,extraInfo} = funcInput.function_call
  let {userID,memoriesType} = funcInput


  

  let promptSearch = topicOfInterest + "\n\n" + extraInfo

  filter = {}
  
  if (memoriesType == "NEW") {

    filter.label = "scoreCardMemory"
    filter.userID = userID;
    filter.database = process.env.REACT_APP_MONGO_DATABASE
    
  } else {
    filter.label = {"$in": ["CV_user_memory","conv_with_user_memory"]}
    filter._id = userID;
  }




  printC(filter, "1", "filter", "b")
  longTermMemories_userCV = await findBestEmbedings(promptSearch, filter, (topK = 5), "User");

  printC(longTermMemories_userCV, "1", "longTermMemories_userCV", "b")

  // s116

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

async function coreMemoryAppend(funcInput) {



  let {positionCore} = funcInput.coreMemory

  let {positionID,positionData} = funcInput

  const {content} = funcInput.function_call

  // append the content on the positionCore memory

  positionCore += "\n" + content

  // save to database 

  positionData.memory.core = positionCore

  await positionData.save()



  funcOutput = {
    role: "function",
    content:`DONE Append to the CORE memory, Reply to message `
  }

  
  return funcOutput
}

async function coreMemoryReplace(funcInput) {



  let {positionCore} = funcInput.coreMemory

  let {positionID,positionData} = funcInput

  const {oldContent,newContent} = funcInput.function_call

  // find the oldContent and replace it with teh newContent inside the positionCore
  positionCore = positionCore.replace(oldContent, newContent);


  // save to database 

  positionData.memory.core = positionCore

  await positionData.save()



  funcOutput = {
    role: "function",
    content:`DONE Replace the CORE memory, Reply to message `
  }

  
  return funcOutput
}

async function recallMemorySearch(funcInput) {

  const message = funcInput.function_call.query

  let {discussion,systemPrompt} = funcInput.gptInput
  const {conversationID} = funcInput

  let functionsUseGPT = ["recallMemorySearch","sendMessage"]



  const REACT_APP_MONGO_DATABASE = process.env.REACT_APP_MONGO_DATABASE
  const filter = {
    label: "conversationMemory",
    database: REACT_APP_MONGO_DATABASE,
  };
  
  if (conversationID) {
    filter.conversationID = conversationID;
  }

  longTermMemories = await findBestEmbedings(message, filter, (topK = 3));

  

  let prompt_longTermMemory = "Long Term Memory delimited ||: |";
  for (let i = 0; i < longTermMemories.length; i++) {
    prompt_longTermMemory =
      prompt_longTermMemory + "\n" + longTermMemories[i].metadata.text;
  }

  prompt_longTermMemory += "| \n\n";

 

  discussion.push({
    role: "function",
    content: prompt_longTermMemory,
    name: "recallMemorySearch"
  })



  let resGPTFuncNew = await useGPTFunc(discussion,systemPrompt,functionsUseGPT,{},0)

  printC(resGPTFuncNew, "3.5", "Inside Recall memory GPT ", "b");

  if (resGPTFuncNew?.function_call?.functionName == "sendMessage") {
    funcOutput = {
      ...funcOutput,
      content: resGPTFunc_2.function_call.message,
    }
  } else if (resGPTFuncNew?.function_call?.functionName == "recallMemorySearch") {
    if (resGPTFuncNew.function_call.repeatGPTrecallMemorySearch < 2 ) {
      await chooseFunctionForGPT({
        ...funcInput,
        ...resGPTFuncNew,
        repeatGPTrecallMemorySearch: repeatGPTrecallMemorySearch + 1
      })
    } else {
      funcOutput = {
        ...funcOutput,
        content: "I am sorry I can't find anything related to this question",
      }
    }
  } else {
    funcOutput = {
      ...funcOutput,
      content: resGPTFuncNew.content,
    }
  }

  return funcOutput

}

async function recallMemoryCandidate(funcInput) {

  const message = funcInput.function_call.query

  let {discussion,systemPrompt} = funcInput.gptInput
  const {userID} = funcInput

  let functionsUseGPT = ["useMemories"]



   // -------------- Pinecone Search for Memories ----------------
  const REACT_APP_MONGO_DATABASE = process.env.REACT_APP_MONGO_DATABASE
  const filter = {
    label: "scoreCardMemory",
    database: REACT_APP_MONGO_DATABASE,
  };
  
  if (userID) {
    filter.userID = userID;
  }

  longTermMemories = await findBestEmbedings(message, filter, (topK = 5));


  printC(longTermMemories, "1", "longTermMemories", "b")
  // f3
  

  let prompt_longTermMemory = "Long Term Memory delimited ||: |";
  for (let i = 0; i < longTermMemories.length; i++) {
    prompt_longTermMemory = prompt_longTermMemory + "ID_" + (i+1) + " : " + longTermMemories[i].metadata.text + "\n";
  }

  prompt_longTermMemory += "| \n\n";
   // -------------- Pinecone Search for Memories ----------------

 

  discussion.push({
    role: "function",
    content: prompt_longTermMemory,
    name: "recallMemoryCandidate"
  })



  // let resGPTFuncNew = await useGPTFunc(discussion,systemPrompt,functionsUseGPT,{},0)
  let resGPTFuncNew = await useGPTFunc(discussion,systemPrompt,functionsUseGPT,{},0)

  printC(resGPTFuncNew, "3.5", "Inside Recall memory GPT ", "b");

  // f1

  if (resGPTFuncNew?.function_call?.functionName == "useMemories") {
  
    let {MemoryIDsUsed,MemoryIDsScoreUsed} = resGPTFuncNew.function_call

    // -------------- Regex the ID and score ----------------
    const ids = MemoryIDsUsed.split(',');
    const scores = MemoryIDsScoreUsed.split(',');

    const combinedArray = [];

    let cardMemoriesUsed = []

    for (let i = 0; i < ids.length; i++) {
      let obj = {
        Id: ids[i].trim(),
        score: scores[i].trim(),
      };
      obj.numberID = obj.Id.match(/\d+/);
      obj.numberID = obj.numberID[0];
      obj.numberID = parseInt(obj.numberID);

      combinedArray.push(obj);

      if (longTermMemories[obj.numberID-1]){
        if (longTermMemories[obj.numberID-1]?.metadata?.mongoID) {
          cardMemoriesUsed.push({
            cardMemoryID: longTermMemories[obj.numberID-1].metadata.mongoID,
            score: obj.score
          })

        }
      }
    }
    printC(combinedArray, "1", "combinedArray", "b")
    printC(cardMemoriesUsed, "1", "cardMemoriesUsed", "b")
    // f2

    // -------------- Regex the ID and score ----------------


    funcOutput = {
      content: resGPTFuncNew.function_call.reply,
      cardMemoriesUsed: cardMemoriesUsed
    }

   
  } else {
    funcOutput = {
      content: resGPTFuncNew.content,
    }
  }

  return funcOutput

}

async function sendMessage(funcInput) {


  const {message} = funcInput.function_call

  funcOutput = {
    role: "function",
    content: message,
    message: message,
  }

  
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

  discussion = discussion.map((item) => {
    return {
      role: item.role,
      content: item.content,
    };
  });

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
      model: "gpt-4-1106-preview",
      // model: "gpt-4",
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
  // const configuration = new Configuration({
  //   apiKey: chooseAPIkey(chooseAPI),
  // });

  // const openai = new OpenAIApi(configuration);
  const openai = new OpenAI({ apiKey: chooseAPIkey(chooseAPI) });

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

async function deletePineCone(deletePineIDs) {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-east1-gcp",
    apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
  });

  const index = await pinecone.Index("profile-eden-information");

  try {
    res = await index.delete1({ ids: deletePineIDs });
    // console.log("res = " , res)
  } catch (err) {
    console.log("err = ", err);
  }
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

  if (data.positionID) {
    metadata = {
      ...metadata,
      positionID: data.positionID,
    };
  }

  if (data.userID) {
    metadata = {
      ...metadata,
      userID: data.userID,
    };
  }

  if (data.conversationID) {
    metadata = {
      ...metadata,
      conversationID: data.conversationID,
    };
  }

  if (data.mongoID) {
    metadata = {
      ...metadata,
      mongoID: data.mongoID,
    };
  }


  if (data.category) {
    metadata = {
      ...metadata,
      category: data.category,
    };
  }

  if (data.database) {
    metadata = {
      ...metadata,
      database: data.database,
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

  // let model = "gpt-4";
  let model = "gpt-4-1106-preview";

  let OPENAI_API_KEY = chooseAPIkey(chooseAPI);
  response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      messages: discussion,
      model: model,
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
  deletePineCone,
  summarizeOldConversationMessages,
};
