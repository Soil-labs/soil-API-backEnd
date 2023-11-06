
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


async function candidateEdenAnalysisPositionFunc(positionData,userID=undefined) {

// 
  // f2
  for (let j = 0; j < positionData.candidates.length; j++) {
    // for (let j = 0;j<1;j++){

    let candidate

    // printC(positionData.candidates[j].userID, "2", "positionData.candidates[j]", "b")
    // printC(userID, "2", "userID", "b")

    if (userID != undefined){
      if (positionData.candidates[j].userID.toString() != userID.toString()){
        continue;
      }

      candidate = positionData.candidates[j];
    } else {
      candidate = positionData.candidates[j];

      if (candidate?.analysisCandidateEdenAI?.flagAnalysisCreated == true)
        continue;
    }


    // printC(candidate, "2", "candidate", "b");
    // f2
      
    positionRequirements = positionData.positionsRequirements.originalContent;

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
    // if (memberData?.cvInfo?.cvMemory) {
    //   prompt_cv = memberData?.cvInfo?.cvMemory
    //     ?.map((memory) => memory.memoryContent)
    //     .join(" \n\n ");
    // } else {
    prompt_cv = memberData?.cvInfo?.cvContent;
    // }



    // ----------------- Find score -----------------
    
    let backgroundScore;
    if (candidate.scoreCardTotal && candidate.scoreCardTotal.score) {
      backgroundScore = candidate.scoreCardTotal.score;
    } else {
      backgroundScore = 0.5; // default value will make eden to be neutreal 
    }


    printC(backgroundScore, "7", "backgroundScore", "g");

    // ------------------- Background Analysis -------------------
    let instructionsScore = "";
    if (backgroundScore > 0.8) {
      instructionsScore = "Be really positive Find all the reasons that it is a great fit";
    } else if (backgroundScore > 0.6) {
      instructionsScore =
        "Be positive but also fair find the reasons that will work and report them";
    } else if (backgroundScore > 0.4) {
      instructionsScore =
        "Be neutral find the reasons that will work and don't work and report them";
    } else {
      instructionsScore =
        "Be negative find all the reasons that it will not be a good fit";
    }

    printC(backgroundScore, "7", "backgroundScore", "p");
    printC(instructionsScore, "7", "instructionsScore", "r");


    promptBackground = `
      You are an Interviewer, create a summary if a candidate is a good fit for the position.

      - JOB POSITION (delimited by <>) < ${positionRequirements} >

      - CANDIDATE INFO (delimited by <>) < ${prompt_cv} >

      - Understand the JOB POSITION, and analyze the CANDIDATE INFO
      - Analyze why the candidate fit or or NOT for this position based on specific previous relevant positions and relevant education that the candidate had 

      
      
      Summary in 2 sentences MAX 75 words, ${instructionsScore}: 
      `;

    printC(positionRequirements,"6","positionRequirements","g")
    printC(prompt_cv,"7","prompt_cv","b")
    // f2

    backgroundAnalysis = await useGPTchatSimple(
      promptBackground,
      0.7,
      "API 2",
      "chatGPT4"
    );

    // printC(backgroundScore, "7", "backgroundScore", "p");
    // printC(instructionsScore, "7", "instructionsScore", "r");

    printC(backgroundAnalysis, "7", "backgroundAnalysis", "g");
    // f1


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


async function findPrioritiesTrainEdenAIFunc(varT) {


  const { positionID } = varT;


  try {
    if (!positionID) {
      throw new ApolloError("positionID is required");
    }

    positionData = await Position.findOne({ _id: positionID }).select(
      "_id positionsRequirements"
    );



    if (!positionData) {
      throw new ApolloError("Position not found");
    }

    // if (false){
    if (positionData.positionsRequirements?.priorities?.length > 0 && positionData.positionsRequirements?.tradeOffs?.length > 0) {

      let prioritiesT = positionData.positionsRequirements.priorities;
      let tradeoffsT = positionData.positionsRequirements.tradeOffs;

      return {
        success: true,
        priorities: prioritiesT,
        tradeOffs: tradeoffsT,
      };

    }

    positionsRequirements =
      positionData.positionsRequirements.originalContent;

    printC(positionsRequirements, "3", "positionsRequirements", "b");


    // --------------------------------- Find Priorities ---------------------------------
    let promptNewQuestions = `
      REQUIREMENTS of Job Position (delimiters <>): <${positionsRequirements}>

      - Your Task is based on teh content to find the Priorities for this Job Position 
      - you can use Maximum 1 sentence to explain why you choose a priority, maximum 5 priorities
      - You would give the priorities from the highest at the Top to the lowest at the Bottom
      - Choose priorities from (Cultural fit, Technical skills, Soft skills, Work experience, Leadership potential, Diversity and inclusion, Long-term prospects, Motivation and enthusiasm, Initiative and creativity, Flexibility, Reliability and work ethic, Collaboration skills, Strong references, Customer or client focus, Industry knowledge )

      Example priority structure:
       1. Priority Title - Reason based on Requirements in MAX 20 words
       2. Priority Title - Reason based on Requirements in MAX 20 words
      
      Priorities:
    `;

    printC(promptNewQuestions, "3", "promptNewQuestions", "b");

    prioritiesSuggestions = await useGPTchatSimple(
      promptNewQuestions,
      0,
      "API 1"
    );

    printC(prioritiesSuggestions, "3", "prioritiesSuggestions", "p");

    // prioritiesSuggestions = `1. Technical skills - Strong experience with Spring framework, NoSQL and SQL databases, and message queue systems (e.g Kafka).
    // 2. Leadership potential - Lead technical decisions inside and across teams to improve technical excellence through lateral leadership.
    // 3. Work experience - 4+ years experience working as a Backend Java Engineer.
    // 4. Collaboration skills - Contribute to finding the best solutions for customer service products that make operations easier.
    // 5. Motivation and enthusiasm - Enjoy working within an agile setup.`

    const regex = /(\d+)\.\s+(.*)\s+-\s+(.*)/g;
    const prioritiesArray = [];

    let match;
    while ((match = regex.exec(prioritiesSuggestions)) !== null) {
      const questionObject = {
        priority: match[2],
        reason: match[3],
      };
      prioritiesArray.push(questionObject);
    }

    printC(prioritiesArray, "3", "prioritiesArray", "g");
    // --------------------------------- Find Priorities ---------------------------------

    // --------------------------------- Find TradeOffs ---------------------------------
    let promptNewTradeOffs = `
      REQUIREMENTS of Job Position (delimiters <>): <${positionsRequirements}>

      - Your Task is based on teh content to find the TradeOffs for this Job Position 
      - you can use Maximum 1 sentence to explain why you choose a priority, maximum 5 tradeOffs
      - You would give the tradeOffs from the highest at the Top to the lowest at the Bottom
      - Choose tradeOffs from (Quality vs. Quantity, Experience vs. Potential, Skills vs. Cultural Fit, Speed vs. Thoroughness, Internal vs. External Candidates, Role Flexibility vs. Specialization, Remote Work vs. Onsite Presence, Diversity vs. Cultural Homogeneity, Compensation vs. Non-monetary Benefits, Direct Hire vs. Contract-to-hire, Long-term vs. Short-term Fit, Local vs. International Candidates, Traditional vs. Innovative Sourcing, Employer Brand Visibility vs. Highly-targeted Approaches, Candidate Experience vs. Time Investment)
      - You should choose the right tradeoff for this REQUIREMENTS

      Example priority structure:
       1. TradeOff1 VS TradeOff2 - Choose: TradeOff2 - Reason based on Requirements
       2. TradeOff1 VS TradeOff2 - Choose: TradeOff1 - Reason based on Requirements
      
      TradeOffs:
    `;

    printC(promptNewTradeOffs, "3", "promptNewTradeOffs", "b");
    

    tradeOffsSuggestions = await useGPTchatSimple(
      promptNewTradeOffs,
      0,
      "API 1"
    );

    printC(tradeOffsSuggestions, "3", "tradeOffsSuggestions", "p");

    // tradeOffsSuggestions = `1. Quality vs. Quantity - Choose: Quality - The job position requires a strong understanding of software development best practices and the ability to design new products from scratch, indicating a need for high-quality work rather than a high quantity of work.
    // 2. Experience vs. Potential - Choose: Experience - The job position specifically states a requirement of 4+ years of experience, indicating a preference for candidates with proven experience in the role rather than potential for growth.
    // 3. Skills vs. Cultural Fit - Choose: Skills - The job position lists specific technical skills and experience with certain technologies, indicating a higher priority on skills rather than cultural fit.
    // 4. Speed vs. Thoroughness - Choose: Thoroughness - The job position emphasizes the importance of code quality, testing, and deployment, indicating a need for thoroughness in the development process rather than speed.
    // 5. Role Flexibility vs. Specialization - Choose: Specialization - The job position is specifically for a Senior Backend Java Engineer, indicating a need for candidates with specialized skills in this area rather than a more flexible role.`

    // const regexT = /(\d+)\.\s+(.+?)\s+-\s+(.+?)(?=\d+\.|$)/gs;
    const regexT = /(\d+\.\s+.+?)\s+-\s+(Choose:\s+.+?)\s+-\s+(.+?)(?=\d+\.|$)/gs;

    const tradeoffsArray = [];
    let matchT;
    while ((matchT = regexT.exec(tradeOffsSuggestions)) != null) {

      const tradeoffObject = {
        tradeOff1: matchT[1].split(" vs. ")[0].replace(/^\d+\.\s*/, "").trim(),
        tradeOff2: matchT[1].split(" vs. ")[1],
        selected: matchT[2].replace("Choose:", "").trim(),
        reason: matchT[3],
      };
      tradeoffsArray.push(tradeoffObject);
    }

    printC(tradeoffsArray, "3", "tradeoffsArray", "g");
    // --------------------------------- Find TradeOffs ---------------------------------


    // Save the priorities and tradeoffs to the Position
    positionData.positionsRequirements.priorities = prioritiesArray;
    positionData.positionsRequirements.tradeOffs = tradeoffsArray;
    await positionData.save();
    

    return {
      success: true,
      priorities: prioritiesArray,
      tradeOffs: tradeoffsArray,
    };
  } catch (err) {
    printC(err, "-1", "err", "r")
    throw new ApolloError(
      err.message,
      err.extensions?.code || "findPrioritiesTrainEdenAI",
      {
        component: "aiMutation > findPrioritiesTrainEdenAI",
      }
    );
  }


}

async function positionSuggestQuestionsAskCandidateFunc(varT) {


  const { positionID } = varT;

  printC(positionID, "3", "positionID", "b")


  try {
    if (!positionID) {
      throw new ApolloError("positionID is required");
    }

    positionData = await Position.findOne({ _id: positionID }).select(
      "_id positionsRequirements questionsToAsk"
    );

    if (!positionData) {
      throw new ApolloError("Position not found");
    }

    console.log(
      "positionData.questionsToAsk = ",
      positionData.questionsToAsk
    );


    // ---------- If the quesitons are already calculated -------------
    if (positionData.questionsToAsk.length > 0) {
      questionIDs = [];
      positionData.questionsToAsk.forEach((question) => {
        questionIDs.push(question.questionID);
      });

      console.log("questionIDs = ", questionIDs);

      //get the questions from the DB
      questionData = await QuestionsEdenAI.find({
        _id: { $in: questionIDs },
      }).select("_id content category");

      console.log("questionData = ", questionData);

      if (questionData.length > 0) {
        // change format of the questionData
        questionData = questionData.map((question) => {
          return {
            question: question.content,
            category: question.category,
          };
        });

        // if and of the questionData is category null then don't reuturn it
        questionData = questionData.filter((question) => {
          return question.category != null;
        });

        return {
          success: true,
          questionSuggest: questionData,
        };
      }
    }
    // ---------- If the quesitons are already calculated -------------


    // positionsRequirements = positionData.positionsRequirements.content;
    positionsRequirements = positionData.positionsRequirements.originalContent;

    // Skills, education, Experience, Industry Knowledge, Culture Fit, Communication Skills
    let promptNewQuestions = `
      REQUIREMENTS of Job Position (delimiters <>): <${positionsRequirements}>

      - you can only ask 1 concise question at a time
      - You should stay really close to the context of the REQUIREMENTS Job Position, and try to cover most of the requirements!
      - Your goal is to ask the best questions in order to understand if the Candidate is a good fit for the Job Position
      - Your task is to suggest MAXIMUM 9 questions for the Recruiter to ask the Candidate
      - For every question add only ONE of this Categories (delimiters <>): < Technical Skills | Human Skills | Experiences | Industry Knowledge | Culture Fit | Other >

      Example:
       1. Concise Question - Category
       2. Concise Question - Category
      
      Questions:
    `;

    printC(promptNewQuestions, "3", "promptNewQuestions", "b");

    questionsSuggest = await useGPTchatSimple(promptNewQuestions, 0, "API 2");

    // questionsSuggest =  `
    // 1. Can you give an example of a time when you had to use your strong organizational skills to successfully complete a project?
    // 2. Have you worked in a team environment before? Can you give an example of a successful teamwork experience?
    // 3. How do you handle communication and cooperation with team members who may have different working styles or personalities?
    // 4. Can you tell us about a time when you had to motivate yourself to learn a new skill or take on a new responsibility?
    // 5. How familiar are you with Scrum and Kanban methodologies? Can you give an example of how you have used them in a project?
    // 6. Have you worked with Python before? Can you give an example of a project you have completed using Python?
    // 7. How comfortable are you with using Unix and Linux command line? Can you give an example of a task you have completed using these systems?
    // 8. Can you explain your knowledge of telecom protocols, IP, and networking? Have you worked with these technologies before?
    // 9. Are you able to commit to at least 4-5 hours per working day for this position? How do you plan to balance your other commitments with this job?
    // `

    printC(questionsSuggest, "3", "questionsSuggest", "b");



    // const regex = /(\d+)\.\s+(.*)/g;
    // const questionsArray = [];

    // let match;
    // while ((match = regex.exec(questionsSuggest)) !== null) {
    //   const questionObject = {
    //     question: match[2],
    //   };
    //   questionsArray.push(questionObject);
    // }
    const regex = /(\d+)\.\s+(.*)\s+-\s+(.*)/g;
    const questionsArray = [];

    let match;
    while ((match = regex.exec(questionsSuggest)) !== null) {
      const questionObject = {
        question: match[2],
        category: match[3].split("/")[0].trim(),
      };
      questionsArray.push(questionObject);
    }

    printC(questionsArray, "3", "questionsArray", "b");

    return {
      success: true,
      questionSuggest: questionsArray,
    };
  } catch (err) {
    printC(err, "-1", "err", "r")
    throw new ApolloError(
      err.message,
      err.extensions?.code || "positionSuggestQuestionsAskCandidate",
      {
        component: "aiMutation > positionSuggestQuestionsAskCandidate",
      }
    );
  }

}


module.exports = {
    addQuestionToEdenAIFunc,
    addMultipleQuestionsToEdenAIFunc,
    checkAndAddPositionToMember,
    candidateEdenAnalysisPositionFunc,
    findKeyAttributeAndPotentialPositionFunc,
    findKeyAttributeAndPotentialCandidateFunc,
    findKeyAttributeAndPotentialCandidateWrapper,
    findPrioritiesTrainEdenAIFunc,
    positionSuggestQuestionsAskCandidateFunc,
};