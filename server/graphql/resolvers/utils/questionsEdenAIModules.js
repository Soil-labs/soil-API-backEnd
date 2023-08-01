
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const axios = require("axios");

// const { useGPTchatSimple } = require("../utils/aiExtraModules");
const { findBestEmbedings,useGPTchatSimple } = require("../utils/aiExtra_2_Modules");



const {
  addMemoryPineconeFunc,
} = require("../utils/memoryPineconeModules");

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


async function addQuestionToEdenAIFunc(content) {

  console.log("change = ")

  let res 

  const filter = {
    label: "questionsEdenAI",
  };

  bestKeywordsFromEmbed = await findBestEmbedings(
    content,
    filter,
    (topK = 1)
  );

  console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)

  let foundQuestion = false

  if (bestKeywordsFromEmbed.length !=0){

    if (bestKeywordsFromEmbed[0].score > 0.98){
        foundQuestion = true
    } else {

        let promptSameQuestions =`
        Is this two questions the same?
        ${content}
        ${bestKeywordsFromEmbed[0].metadata.text}

        They are the same when the context of this questions is refering to the same think,

        be extremly cretical, it has to be exactly the same question to say YES, in any other case you say NO

        You can only answere YES or NO and nothing else! 

        answere: `

        const sameQuestion = await useGPTchatSimple(promptSameQuestions)
        
        console.log("sameQuestion = " , sameQuestion)

        // if sameQuestion contain the word YES but it
        if (sameQuestion.toLowerCase().includes("yes")){
            foundQuestion = true
        } else {
            foundQuestion = false
        }

    }

  } 

  if (foundQuestion == true){
    questionID = bestKeywordsFromEmbed[0].metadata._id

        const questionData = await QuestionsEdenAI.findOne({
            _id: questionID,
        });

        console.log("questionData = " , questionData)

        if (questionData != null && questionData != undefined){
            res = {
                _id: questionData._id,
                content: questionData.content
            }
        } else {
            foundQuestion = false
        }
    }

  if (foundQuestion == false){
    // add on mongoDB the new Question first
    const newQuestion = await new QuestionsEdenAI({
        content: content,
        answeredQuestionByUsers: [],
        questionOwnedByPositions: []
    });

    const result = await newQuestion.save();


    console.log("change = 1")

    // upsertDoc = await upsertEmbedingPineCone({
    //     text: content,
    //     _id: result._id,
    //     label: "questionsEdenAI",
    //   });
    resTK = await addMemoryPineconeFunc({
      memory: content,
      userID: result._id,
      label: "questionsEdenAI",
    })


      
      res = {
        _id: newQuestion._id,
        content: newQuestion.content
    }

  }


  return res

}
  
  
async function addMultipleQuestionsToEdenAIFunc(questionsToAsk) {

    for (let i = 0; i < questionsToAsk.length; i++) {
        const question = questionsToAsk[i];


        if (!question.questionID) { // it doesn't have a questionID
          if (question.questionContent) { 
            console.log("question.questionContent = " , question.questionContent)
            console.log("change = " , i)
            res = await addQuestionToEdenAIFunc(question.questionContent);

            // update questionsToAsk
            questionsToAsk[i].questionID = res._id;

            console.log("res = " , res)

          }


        } else if (!question.questionContent) {
            // it has a questionID and a questionContent
            // check if the questionContent is different from the one in the DB
            const questionData = await QuestionsEdenAI.findOne({
                _id: question.questionID,
            });

            questionsToAsk[i].questionContent = questionData.content
            
        }
      }
      
    return questionsToAsk
}


async function updateQuestionSmall(questionContent) {



  if (questionContent?.content && !questionContent?.contentSmall){
    
    promptQuestionSmall = `
    ORIGINAL QUESTION: <${questionContent.content}>

    - Create a SUMMARY question of the ORIGINAL QUESTION with Maximum 8-12 words!!!

    SUMMARY question:
    `

    const questionSmall = await onlyGPTchat(promptQuestionSmall)

    questionContent.contentSmall = questionSmall.replace(".","")

    await questionContent.save()
  }
  
    
  return questionContent
}


module.exports = {
    addQuestionToEdenAIFunc,
    addMultipleQuestionsToEdenAIFunc,
    updateQuestionSmall,
};