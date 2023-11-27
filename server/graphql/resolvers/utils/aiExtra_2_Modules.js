require("dotenv").config();
const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Conversation } = require("../../../models/conversationModel");


const { printC } = require("../../../printModule");


const axios = require("axios");
const { PineconeClient } = require("@pinecone-database/pinecone");

const { OpenAI } = require("openai");

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

async function prepareDataAssistantGPT(data) {

  // ----------------- Data -----------------
  const {conversationID, newMessage,assistantName,newThread} = data;
  let {chooseAPI} = data;

  if (newMessage == undefined || newMessage == "")
    return {
      error: "No message"
    }

  if (assistantName == undefined || assistantName == "")
    return {
      error: "No assistantName"
    }

  const assistantNow = assistantFunctions[assistantName];

  let threadID_openAI,filterSave;

  const assistantID_openAI = assistantNow.assistantID_openAI;

  let flagCreateNewThread = false;

  if (chooseAPI == undefined) {
    chooseAPI = "API 1";
  }
  const openai = new OpenAI({ apiKey: chooseAPIkey(chooseAPI) });



  if (conversationID == undefined) {
    flagCreateNewThread = true;
  } else {
    conversationData = await Conversation.findOne({ _id: conversationID }).select('-conversation -summariesMessages -questionsAnswered');

    if (conversationData == null) {
      flagCreateNewThread = true;
    } 
    
    if (conversationData.threadID_openAI == undefined ) flagCreateNewThread = true;

    if (conversationData.threadID_openAI) threadID_openAI = conversationData.threadID_openAI;

  }

  if (newThread == true) {
    flagCreateNewThread = true;
  }


  if (flagCreateNewThread == true) {
    const thread = await openai.beta.threads.create();

    threadID_openAI = thread.id;

    filterSave = {
      ...filterSave,
      threadID_openAI: threadID_openAI,
    }
  }
  // ----------------- Data -----------------

  return {
    threadID_openAI,
    assistantID_openAI,
    filterSave,
    conversationData,
    openai,
  }

}

async function runAssistantGPT(data) {

  // ----------------- Data -----------------
  const {run,threadID_openAI,openai} = data;
  // ----------------- Data -----------------

  let runStatus = await openai.beta.threads.runs.retrieve(
    threadID_openAI,
    run.id
  );

  // ------------ run until completed ------------
  let attempts = 0;
  const maxAttempts = 45;
  while ((runStatus.status != "completed" && runStatus.status != "requires_action") && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    runStatus = await openai.beta.threads.runs.retrieve(
      threadID_openAI,
      run.id
    );
    attempts++;
    printC(runStatus.status, "1", "runStatus.status", "b")
  }
  if (runStatus.status != "completed" && runStatus.status != "requires_action")
    return {
      error: 'Run status did not reach "completed" within the expected time.',
    }
  // ------------ run until completed ------------

  return {
    runStatus,
  }
}


async function updateConvOnlyNewMessages(conversationID, conversationNewMessages) {

  let existingConversation
  if (conversationID == null) {
    return null
  } else {
    existingConversation = await Conversation.findOne({
      _id: conversationID,
    });

    if (existingConversation == null){
      return null
    }
  }


  // ------ update lastMsgSummed that shows what is the last message that is not been summed up ------
  if (existingConversation.lastMsgSummed != null){ 
    existingConversation.lastMsgSummed = existingConversation.lastMsgSummed + conversationNewMessages.length

  } else {
    existingConversation.lastMsgSummed = existingConversation.conversation.length
  }
  // ------ update lastMsgSummed that shows what is the last message that is not been summed up ------


  let resultConv;

  
  // -------- Add the conversationNewMessages to the existingConversation.conversation
  existingConversation.conversation = existingConversation.conversation.concat(conversationNewMessages)


  existingConversation.updatedAt = Date.now();
  existingConversation.summaryReady = false;


  resultConv = await existingConversation.save();

  return resultConv;
}

async function processToolCalls(tool_calls) {
  let funcGPToutput = []
  for (let i = 0; i < tool_calls.length; i++) {
    const argFunc = tool_calls[i].function.arguments;
    const regex = /"([^"]+)":\s*("([^"]*)"|[0-9]+)/g;
    const matches = argFunc.matchAll(regex);
    const result = {};
    for (const match of matches) {
      const [, key, value] = match;
      result[key] = isNaN(value) ? value : Number(value);
    }
    funcGPToutput.push({
      id: tool_calls[i].id,
      function: tool_calls[i].function.name,
      arguments: result,
    })
  }
  return funcGPToutput;
}

async function add_State_Candidate_Search(data) {

  // ----------------- Data -----------------
  let {element,conversationData} = data;
  // ----------------- Data -----------------

  // printC(element, "3", "element", "p")
  // printC(conversationData, "3", "conversationData", "p")

  // ---------- Save to Mongo the new Memory -----------
  if (element.arguments.memory != undefined) {
    if (conversationData.stateSearch == undefined) {
      conversationData.stateSearch = {
        memories: [],
      }
    }

    if (conversationData.stateSearch.memories == undefined) {
      conversationData.stateSearch.memories = [];
    }
    
    if (!conversationData.stateSearch.memories.some(memory => memory.content === element.arguments.memory)) {
      conversationData.stateSearch.memories.push({ 
        content: element.arguments.memory,
        score: element.arguments.score,
      });

    }
    await conversationData.save();
  }
  // ---------- Save to Mongo the new Memory -----------



  return {
    state: "success",
    output: "I Done, sent small reply to user",
  }

}

async function runFunctionAssistant (data) {

  // ----------------- Data -----------------
  const {func_call} = data;
  let {conversationData} = data;
  // ----------------- Data -----------------

  tool_outputs = []
  for (let i = 0; i < func_call.length; i++) {
    const element = func_call[i];
    if (element.function == "add_State_Candidate_Search") {
      let resFunc = await add_State_Candidate_Search({
        element,
        conversationData,
      })
      tool_outputs.push({
        tool_call_id: element.id,
        output: resFunc.output,
      })


    }
  }

  return {
    tool_outputs,
  }

}


async function handleRunStatus (data) {
  const { runStatus, threadID_openAI, run, openai } = data;

  if (runStatus.status == "completed") {

    const messages = await openai.beta.threads.messages.list(threadID_openAI);
    const lastMessageForRun = messages.data.filter((message) => message.run_id == run.id && message.role == "assistant").pop();
    return {
      reply: lastMessageForRun.content[0].text.value,
    }

  } else if (runStatus.status == "requires_action") {

    let tool_calls = runStatus.required_action.submit_tool_outputs.tool_calls;

    funcGPToutput = await processToolCalls(tool_calls)

    return {
      funcGPToutput,
    }
  }
}


async function sentMessageAssistantGPT(data) {
  
  // ----------------- Data -----------------
  const {newMessage,threadID_openAI,assistantID_openAI,openai} = data;
  let {filterSave,run,funcGPToutput,conversationData} = data;
  let reply,error
  // ----------------- Data -----------------

  if (newMessage != undefined && newMessage != ""){
    await openai.beta.threads.messages.create(threadID_openAI,{
      role: "user",
      content: newMessage,
    })


    run = await openai.beta.threads.runs.create(threadID_openAI, {
      assistant_id: assistantID_openAI
    });
    
    printC(newMessage, "2", "newMessage", "y")

    let resultRun = await runAssistantGPT({
      run,
      threadID_openAI,
      openai,
    });
    runStatus = resultRun.runStatus;
    error = resultRun.error;

    if (error) return {error}


    let resultHandleRun = await handleRunStatus({
      runStatus,
      threadID_openAI,
      run,
      openai,
    })
    reply = resultHandleRun.reply;
    error = resultHandleRun.error;
    funcGPToutput = resultHandleRun.funcGPToutput;

    return {
      reply,
      error,
      funcGPToutput,
      run,
    }
  } else if (funcGPToutput != undefined && funcGPToutput != "") {


    let {tool_outputs} = await runFunctionAssistant({
      func_call: funcGPToutput,
      conversationData,
    })


    let runBeforeID = run.id;


    run = await openai.beta.threads.runs.submitToolOutputs(threadID_openAI, runBeforeID, {
      tool_outputs: tool_outputs,
    });

    let resultRun = await runAssistantGPT({
      run,
      threadID_openAI,
      openai,
    });
    runStatus = resultRun.runStatus;
    error = resultRun.error;

    if (error) return {error}


    let resultHandleRun = await handleRunStatus({
      runStatus,
      threadID_openAI,
      run: run,
      openai,
    })
    reply = resultHandleRun.reply;
    error = resultHandleRun.error;
    funcGPToutput = resultHandleRun.funcGPToutput;

    return {
      reply,
      error,
      funcGPToutput,
      run,
    }

  } else {
    return {
      error: "No message or tool_outputs"
    }
  }
  

}

const assistantFunctions = {
  "Search Eden": {
    assistantID_openAI:"asst_1GZyIpw8FyMElyPfDFnk6XND",
    functions: {
      "add_State_Candidate_Search":{
        typeWidget: "ADD_STATE",
        memory: {
          type: "string",
        },
        score: { // 0 - 10
          type: "number",
        },
      }
    }
  },
}

async function saveConversation(data) {

  // ----------------- Data -----------------
  const {_conversation, newMessage,role,funcGPToutput,assistantName,pubsub,conversationID} = data;
  // ----------------- Data -----------------

  let flagNewConv = false;

  if (newMessage != undefined && newMessage != ""){
    _conversation.push({
      role: role,
      typeWidget: "MESSAGE",
      content: newMessage,
      date:  new Date(),
    })
    flagNewConv = true;
  }

  
  if (funcGPToutput != undefined && funcGPToutput != ""){

    const assistantN = assistantFunctions[assistantName];

    for (let i = 0; i < funcGPToutput.length; i++) {
      const element = funcGPToutput[i];
      
      // ------ Find type of Widget ------

      const typeWidget = assistantN.functions[element.function].typeWidget;
      // ------ Find type of Widget ------

      if (typeWidget == "ADD_STATE") {
        _conversation.push({
          role: role,
          typeWidget: typeWidget,
          widgetVars: {
            memory: {
              content: element.arguments.memory,
              score: element.arguments.score,
            }
          },
          date:  new Date(),
        })
        flagNewConv = true;
      }
    }
    

  }


  if (flagNewConv == true) {
    pubsub.publish("CONVERSATION_UPDATED", {
      conversationUpdated: _conversation[_conversation.length - 1],
      conversationID: conversationID,
    });
  }



  return {
    _conversation,
  }
}


async function assistantGPT_V1(data) {

  // ----------------- Data -----------------
  const {newMessage,assistantName,conversationID,pubsub} = data;

  prepData = await prepareDataAssistantGPT(data);

  const {threadID_openAI,assistantID_openAI,openai} = prepData;
  let {conversationData,filterSave} = prepData;
  // ----------------- Data -----------------


  // ----------------- Save -----------------
  if (conversationData) {

    if (filterSave?.threadID_openAI != undefined)
      conversationData.threadID_openAI = filterSave.threadID_openAI;

    await conversationData.save();
  }
  // ----------------- Save -----------------

  // ------------ Save conversation to DB -----------
  let _conversation = []
  resCon = await saveConversation({
    _conversation,
    newMessage,
    role: "user",
    pubsub,
    conversationID,
  })
  _conversation = resCon._conversation;
  // ------------ Save conversation to DB -----------

  
  resSentMessage = await sentMessageAssistantGPT({
    newMessage,
    threadID_openAI,
    assistantID_openAI,
    openai,
    filterSave,
    conversationData,
  })

  if (newMessage.error) 
    return {
      error: newMessage.error
    }

  // ----- save conv ----
  resCon = await saveConversation({
    _conversation,
    newMessage: resSentMessage.reply,
    role: "assistant",
    funcGPToutput: resSentMessage.funcGPToutput,
    assistantName,
    conversationID,
    pubsub,
  })
  _conversation = resCon._conversation;
  // ----- save conv ----


  printC(resSentMessage, "10", "resSentMessage", "p")

  if (resSentMessage.funcGPToutput) {

    resSentMessage = await sentMessageAssistantGPT({
      funcGPToutput: resSentMessage.funcGPToutput,
      run: resSentMessage.run,
      threadID_openAI,
      assistantID_openAI,
      openai,
      filterSave,
      conversationData,
    })
    // ----- save conv ----
    resCon = await saveConversation({
      _conversation,
      newMessage: resSentMessage.reply,
      role: "assistant",
      funcGPToutput: resSentMessage.funcGPToutput,
      assistantName,
      pubsub,
      conversationID,
    })
    _conversation = resCon._conversation;
    // ----- save conv ----
  }

  





  // ------------ Save conversation to DB -----------
  printC(_conversation, "10", "_conversation", "p")
  printC(conversationID, "10", "conversationID", "p")
  resultConv = await updateConvOnlyNewMessages(
    conversationID,
    _conversation,
  );
  // ------------ Save conversation to DB -----------


  return {
    reply: resSentMessage.reply,
  }
  
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
  findBestEmbedings,
  useGPTchatSimple,
  assistantGPT_V1,
};
