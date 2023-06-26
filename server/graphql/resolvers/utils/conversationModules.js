const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Conversation } = require("../../../models/conversationModel");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");

const axios = require("axios");

// const { useGPTchatSimple } = require("../utils/aiModules");

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


const { printC } = require("../../../printModule");


function concatenateFirstTwoMessages(arr) {
  // Extract the first two messages from the array
  const message1 = arr[0].content.substring(0, 10).replace(/\s+/g, "_");
  const message2 = arr[1].content.substring(0, 10).replace(/\s+/g, "_");

  // Concatenate the messages together and return the result
  return message1 + message2;
}

async function updateAnsweredQuestionFunc(
  resultConv,
  conversation,
  questionAskingNow,
  questionAskingID,
  timesAsked
) {
  let questionData;
  let updateAnsweredQuestionFlag = false;
  if (questionAskingID) {
    questionData = await QuestionsEdenAI.findOne({
      _id: questionAskingID,
    });
    updateAnsweredQuestionFlag = true;
  } else if (questionAskingNow) {
    questionData = {
      content: questionAskingNow,
    };
    updateAnsweredQuestionFlag = true;
  }

  // console.log("updateAnsweredQuestionFlag = " , updateAnsweredQuestionFlag)
  // console.log("questionData = " , questionData)

  let questionAnsweredUpdate;

  if (updateAnsweredQuestionFlag == true) {
    questionAnsweredSoFar = resultConv.questionsAnswered;
    if (questionData._id) {
      infoAddQuestion = {
        questionID: questionData._id,
        content: questionData.content,
        timesAsked: timesAsked,
        conversation: conversation,
      };
      console.log("change = 1211122123",infoAddQuestion);

      questionAnsweredUpdate = await updateQuestionAskedConvoID(
        questionAnsweredSoFar,
        questionData._id,
        infoAddQuestion
      );
      console.log("change = 1211122124");

      resultConv.questionsAnswered = questionAnsweredUpdate;

      resultConv = await resultConv.save();
    } else {
      infoAddQuestion = {
        questionID: undefined,
        content: questionData.content,
        timesAsked: timesAsked,
        conversation: conversation,
      };

      console.log("change = 202",infoAddQuestion);
      questionAnsweredUpdate = await updateQuestionAskedConvoID(
        questionAnsweredSoFar,
        null,
        infoAddQuestion
      );

      resultConv.questionsAnswered = questionAnsweredUpdate;

      resultConv = await resultConv.save();

      console.log("change = 1211122125");
    }
  }

  // console.log("questionAnsweredUpdate = " , questionAnsweredUpdate)

  return resultConv;
}

async function updatePositionInterviewedOfUser(userID) {
  console.log("userID = ", userID);

  userData = await Members.findOne({ _id: userID }).select(
    "_id discordName positionsApplied"
  );

  console.log("userData = ", userData);

  positionsAppliedIDs = userData.positionsApplied.map(
    (position) => position.positionID
  );

  console.log("positionsAppliedIDs = ", positionsAppliedIDs);

  positionsT = await Position.find({ _id: { $in: positionsAppliedIDs } });

  console.log("positionsT = ", positionsT);

  for (let i = 0; i < positionsT.length; i++) {
    const positionData = positionsT[i];

    let candidatesN = await updateEmployees(
      positionData.candidates,
      [{ userID: userID }],
      "userID"
    );

    let positionDataN = await Position.findOneAndUpdate(
      { _id: positionData._id },
      {
        candidates: candidatesN,
        candidatesReadyToDisplay: false,
        candidatesFlagAnalysisCreated: false,
      },
      { new: true }
    );
  }
}

async function updateEmployees(arr1, arr2, compareKey = "userID") {
  // arr1New = [...arr1]
  arr2.forEach((employee2) => {
    const index = arr1.findIndex((employee1) => {
      if (employee1[compareKey] && employee2[compareKey])
        return (
          employee1[compareKey].toString() == employee2[compareKey].toString()
        );
      else return -1;
    });
    if (index != -1) {
      // arr1[index] = {
      //   ...employee2,
      //   readyToDisplay: false,
      // }
      arr1[index].readyToDisplay = false;
      arr1[index].userID = employee2.userID;
    } else {
      arr1.push({
        ...employee2,
        readyToDisplay: false,
      });
    }
  });

  return arr1;
}

async function findAndUpdateConversationFunc(userID, conversation, positionID,positionTrainEdenAI) {
  convKey = await concatenateFirstTwoMessages(conversation);

  // check if already exist using userID and convKey

  const existingConversation = await Conversation.findOne({
    userID,
    convKey,
  });

  let resultConv;

  if (existingConversation) {
    // update the conversation
    existingConversation.conversation = conversation;
    existingConversation.updatedAt = Date.now();
    existingConversation.summaryReady = false;
    existingConversation.positionID = positionID;
    existingConversation.positionTrainEdenAI = positionTrainEdenAI;


    resultConv = await existingConversation.save();
  } else {
    const newConversation = await new Conversation({
      convKey,
      userID,
      conversation,
      positionID,
      positionTrainEdenAI,
      summaryReady: false,
      summary: [],
      updatedAt: Date.now(),
    });

    resultConv = await newConversation.save();
  }

  // console.log("resultConv = " , resultConv)

  return resultConv;
}

async function findSummaryOfAnswers(convDataNow) {
  questionsAnswered = convDataNow.questionsAnswered;

  printC(questionsAnswered, "0", "questionsAnswered", "b");

  const positionID = convDataNow.positionID;
  const userID = convDataNow.userID;

  console.log("positionID,userID = " , positionID,userID)



  positionData = await Position.findOne({ _id: convDataNow.positionID}).select('_id name candidates');

  if (positionData){
    let index_ = positionData.candidates.findIndex(
      (x) => x.userID.toString() == userID.toString()
    );

    // console.log("index_ = " , index_)

    if (index_ != -1) {

      for (let i=0;i<positionData.candidates[index_]?.interviewQuestionsForCandidate.length;i++){
        if (i<questionsAnswered.length){
          printC(i, "0", "i", "y")
          printC(positionData.candidates[index_]?.interviewQuestionsForCandidate[i], "0", "positionData.candidates[index_]?.interviewQuestionsForCandidate[i]", "y")
          questionsAnswered[i].questionContent = positionData.candidates[index_]?.interviewQuestionsForCandidate[i]?.personalizedContent
        }
      }

    }

    printC(questionsAnswered, "0", "questionsAnswered", "g");
    // sdf00
  }




  for (let i = 0; i < questionsAnswered.length; i++) {
    const subConversationAnswer = questionsAnswered[i].subConversationAnswer;
    const questionContent = questionsAnswered[i].questionContent;

    printC(questionsAnswered[i], "1", "questionsAnswered[i]", "y");

    // sdf2


    // from subConversationAnswer array of objects (role,content) create a string of the conversation for prompt
    let conversationString = "";
    for (let j = 0; j < subConversationAnswer.length; j++) {
      roleN = "Candidate";
      if (subConversationAnswer[j].role == "assistant") roleN = "Recruiter";
      
      conversationString =
        conversationString +
        roleN +
        ": " +
        subConversationAnswer[j].content +
        "\n";
    }

    printC(conversationString, "1", "conversationString", "r");

    let promptForSummaryAnswer = "";

    // promptForSummaryAnswer += `
    //     QUESTION: <${questionContent}>

    //     CONVERSATION between Recruiter asking question and Candidate answering: <${conversationString}>

    //     - Create the SUMMARY of the answer that the Candidate give to the the QUESTION asked by the recruiter
    //     - the SUMMARY should be as small as possible with only 1-2 sentences

    //     SUMMARY:
    //     `;
    promptForSummaryAnswer += `
        QUESTION: <${questionContent}>

        CONVERSATION between Recruiter asking question and Candidate answering: <${conversationString}>

        - Criticize how good is the Answer of the Candidate for the Question and add the main points of the answer
        - the Critic should be as small as possible with only 1-2 sentences

        Critic:
        `;

    printC(promptForSummaryAnswer, "2", "promptForSummaryAnswer", "p");

    // sdf00


    const summaryAnswer = await useGPTchatSimple(promptForSummaryAnswer,0.7,'API 1');

    // const summaryAnswer = conversationString

    printC(summaryAnswer, "2", "summaryAnswer", "g");

    // questionsAnswered[i].summaryOfAnswer = summaryAnswer

    promptSummarySmall = `
            CONTENT: <${summaryAnswer}>

            - Create a SUMMARY of the CONTENT  with Maximum 3-5 words!!!

            SUMMARY:
        `;

    const summaryAnswerSmall = await useGPTchatSimple(promptSummarySmall,0.7,'API 2');

    printC(summaryAnswerSmall, "3", "summaryAnswerSmall", "g");

    convDataNow.questionsAnswered[i].summaryOfAnswer = summaryAnswer;
    convDataNow.questionsAnswered[i].summaryOfAnswerSmall = summaryAnswerSmall;
  }

  printC(convDataNow, "0", "convDataNow", "g");
  // ss

  return convDataNow;
}

async function updateQuestionAskedConvoID(arr1, ID, infoAddQuestion) {
  // const index = arr1.findIndex(question => question.questionID == ID);

  console.log("arr1, ID,infoAddQuestion = ", arr1, ID, infoAddQuestion);

  if (infoAddQuestion.questionID) {
    // console.log("question.questionID.toString() = " , question.questionID.toString())
    // console.log("ID.toString() = " , ID.toString())
    const index = arr1.findIndex(
      (question) => question.questionID.toString() == ID.toString()
    );

    if (index !== -1) {
      console.log("index = t1t - ", index,infoAddQuestion.conversation.slice(
        -infoAddQuestion.timesAsked * 2
      ));

      arr1[index] = {
        questionID: infoAddQuestion.questionID,
        questionContent: infoAddQuestion.content,
        originalQuestionContent: infoAddQuestion.originalContent,
        subConversationAnswer: infoAddQuestion.conversation.slice(
          -infoAddQuestion.timesAsked * 2
        ),
        summaryOfAnswer: "",
      };
    } else {
      console.log("NOOO index = t1t - ",infoAddQuestion.conversation.slice(
        -infoAddQuestion.timesAsked * 2
      ));
      arr1.push({
        questionID: infoAddQuestion.questionID,
        questionContent: infoAddQuestion.content,
        originalQuestionContent: infoAddQuestion.originalContent,
        subConversationAnswer: infoAddQuestion.conversation.slice(
          -infoAddQuestion.timesAsked * 2
        ),
        summaryOfAnswer: "",
      });
    }
  } else {
    const index = arr1.findIndex(
      (question) =>
        question.questionContent.toString() ==
        infoAddQuestion.content.toString()
    );

    if (index !== -1) {
      arr1[index] = {
        questionID: undefined,
        questionContent: infoAddQuestion.content,
        originalQuestionContent: infoAddQuestion.originalContent,
        subConversationAnswer: infoAddQuestion.conversation.slice(
          -infoAddQuestion.timesAsked * 2
        ),
        summaryOfAnswer: "",
      };
    } else {
      arr1.push({
        questionID: undefined,
        questionContent: infoAddQuestion.content,
        originalQuestionContent: infoAddQuestion.originalContent,
        subConversationAnswer: infoAddQuestion.conversation.slice(
          -infoAddQuestion.timesAsked * 2
        ),
        summaryOfAnswer: "",
      });
    }
  }


  return arr1;
}

module.exports = {
  concatenateFirstTwoMessages,
  updateQuestionAskedConvoID,
  updateAnsweredQuestionFunc,
  findAndUpdateConversationFunc,
  findSummaryOfAnswers,
  updatePositionInterviewedOfUser,
};
