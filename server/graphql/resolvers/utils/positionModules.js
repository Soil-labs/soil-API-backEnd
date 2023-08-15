
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Members } = require("../../../models/membersModel");

const { printC } = require("../../../printModule");


const { findBestEmbedings,useGPTchatSimple } = require("./aiExtraModules");


const {
  addMemoryPineconeFunc,
} = require("../utils/memoryPineconeModules");

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


async function candidateEdenAnalysisPositionFunc(positionData) {


  for (let j = 0; j < positionData.candidates.length; j++) {
    // for (let j = 0;j<1;j++){

    candidate = positionData.candidates[j];

    if (candidate?.analysisCandidateEdenAI?.flagAnalysisCreated == true)
      continue;

      
    positionRequirements = positionData.positionsRequirements.content;

    // printC(positionRequirements,"2","positionRequirements","b")

    // find member on mongo
    memberData = await Members.findOne({ _id: candidate.userID }).select(
      "_id discordName cvInfo"
    );

    cvMember = memberData.cvInfo.cvContent;

    // printC(cvMember,"3","cvMember","b")

    // printC(memberData?.cvInfo?.cvMemory,"4","memberData?.cvInfo?.cvMemory","b")

    // combine the cvMemory for Prompt
    prompt_cv = "";
    if (memberData?.cvInfo?.cvMemory) {
      prompt_cv = memberData?.cvInfo?.cvMemory
        ?.map((memory) => memory.memoryContent)
        .join(" \n\n ");
    } else {
      prompt_cv = memberData?.cvInfo?.cvContent;
    }

    // printC(prompt_cv,"5","prompt_cv","b")

    // ------------------- Find the Score ----------------------
    // Background Score
    let matchScore = candidate.overallScore;
    // Skill Score
    let skillScore = candidate.skillScore;
    //JobRequirement Score
    let jobRequirementsScore = 0;
    let jobRequirementsScoreCount = 0;
    if (candidate?.compareCandidatePosition?.reportPassFail) {
      for (let k = 0;k < candidate?.compareCandidatePosition?.reportPassFail.length;k++) {
        let score =
          candidate?.compareCandidatePosition?.reportPassFail[k].score;

        if (score != undefined && score > 3) {
          jobRequirementsScore += score;
          jobRequirementsScoreCount += 1;
        }
      }
    }

    if (jobRequirementsScoreCount > 0) {
      jobRequirementsScore =
        (jobRequirementsScore / jobRequirementsScoreCount) * 10;
    }

    let backgroundScore =
      (matchScore + skillScore + jobRequirementsScore) / 3;

    // ------------------- Find the Score ----------------------

    // ------------------- Background Analysis -------------------
    let instructionsScore = "";
    if (backgroundScore > 70) {
      instructionsScore = "Be really positive Find all the reasons that it is a great fit";
    } else if (backgroundScore > 50) {
      instructionsScore =
        "Be positive but also fair find the reasons that will work and report them";
    } else if (backgroundScore > 30) {
      instructionsScore =
        "Be neutral find the reasons that will work and don't work and report them";
    } else {
      instructionsScore =
        "Be really negative find all the reasons that it will not be a good fit";
    }

    promptBackground = `
      You are an Interviewer, you need for an opinion and then create a summary if a candidate is a good fit for the position.

      - JOB POSITION (delimited by <>) < ${positionRequirements} >

      - CANDIDATE INFO (delimited by <>) < ${prompt_cv} >

      - Understand the JOB POSITION, and analyze the CANDIDATE INFO
      - Analyze why the candidate fit or or NOT for this position based on specific previous relevant positions and relevant education that the candidate had 

      ${instructionsScore}
      
      Summary in 2 sentences basing analysis on specific names of previous jobs MAX 45 words: 
      `;

    // printC(promptBackground,"6","promptBackground","g")

    backgroundAnalysis = await useGPTchatSimple(
      promptBackground,
      0.7,
      "API 2"
    );

    printC(backgroundScore, "7", "backgroundScore", "p");
    printC(instructionsScore, "7", "instructionsScore", "r");

    printC(backgroundAnalysis, "7", "backgroundAnalysis", "g");

    // ------------------- Background Analysis -------------------

    // ------------------- Skill Analysis -------------------
    instructionsScore = "";
    if (skillScore > 70) {
      instructionsScore = "Be really positive Find all the reasons that it is a great fit";
    } else if (skillScore > 50) {
      instructionsScore =
        "Be positive but also fair find the reasons that will work and report them";
    } else if (skillScore > 30) {
      instructionsScore =
        "Be neutral find the reasons that will work and don't work and report them";
    } else {
      instructionsScore =
        "Be really negative find all the reasons that it will not be a good fit";
    }
    promptSkill = `
      You are an Interviewer, you need for an opinion and then create a summary if a candidate is a good fit for the position specifically focusing on the skills of the candidate.

      - JOB POSITION (delimited by <>) < ${positionRequirements} >

      - CANDIDATE INFO (delimited by <>) < ${prompt_cv} >

      - Understand the JOB POSITION, and analyze the CANDIDATE INFO
      - Analyze why the candidate fit or NOT for this position specifically focusing on the skills
      - Go straight to the point!! don't unnecessary words and don't repeat yourself

      ${instructionsScore}

      
      Summary of skill analysis in only 1.5 sentences MAX 45 words: 
      `;

    // printC(promptSkill,"6","promptSkill","g")

    skillAnalysis = await useGPTchatSimple(promptSkill, 0.7, "API 1");

    printC(skillScore, "7", "skillScore", "p");
    printC(instructionsScore, "7", "instructionsScore", "r");
    printC(skillAnalysis, "7", "skillAnalysis", "g");
    // ------------------- Skill Analysis -------------------

    // ------------------- JobRequirements Analysis -------------------
    instructionsScore = "";
    if (jobRequirementsScore > 70) {
      instructionsScore = "Be really positive Find all the reasons that it is a great fit";
    } else if (jobRequirementsScore > 50) {
      instructionsScore =
        "Be positive but also fair find the reasons that will work and report them";
    } else if (jobRequirementsScore > 30) {
      instructionsScore =
        "Be neutral find the reasons that will work and don't work and report them";
    } else {
      instructionsScore =
        "Be really negative find all the reasons that it will not be a good fit";
    }
    promptJobRequirements = `
      You are an Interviewer, you need for an opinion and then create a summary if a candidate is a good fit for the position specifically focusing on the Requirements of this positions and if they are fulfilled

      - JOB POSITION (delimited by <>) < ${positionRequirements} >

      - CANDIDATE INFO (delimited by <>) < ${prompt_cv} >

      - Understand the JOB POSITION, and analyze the CANDIDATE INFO
      - Analyze why the candidate fit or NOT for this position focusing on the Requirements of this positions
      - Don't talk about Skills!
      - Go straight to the point!! don't unnecessary words and don't repeat yourself
      
      ${instructionsScore}

      Summary the most interesting info in only 1.5 sentences MAX 45 words: 
      `;

    // printC(promptJobRequirements,"6","promptJobRequirements","g")

    jobRequirementsAnalysis = await useGPTchatSimple(
      promptJobRequirements,
      0.7,
      "API 2"
    );

    printC(jobRequirementsScore, "7", "jobRequirementsScore", "p");
    printC(instructionsScore, "7", "instructionsScore", "r");

    printC(jobRequirementsAnalysis, "7", "jobRequirementsAnalysis", "g");
    // ------------------- JobRequirements Analysis -------------------

    // ------------ Add to candidate ------------
    positionData.candidates[j].analysisCandidateEdenAI = {
      ...positionData.candidates[j].analysisCandidateEdenAI,
      background: {
        content: backgroundAnalysis,
      },
      fitRequirements: {
        content: jobRequirementsAnalysis,
      },
      skills: {
        content: skillAnalysis,
      },
      flagAnalysisCreated: true,
    };

    // // ------------ Add to candidate ------------

    // sd0
  }

  // ------------ Add to position ------------
  positionData.candidatesFlagAnalysisCreated = true;
  // ------------ Add to position ------------

  // save it to mongo
  await positionData.save();

  return positionData;
}



async function checkAndAddPositionToMember(usersData, positionID) {
  // usersData.forEach(user => {
    for (let i=0;i<usersData.length;i++){
      const user = usersData[i];
    if (!user.positionsApplied.some(obj => obj.positionID?.toString() == positionID.toString())) {
      user.positionsApplied.push({
        positionID: positionID,
      });
      // send updated user data to MongoDB

      console.log("user = " , user)
      await user.save();
    }
  };
}


module.exports = {
    addQuestionToEdenAIFunc,
    addMultipleQuestionsToEdenAIFunc,
    checkAndAddPositionToMember,
    candidateEdenAnalysisPositionFunc,
};