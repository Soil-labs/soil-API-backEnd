
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");


const { findBestEmbedings,upsertEmbedingPineCone,useGPTchatSimple } = require("./aiModules");

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

            if (questionData){
                res = {
                    _id: questionData._id,
                    content: questionData.content
                }
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

        upsertDoc = await upsertEmbedingPineCone({
            text: content,
            _id: result._id,
            label: "questionsEdenAI",
          });

          console.log("change = 2")

          
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
    CONTENT: <${questionContent.content}>

    - Create a SUMMARY of the CONTENT  with Maximum 3-5 words!!!

    SUMMARY:
    `

    const questionSmall = await useGPTchatSimple(promptQuestionSmall)

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