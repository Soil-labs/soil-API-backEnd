const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Conversation } = require("../../../models/conversationModel");

const { printC } = require("../../../printModule");

const { useGPTchatSimple} = require("./aiModules");



function concatenateFirstTwoMessages(arr) {
    // Extract the first two messages from the array
    const message1 = arr[0].content.substring(0, 10).replace(/\s+/g, '_');
    const message2 = arr[1].content.substring(0, 10).replace(/\s+/g, '_');
  
    // Concatenate the messages together and return the result
    return message1 + message2;
}

async function updateAnsweredQuestionFunc(resultConv,conversation,questionAskingNow,questionAskingID,timesAsked) {

    let questionData;
    let updateAnsweredQuestionFlag = false;
    if (questionAskingID){
        questionData = await QuestionsEdenAI.findOne({
        _id: questionAskingID,
        });
        updateAnsweredQuestionFlag = true;
    } else if (questionAskingNow){
        questionData = {
        content: questionAskingNow,
        }
        updateAnsweredQuestionFlag = true;
    }

    // console.log("updateAnsweredQuestionFlag = " , updateAnsweredQuestionFlag)
    // console.log("questionData = " , questionData)

    let questionAnsweredUpdate

    if (updateAnsweredQuestionFlag == true) {
        questionAnsweredSoFar = resultConv.questionsAnswered
        if (questionData._id) {

            infoAddQuestion = {
                questionID: questionData._id,
                content: questionData.content,
                timesAsked: timesAsked,
                conversation: conversation,
            }
            console.log("change = 1211122123" )


            questionAnsweredUpdate = await updateQuestionAskedConvoID(questionAnsweredSoFar,questionData._id,infoAddQuestion)
            console.log("change = 1211122124" )


            resultConv.questionsAnswered = questionAnsweredUpdate;

            resultConv = await resultConv.save();
        } else {
            
            infoAddQuestion = {
            questionID: undefined,
            content: questionData.content,
            timesAsked: timesAsked,
            conversation: conversation,
            }

            console.log("change = 202" )
            questionAnsweredUpdate = await updateQuestionAskedConvoID(questionAnsweredSoFar,null,infoAddQuestion)

            resultConv.questionsAnswered = questionAnsweredUpdate;

            resultConv = await resultConv.save();

            console.log("change = 1211122125" )

        }

        

    }

    // console.log("questionAnsweredUpdate = " , questionAnsweredUpdate)


    return resultConv


}

async function findAndUpdateConversationFunc(userID,conversation) {

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

      resultConv = await existingConversation.save();


    } else {

      const newConversation = await new Conversation({
        convKey,
        userID,
        conversation,
        summaryReady: false,
        summary: [],
        updatedAt: Date.now(),
      });

      resultConv = await newConversation.save();

      
    }

    // console.log("resultConv = " , resultConv)

    return resultConv


}


async function findSummaryOfAnswers(convDataNow) {


    questionsAnswered = convDataNow.questionsAnswered

    printC(questionsAnswered,"0","questionsAnswered","b")


    for (let i = 0; i < questionsAnswered.length; i++) {

        const subConversationAnswer = questionsAnswered[i].subConversationAnswer
        const questionContent = questionsAnswered[i].questionContent


        // from subConversationAnswer array of objects (role,content) create a string of the conversation for prompt
        let conversationString = ""
        for (let j = 0; j < subConversationAnswer.length; j++) {
            conversationString = conversationString + subConversationAnswer[j].role + ": " + subConversationAnswer[j].content + "\n"
        }


        printC(conversationString,"1","conversationString","r")


        let promptForSummaryAnswer = ""


        promptForSummaryAnswer += `
        QUESTION: <${questionContent}>

        CONVERSATION: <${conversationString}>

        - Create the SUMMARY that answers to the QUESTION, based on the CONVERSATION above
        - If there is no answer you can create say, <User didn't answer the question>

        SUMMARY:
        `

        printC(promptForSummaryAnswer,"2","promptForSummaryAnswer","p")

        const summaryAnswer = await useGPTchatSimple(promptForSummaryAnswer)

        printC(summaryAnswer,"2","summaryAnswer","g")

        // questionsAnswered[i].summaryOfAnswer = summaryAnswer

        convDataNow.questionsAnswered[i].summaryOfAnswer = summaryAnswer

    }


    return convDataNow
}
  
  

async function updateQuestionAskedConvoID(arr1, ID,infoAddQuestion) {

    // const index = arr1.findIndex(question => question.questionID == ID);

    console.log("arr1, ID,infoAddQuestion = " , arr1, ID,infoAddQuestion)

    if (infoAddQuestion.questionID){
        // console.log("question.questionID.toString() = " , question.questionID.toString())
        // console.log("ID.toString() = " , ID.toString())
        const index = arr1.findIndex(question => question.questionID.toString() == ID.toString());


        if (index !== -1) {
            arr1[index] = {
                questionID: infoAddQuestion.questionID,
                questionContent: infoAddQuestion.content,
                subConversationAnswer: infoAddQuestion.conversation.slice(-infoAddQuestion.timesAsked*2),
                summaryOfAnswer: "",
            };
        } else {
            arr1.push({
                questionID: infoAddQuestion.questionID,
                questionContent: infoAddQuestion.content,
                subConversationAnswer: infoAddQuestion.conversation.slice(-infoAddQuestion.timesAsked*2),
                summaryOfAnswer: "",
            });
        }
    } else {

        const index = arr1.findIndex(question => question.questionContent.toString() == infoAddQuestion.content.toString());


        if (index !== -1) {
            arr1[index] = {
                questionID: undefined,
                questionContent: infoAddQuestion.content,
                subConversationAnswer: infoAddQuestion.conversation.slice(-infoAddQuestion.timesAsked*2),
                summaryOfAnswer: "",
            };
        } else {
            arr1.push({
                questionID: undefined,
                questionContent: infoAddQuestion.content,
                subConversationAnswer: infoAddQuestion.conversation.slice(-infoAddQuestion.timesAsked*2),
                summaryOfAnswer: "",
            });
        }

    }

    console.log("change = 2099")
  
  
    return arr1;
  }
  



module.exports = {
    concatenateFirstTwoMessages,
    updateQuestionAskedConvoID,
    updateAnsweredQuestionFunc,
    findAndUpdateConversationFunc,
    findSummaryOfAnswers,
};