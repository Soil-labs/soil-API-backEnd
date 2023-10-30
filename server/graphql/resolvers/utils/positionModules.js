
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { Conversation } = require("../../../models/conversationModel");

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
        "Be negative find all the reasons that it will not be a good fit";
    }

    promptBackground = `
      You are an Interviewer, create a summary if a candidate is a good fit for the position.

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



    // ------------------- Background smallVersion + oneLiner Analysis -------------------
    promptPreviousBackground = `
      You are an Interviewer, create a summary if a candidate is a good fit for the position.

      Original Text (delimited by <>) < ${backgroundAnalysis} >


      - focus on talking directly to the point and only adding important information

      - You need to create two versions of the summary 
      - a Small Version only MAX 23 words 
      - a One Liner version only MAX 7 words (focus on skill related information)

      - SOS always follow exactly the format of the example
      
      Example: 

      Small Version:
      One Liner 
      `;

    // printC(promptBackground,"6","promptBackground","g")

    smallVersionPlusOneLiner = await useGPTchatSimple(
      promptPreviousBackground,
      0.7,
      "API 1"
    );

    // smallVersionPlusOneLiner = `
    // Small Version:
    // The candidate's extensive experience with JavaScript frameworks and version control systems makes them a good fit for the frontend developer position.

    // One Liner:
    // Experienced in JavaScript frameworks and version control.
    // `

    printC(smallVersionPlusOneLiner, "7", "smallVersionPlusOneLiner", "g");

    // regex to split the text to smallVersion and oneLiner
    let oneLiner = smallVersionPlusOneLiner.split("One Liner:")[1];
    oneLiner = oneLiner.replace(/\n/g, "").trim();

    
    
    let onlySmallVer = smallVersionPlusOneLiner.replace(oneLiner, "").replace("One Liner:", "");
    let smallVersion = onlySmallVer.split("Small Version:")[1];
    smallVersion = smallVersion.replace(/\n/g, "").trim();
    


    printC(oneLiner, "7", "oneLiner", "b");
    printC(smallVersion, "7", "smallVersion", "b");

    // sd9
    // ------------------- Background smallVersion + oneLiner Analysis -------------------



    // // ------------------- Skill Analysis -------------------
    // instructionsScore = "";
    // if (skillScore > 70) {
    //   instructionsScore = "Be really positive Find all the reasons that it is a great fit";
    // } else if (skillScore > 50) {
    //   instructionsScore =
    //     "Be positive but also fair find the reasons that will work and report them";
    // } else if (skillScore > 30) {
    //   instructionsScore =
    //     "Be neutral find the reasons that will work and don't work and report them";
    // } else {
    //   instructionsScore =
    //     "Be negative find all the reasons that it will not be a good fit";
    // }
    // promptSkill = `
    //   You are an Interviewer, create a summary if a candidate is a good fit for the position specifically focusing on the skills of the candidate.

    //   - JOB POSITION (delimited by <>) < ${positionRequirements} >

    //   - CANDIDATE INFO (delimited by <>) < ${prompt_cv} >

    //   - Understand the JOB POSITION, and analyze the CANDIDATE INFO
    //   - Analyze why the candidate fit or NOT for this position specifically focusing on the skills
    //   - Go straight to the point!! don't unnecessary words and don't repeat yourself

    //   ${instructionsScore}

      
    //   Summary of skill analysis in only 1.5 sentences MAX 45 words: 
    //   `;

    // // printC(promptSkill,"6","promptSkill","g")

    // skillAnalysis = await useGPTchatSimple(promptSkill, 0.7, "API 1");

    // printC(skillScore, "7", "skillScore", "p");
    // printC(instructionsScore, "7", "instructionsScore", "r");
    // printC(skillAnalysis, "7", "skillAnalysis", "g");
    // // ------------------- Skill Analysis -------------------



    // // ------------------- JobRequirements Analysis -------------------
    // instructionsScore = "";
    // if (jobRequirementsScore > 70) {
    //   instructionsScore = "Be really positive Find all the reasons that it is a great fit";
    // } else if (jobRequirementsScore > 50) {
    //   instructionsScore =
    //     "Be positive but also fair find the reasons that will work and report them";
    // } else if (jobRequirementsScore > 30) {
    //   instructionsScore =
    //     "Be neutral find the reasons that will work and don't work and report them";
    // } else {
    //   instructionsScore =
    //     "Be negative find all the reasons that it will not be a good fit";
    // }
    // promptJobRequirements = `
    //   You are an Interviewer, create a summary if a candidate is a good fit for the position specifically focusing on the Requirements of this positions and if they are fulfilled

    //   - JOB POSITION (delimited by <>) < ${positionRequirements} >

    //   - CANDIDATE INFO (delimited by <>) < ${prompt_cv} >

    //   - Understand the JOB POSITION, and analyze the CANDIDATE INFO
    //   - Analyze why the candidate fit or NOT for this position focusing on the Requirements of this positions
    //   - Don't talk about Skills!
    //   - Go straight to the point!! don't unnecessary words and don't repeat yourself
      
    //   ${instructionsScore}

    //   Summary the most interesting info in only 1.5 sentences MAX 45 words: 
    //   `;

    // // printC(promptJobRequirements,"6","promptJobRequirements","g")

    // jobRequirementsAnalysis = await useGPTchatSimple(
    //   promptJobRequirements,
    //   0.7,
    //   "API 2"
    // );

    // printC(jobRequirementsScore, "7", "jobRequirementsScore", "p");
    // printC(instructionsScore, "7", "instructionsScore", "r");

    // printC(jobRequirementsAnalysis, "7", "jobRequirementsAnalysis", "g");
    // // ------------------- JobRequirements Analysis -------------------


    
    // ------------ Add to candidate ------------
    positionData.candidates[j].analysisCandidateEdenAI = {
      ...positionData.candidates[j].analysisCandidateEdenAI,
      background: {
        content: backgroundAnalysis,
        smallVersion: smallVersion,
        oneLiner: oneLiner,
      },
      // fitRequirements: {
      //   content: jobRequirementsAnalysis,
      // },
      // skills: {
      //   content: skillAnalysis,
      // },
      flagAnalysisCreated: true,
    };
    // ------------ Add to candidate ------------

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

async function findKeyAttributeAndPotentialPositionFunc(positionID, convData = null) {

  positionData = await Position.findOne({ _id: positionID }).select('_id name positionsRequirements ');

  // printC(positionData,"2","positionData","b")


  const jobDescription = positionData.positionsRequirements.originalContent

  if (convData == null){

    convData = await Conversation.findOne({
      $and: [{ positionID: positionID }, { positionTrainEdenAI: "true" }],
    }).select("_id conversation");

  }



    let promptConv = "";
    for (let i = 0; i < convData.conversation.length; i++) {
      let convDataNow = convData.conversation[i];
      if (convDataNow.role == "assistant")
        promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
      else
        promptConv = promptConv + "User" + ": " + convDataNow.content + " \n\n";
    }





  keyPrioritiesAndPotentialPrompt = `
    Job Description (delimited <>): <${jobDescription}>
    Conversation (delimited <>): <${promptConv}>

    You are a Recruiter, find the key attribute of the position and the attributes that show Future Potential candidates for this position. based on the Job Description and the Conversation with the Hiring Manager
    - Use Exactly the Example as the Format
    - Find 1 Key Attribute for the position
    - Find 3 attributes that show Future Potential candidates for this position
    - Don't give examples for the keyAttribute and futurePotential, only the attributes, with 1-3 words MAXIMUM each attribute

    Example: 
    keyAttribute: X1
    futurePotential: 
    1. X2
    2. X3
    3. X4

    Result: 
  `

  keyPrioritiesAndPotential = await useGPTchatSimple(keyPrioritiesAndPotentialPrompt, 0.7, "API 1")

  // keyPrioritiesAndPotential = `keyAttributes: Willingness to Learn
  // futurePotential:
  // 1. Curiosity
  // 2. Action-oriented
  // 3. Adaptability
  // `

  printC(keyPrioritiesAndPotential,"4","keyPrioritiesAndPotential","g")



  // -------------------- Regex --------------------
  let keyAttributes = keyPrioritiesAndPotential.match(/keyAttribute:\s(.+)/)[1];

  console.log("22")
  
  // let futurePotential = keyPrioritiesAndPotential.match(/futurePotential:\s(.+)/)[1].split(", ");
  let futurePotential = keyPrioritiesAndPotential.trim().split(/\d+\. /).slice(1);

  futurePotentialMong = []
  futurePotential.map((item, index) => {
    futurePotential[index] = item.replace(/\n/g, "").trim();

    futurePotentialMong.push({
      attribute: futurePotential[index],
    })

  });

  printC(keyAttributes,"4","keyAttributes","b")
  
  printC(futurePotential,"4","futurePotential","b")
  // -------------------- Regex --------------------


  // ------------ Sav Mongo ------------
  positionData.positionsRequirements.keyAttributes = [{
    attribute: keyAttributes,
  }]  

  positionData.positionsRequirements.futurePotential = futurePotentialMong

  await positionData.save();
  // ------------ Sav Mongo ------------  

  

  return positionData

}

async function findKeyAttributeAndPotentialCandidateWrapper(positionID,userID,convData) {

  positionData = await Position.findOne({ _id: positionID }).select('_id name positionsRequirements candidates');


  // -------------- Decide and collect Candidates to process --------------
  membersToProcess = []
  idxMemberToPosition = []

  membersData = await Members.find({ _id: { $in: userID } }).select('_id discordName cvInfo ');

  // find the IDX on the positionData candidates
  for (let i = 0; i < membersData.length; i++) {
    let memberData = membersData[i];
    idxPosition = positionData.candidates.findIndex(candidate => candidate.userID.toString() == memberData._id.toString());
    if (idxPosition != -1){
      membersToProcess.push(memberData)
      idxMemberToPosition.push(idxPosition)
    }
  }
  printC(membersToProcess, "1", "membersToProcess", "g");

  printC(idxMemberToPosition, "1", "idxMemberToPosition", "g");
  // -------------- Decide and collect Candidates to process --------------


  await findKeyAttributeAndPotentialCandidateFunc(positionData,membersToProcess,idxMemberToPosition,convData)

}


async function findKeyAttributeAndPotentialCandidateFunc(positionData,membersToProcess,idxMemberToPosition,convData = null) {


    // ------------- Add the conversation of this candidates ---------------
    convPromptArr = []

    for (let j = 0; j < membersToProcess.length; j++) {

      memberNow = membersToProcess[j];

      if (convData == null){
        convData = await Conversation.findOne({
          $and: [{ userID: memberNow._id }, { positionID: positionData._id}],
        }).select("_id conversation");
      }

      let promptConv = "";
      if (convData && convData.conversation && convData.conversation.length != 0){
        for (let i = 0; i < convData.conversation.length; i++) {
          let convDataNow = convData.conversation[i];
          if (convDataNow.role == "assistant")
            promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
          else
            promptConv = promptConv + "User" + ": " + convDataNow.content + " \n\n";
        }
      }

      printC(promptConv,"4","promptConv","b")

      convPromptArr.push(promptConv)

    }
    // ------------- Add the conversation of this candidates ---------------


    // ------------- position key Priorities and future potential prompt ---------------
    const keyAttributes = positionData.positionsRequirements.keyAttributes

    keyAttributesPrompt = ''

    for ( let i=0;i<keyAttributes.length;i++){
      keyAttributesPrompt = keyAttributesPrompt + keyAttributes[i].attribute + ', '
    }
    // delete the last comma
    keyAttributesPrompt = keyAttributesPrompt.slice(0, -2);
    keyAttributesPrompt = keyAttributesPrompt + "\n\n"


    const futurePotential = positionData.positionsRequirements.futurePotential

    futurePotentialPrompt = ''

    for ( let i=0;i<futurePotential.length;i++){
      futurePotentialPrompt = futurePotentialPrompt + futurePotential[i].attribute + ', '
    }
    // delete the last comma
    futurePotentialPrompt = futurePotentialPrompt.slice(0, -2);
    futurePotentialPrompt = futurePotentialPrompt + "\n\n"

    printC(keyAttributesPrompt,"4","keyAttributesPrompt","y")
    printC(futurePotentialPrompt,"4","futurePotentialPrompt","y")
    // ------------- position key Priorities and future potential prompt ---------------


    // ------------ Find paragraph analyses key Attribute and future potential -------------------
    for (let j = 0; j < membersToProcess.length; j++) {
    
      memberNow = membersToProcess[j];

      cvCandidate = memberNow.cvInfo.cvContent

      convoMember = convPromptArr[j]

      keyAttributesAndFuturePotentialPrompt = `
        CV Candidate (delimited <>): <${cvCandidate.slice(0,1900)}>
        Conversation (delimited <>): <${convoMember.slice(0,1900)}>


        Job searching for Key Attributes (delimited <>): <${keyAttributesPrompt} , ${futurePotentialPrompt}>

        - For all this key Attributes find Score and Reason
        - Score from 1-10
        - Reason 1 paragraph, 2-4 sentences 
        - Use exactly the format of the example

        Example:

        [{
          "attribute": X1
          "score": S1
          "season": R1
        }, {
          ...
        }


        Result: 
        `

        keyAttributesAndFuturePotential = await useGPTchatSimple(keyAttributesAndFuturePotentialPrompt, 0, "API 1")


        printC(keyAttributesAndFuturePotential,"4","keyAttributesAndFuturePotential","g")



        // ------------- Regex split keyAttributesAndFuturePotential ---------------

        keyAttributesAndFuturePotential = keyAttributesAndFuturePotential.replace(/\n/g, "").trim();
        keyAttributesAndFuturePotential = keyAttributesAndFuturePotential.replace(/'/g, "");

        keyAttributesAndFuturePotential = keyAttributesAndFuturePotential.replace(/'/g, '"');

        keyAttributesAndFuturePotential = JSON.parse(keyAttributesAndFuturePotential)

        printC(keyAttributesAndFuturePotential,"4","keyAttributesAndFuturePotential","b")

        // ------------- Regex split keyAttributesAndFuturePotential ---------------


        // -------------- Save Mongo --------------
        const posMember = idxMemberToPosition[j]

        // only the first position of the array keyAttributesAndFuturePotential
        positionData.candidates[posMember].keyAttributes = keyAttributesAndFuturePotential[0]

        // all the rest of the keyAttributesAndFuturePotential
        positionData.candidates[posMember].futurePotential = keyAttributesAndFuturePotential.slice(1)
        // -------------- Save Mongo --------------
        
        
        
      }
    
    
    await positionData.save();
    

    return positionData



}


module.exports = {
    addQuestionToEdenAIFunc,
    addMultipleQuestionsToEdenAIFunc,
    checkAndAddPositionToMember,
    candidateEdenAnalysisPositionFunc,
    findKeyAttributeAndPotentialPositionFunc,
    findKeyAttributeAndPotentialCandidateFunc,
    findKeyAttributeAndPotentialCandidateWrapper,
};