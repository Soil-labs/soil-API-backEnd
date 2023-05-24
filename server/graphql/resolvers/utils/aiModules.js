

const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");


const axios = require("axios");
const { PineconeClient } = require("@pinecone-database/pinecone");

const { request, gql} = require('graphql-request');

const { printC } = require("../../../printModule");


async function getMemory(messageContent,filter,topK = 3,maxLength = 2000) {

    memories = await findBestEmbedings(messageContent, filter, (topK = topK));

    // printC(memories, "1", "memories", "r")

    const memoriesForPrompt = memories.map((memory) => {

      let myString = memory.metadata.text;
      myString = myString.length > 150 ? myString.substring(0, 150) : myString;


      return myString
    }).join("\n - ");

    return memoriesForPrompt
}

async function interviewQuestionCreationUserFunc(positionID,userID,cvContent) {


  positionData = await Position.findOne({ _id: positionID}).select('_id name candidates questionsToAsk positionsRequirements');
  if (!positionData) throw new ApolloError("Position not found", "interviewQuestionCreationUser", { component: "positionMutation > interviewQuestionCreationUser" });


  userData = await Members.findOne({ _id: userID}).select('_id discordName');
  if (!userData) throw new ApolloError("User not found", "interviewQuestionCreationUser", { component: "positionMutation > interviewQuestionCreationUser" });


  const questionsToAsk = positionData.questionsToAsk

  const questionsToAskID = questionsToAsk.map((question) => question.questionID)

  questionData = await QuestionsEdenAI.find({ _id: questionsToAskID }).select('_id content');

  printC(questionData,"1","questionData","b")

  questionsThatWereAsked = ''



  const questionNow = questionData[0];

  // ------- Find best Open Job Role Memories ----------

  // console.log("positionData?.positionsRequirements = " , positionData?.positionsRequirements?.content)
  // console.log(Object.keys(positionData?.positionsRequirements))

  let bestJobRoleMemories = ""
  if (positionData?.positionsRequirements?.content == undefined) {
    filter = {
      label: "Company_TrainEdenAI_memory",
      _id: positionID,
    };

    bestJobRoleMemories = await getMemory(
      questionNow.content,
      filter,
      (topK = 6),
      250
    );

    
    positionData.positionsRequirements.content = bestJobRoleMemories

    positionData = await positionData.save();
  } else {
    bestJobRoleMemories = positionData.positionsRequirements.content
  } 


  

  // printC(bestJobRoleMemories,"3","bestJobRoleMemories","p")
  // sdf0
  // ------- Find best Open Job Role Memories ----------


  // ----------- CV to Summary -------------
  // let cvContentPrompt = `
  //   CV CONTENT (delimiters <>): <${cvContent}>

  //   - You are a recruiter with task to understand a candidate's CV.
  //   - Your goal is to create a Summary of the CV CONTENT

  //   Summary: 
  // `

  // let cvContentPrompt = `
  //   CV CONTENT (delimiters <>): <${cvContent}>

  //   - You are a recruiter with task to understand a candidate's CV.
  //   - Your goal is to create a Summary of the CV CONTENT
  //   - The summary should have 3 sentense
  //   - only contain most important skills, education and experience

  //   Summary: 
  // `
  // printC(cvContentPrompt,"3","cvContentPrompt","b")

  // // cvSummary = await useGPTchatSimple(cvContentPrompt,0,"API 2")

  // // ----------- CV to Summary -------------

  // // cvSummary = `Lolita Mileta is an experienced Lead Scrum Master and Product Owner with a background in IT and international relations. She has successfully managed teams of up to 42 people, developed hiring processes, and established strong relationships with key stakeholders. Lolita is skilled in Scrum and Agile frameworks, leadership, communication, facilitation, planning, metrics, data analysis, continuous improvement, and has a sub-major in International Tourism, business, and marketing. She is also fluent in English, Ukrainian, Russian, and proficient in Polish. Lolita has volunteered over 200 hours across various communities in the USA and is an alumni of the Future Leaders Exchange Program.`

  // cvSummary = `
  // Ateet Tiwari is a Full Stack Developer with experience in Front-End, Back-End, Database, Messaging Services, and UI Development. He has a strong proficiency in React, Redux, Node, Express, Python, SQL, and MongoDB. Ateet has led initiatives and teams, improved product performance, and designed in-house frameworks and systems. He is a Polygon Fellowship Graduate and has extensive knowledge in web3 development.
  // `

  cvSummary = cvContent

  // printC(cvSummary,"2","cvSummary","r")
  // sdf0

  console.log("----------------------------" )


  // -------- Create Prompt ---------
  
  // let promptJOB_CV = `
  //   JOB_ROLE (delimiters <>): <${bestJobRoleMemories}>

  //   USER_CV (delimiters <>) <${cvSummary}>

  //   - Your goal is to collect information from the candidate for the JOB_ROLE.
  //   - Analyse for each point of the JOB_ROLE if a Candidate has the right CV info or he is missing something, be creative on the ways that the candidate background can be applied on the role

  //   - smallest number of Bullet points with small summary analyzing the JOB_ROLE for this USER CV:
  // `
  let promptJOB_CV = `
    JOB_ROLE (delimiters <>): <${bestJobRoleMemories}>

    USER_CV (delimiters <>) <${cvSummary}>

    - Your goal is to collect information from the candidate for the JOB_ROLE.
    - Analyse JOB_ROLE and USER_CV and understand if a Candidate has the right CV info or he is missing something, 
    - be creative on the ways that the candidate background can be applied on the role

    - Your task is to create notes on the candidate’s skills, experience, and education to determine if they are a good fit for the JOB_ROLE.


    3-6 small Bullet points:
  `
  printC(promptJOB_CV,"3","promptJOB_CV","b")

  infoCandidateForJob = await useGPTchatSimple(promptJOB_CV,0)


  // infoCandidateForJob = `
  // 1. Can you tell us about a time when you had to understand user needs and solve their problems? How did you approach the situation and what was the outcome?
  // 2. How familiar are you with GraphQL, Next.js, React, and TailwindCSS? Can you give us an example of a project you worked on using these technologies?
  // 3. Have you ever worked independently to innovate and create code? Can you tell us about a project where you had to come up with a unique solution?
  // 4. How do you stay up-to-date with the latest developments in front-end development? Do you have any favorite resources or communities you follow?
  // 5. Can you tell us about a time when you had to work collaboratively with a team to achieve a common goal? How did you contribute to the team's success?
  // 6. How do you approach problem-solving and troubleshooting in your work? Can you give us an example of a particularly challenging issue you faced and how you resolved it?
  // `

  // infoCandidateForJob = `        
  // - Lolita Mileta's experience as a Lead Scrum Master and Product Owner makes her a strong candidate for the role, as she has experience managing teams and improving feature releases.
  // - Her skills in Scrum and Agile frameworks, leadership, communication, and planning are all relevant to the responsibilities of the role.
  // - While her language proficiency may not be directly related to the role, it could be a valuable asset in a collaborative and diverse company culture.
  // - It is unclear from her CV if she has specific knowledge of GraphQL, Next.js, React, and TailwindCSS, which are required skills for the role.
  // - However, her experience with continuous improvement suggests that she may be able to quickly learn and adapt to new technologies and tools.
  // - Overall, Lolita Mileta's experience and skills make her a strong candidate for the role, but further assessment of her technical knowledge may be necessary.
  // `

  printC(infoCandidateForJob,"3","infoCandidateForJob","p")
  // sdf0



  // positionData.candidates.compareCandidatePosition.CVToPosition.content = infoCandidateForJob


  // positionData = await positionData.save();

  // ------------ Save the CV to the positionData -------------
  let candidateIdx_ = positionData?.candidates?.findIndex((candidate) => candidate.userID.toString() == userID.toString());
  if (candidateIdx_!=-1 && candidateIdx_!=undefined) {
    positionData.candidates[candidateIdx_].compareCandidatePosition.CVToPosition.content = infoCandidateForJob
    await positionData.save();
  }
  else {
    positionData?.candidates?.push({
      userID: userID,
      compareCandidatePosition: {
        CVToPosition: {
          content: infoCandidateForJob,
        }
      },
    })
    await positionData.save();
  }
  // ------------ Save the CV to the positionData -------------



  // sdf

  // sdf
  // -------- Create Prompt ---------

  
  questionsPrompt = ""
  for (let i=0;i<questionData.length;i++){
    const questionNow = questionData[i];


    questionsPrompt += ` ${i+1}. ${questionNow.content} \n`
  }

  printC(questionsPrompt,"3","questionsPrompt","b")

  // infoCandidateForJob = `
  // - Responsibilities of the Candidate: The candidate must understand user needs and be able to solve their problems.
  // - Analysis: While Miltiadis has experience in developing solutions for various projects, there is no specific mention of understanding user needs and solving their problems. However, his expertise in computer vision and deep learning can be applied to create innovative solutions for user problems.
  // - Skills of the Candidate: Must have knowledge of front-end development, including GraphQL, Next.js, React, and TailwindCSS.
  // - Analysis: Miltiadis' CV does not mention any experience or knowledge in front-end development technologies like GraphQL, Next.js, React, and TailwindCSS. Therefore, he may not be the ideal candidate for this specific skill set.
  // - Responsibilities of the Candidate: The candidate will work independently to innovate and create code.
  // - Analysis: Miltiadis has over 11 years of experience in computer vision, machine learning, and robotics, and has worked on various projects independently. Therefore, he has the necessary experience to work independently and innovate to create code.
  // - General info of Position: Soil is creating a marketplace for positions and talent using AI and blockchain.
  // - Analysis: There is no specific mention of Miltiadis' experience in AI and blockchain technologies. However, his expertise in computer vision and deep learning can be applied to create innovative solutions for Soil's marketplace.
  // - Values of Position: Soil values innovation and user discovery.
  // - Analysis: Miltiadis has a passion for optimized software development and research, and has worked on various projects related to sequence models, robotics, and autonomous OCR dictating systems for blind people. Therefore, he has the necessary experience to contribute to Soil's value of innovation and user discovery.
  // - Values of Position: The position culture is fun and collaborative.
  // - Analysis: There is no specific mention of Miltiadis' experience in a`


  let promptNewQuestions = `
    NOTES for this Job Role and User CV (delimiters <>): <${infoCandidateForJob}>

    QUESTIONS (delimiters <>) <${questionsPrompt}>

   
    - You can improve each of the QUESTINOS using any of the NOTES
    - you can only ask 1 question at a time
    - You should stay really close to the meaning of the QUESTIONS!
    - You should use as many facts from the NOTES related to the CV of the candidate to make it relevant
    - If from NOTES candidate don't have some skills, ask them directly if they do i the Improved QUESTIONS
    
    
    Improved QUESTIONS: 
  `

  improvedQuestions = await useGPTchatSimple(promptNewQuestions,0,"API 2")

  printC(improvedQuestions,"4","improvedQuestions","r")
  // SDF0

//         improvedQuestions = `1. Can you tell us about your experience working with Machine Learning and Computer Vision, and how it could be useful for understanding user needs and solving their problems in this role?
// 2. What specific experience do you have leading teams and innovating with cutting-edge technologies, and how do you think it could be valuable for working independently to create code in this role?
// 3. Do you have experience with GraphQL, Next.js, React, and TailwindCSS, which are required for this role?
// 4. What other technical skills do you have that could be helpful in this position?
// 5. How comfortable are you with UI implementation, and what experience do you have in this area?
// 6. Would you be willing to join Soil 🌱 as a contributor, given that the position is not yet financially secure?
// 7. Do you share Eden's vision of using AI and blockchain to create context and trust and connect the right person to the right opportunity?
// 8. What specifically interests you about joining Soil 🌱, and how do you think you could contribute to the position's mission?
// 9. What are your long-term career goals, and how do you see this role fitting into them?`



  const improvedQuestionsArray = improvedQuestions.split('\n').map((item) => item.replace(/^\d+\.\s*/, ''));

  printC(improvedQuestionsArray,"3","improvedQuestionsArray","r")

  let interviewQuestionsForCandidate = []

  for (let i=0;i<improvedQuestionsArray.length;i++){
    const improvedQuestion = improvedQuestionsArray[i];

    
    printC(questionData[i],"5","questionData[i]","y")


    interviewQuestionsForCandidate.push({
      originalQuestionID: questionData[i]._id,
      originalContent: questionData[i].content,
      personalizedContent: improvedQuestion,
    })
  }

  printC(interviewQuestionsForCandidate,"3","interviewQuestionsForCandidate","r")

  // find the idx what candidate you will update from the positionData

  printC(userID,"5","userID","y")
  printC(positionID,"5","positionID","y")

  positionData2 = await Position.findOne({ _id: positionID}).select('_id name candidates');
  printC(positionData2?.candidates?.length,"5","positionData2.candidates.length","y")

  // sf0
  let candidateIdx = positionData2?.candidates?.findIndex((candidate) => candidate.userID.toString() == userID.toString());

  printC(candidateIdx,"3","candidateIdx","r")

  if (candidateIdx!=-1 && candidateIdx!=undefined) {
    positionData2.candidates[candidateIdx].interviewQuestionsForCandidate = interviewQuestionsForCandidate

  } else {
    positionData2?.candidates?.push({
      userID: userID,
      interviewQuestionsForCandidate: interviewQuestionsForCandidate,
    })

  }

  if (positionData2){
    positionData2 = await positionData2.save();
  }


  return positionData2
 
}

const MessageMapKG_V2APICallF = async (textToMap) => {
    const query = gql`
      query messageMapKG_V2($fields: messageMapKG_V2Input) {
        messageMapKG_V2(fields: $fields) {
          keywords {
            keyword
            confidence
            nodeID
            node {
              _id
              name
            }
          }
        }
      }
    `;

    const variables = {
      fields: {
        message: textToMap,
      },
    };

    res = await request(
      "https://soil-api-backend-kgfromai2.up.railway.app/graphql",
      query,
      variables
    );

    // console.log("res = " , res)
    // console.log("res.messageMapKG_V2", res.messageMapKG_V2);
    return res.messageMapKG_V2.keywords;
  };


  const CandidateNotesEdenAIAPICallF = async (memberID,positionID) => {
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

    printC(variables, "1", "variables", "r")

    res = await request(
      // "https://soil-api-backend-kgfromai2.up.railway.app/graphql",
      "https://soil-api-backend-kgfromaicron.up.railway.app/graphql",
      query,
      variables
    );

    
    return res.candidateNotesEdenAI;
  };


  const MessageMapKG_V4APICallF = async (textToMap) => {
    const query = gql`
      query messageMapKG_V4($fields: messageMapKG_V4Input) {
        messageMapKG_V4(fields: $fields) {
          keywords {
            keyword
            confidence
            nodeID
            node {
              _id
              name
            }
          }
        }
      }
    `;

    const variables = {
      fields: {
        message: textToMap,
      },
    };

    res = await request(
      "https://soil-api-backend-kgfromai2.up.railway.app/graphql",
      query,
      variables
    );

    // console.log("res = " , res)
    // console.log("res.messageMapKG_V4", res.messageMapKG_V4);
    return res.messageMapKG_V4.keywords;
  };

  const InterviewQuestionCreationUserAPICallF = async (positionID,userID,cvContent) => {
    const mutation = gql`
      mutation interviewQuestionCreationUser($fields: interviewQuestionCreationUserInput) {
        interviewQuestionCreationUser(fields: $fields) {
          _id
          name
          candidates {
            user {
              _id
              discordName
            }
            interviewQuestionsForCandidate {
              originalQuestionID
              originalContent
              personalizedContent
            }
          }
        }
      }
    `;

    const variables = {
      fields: {
        positionID: positionID,
        userID: userID,
        cvContent: cvContent,
      },
    };

    res = await request(
      // "https://soil-api-backend-kgfromai2.up.railway.app/graphql",
      "https://soil-api-backend-kgfromaicron.up.railway.app/graphql",
      mutation,
      variables
    );

    // console.log("res = " , res)
    // console.log("res.interviewQuestionCreationUser", res.interviewQuestionCreationUser);
    return res.interviewQuestionCreationUser;
  };


async function modifyQuestionFromCVMemory(messageQ,lastMessage,userID,topK = 3,positionID=undefined) {


    // -------------- Connect Memory Position Training to question ------------
    let finalMemoriesPositionTrainingPrompt = ""
    let memoriesPositionTrainingPrompt = ""
    if (positionID != undefined){
      filter = {
        label: "Company_TrainEdenAI_memory",
        _id: positionID,
      }

      memoriesPositionTrainingPrompt = await getMemory(messageQ + "\n\n" + lastMessage,filter,topK)

      finalMemoriesPositionTrainingPrompt = `
      Job Role is given (delimited by <>) 

      Job Role: < ${memoriesPositionTrainingPrompt}`


      printC(finalMemoriesPositionTrainingPrompt, "2", "finalMemoriesPositionTrainingPrompt", "g")
    }
    // -------------- Connect Memory Position Training to question ------------


    // -------------- Connect Memory CV to question ------------
    if (topK > 0 && userID){
      filter = {
        label: "CV_user_memory",
        _id: userID,
      }
  
      let memoriesCVPrompt
      if (memoriesPositionTrainingPrompt != "")
        memoriesCVPrompt = await getMemory(messageQ + "\n\n" + lastMessage + "\n\n" + memoriesPositionTrainingPrompt,filter,topK)
      else 
        memoriesCVPrompt = await getMemory(messageQ + "\n\n" + lastMessage,filter,topK)
  
      
  
      printC(memoriesCVPrompt, "2", "memoriesCVPrompt", "g")
  
      finalMemoriesCVPrompt = `
      Memory is given within (delimited by <>)
      - The memory might be completely irrelevant! Don't use it if it doesn't add value
  
      Memory: < ${memoriesCVPrompt} > `
  
      
    } 
    // -------------- Connect Memory CV to question ------------


    // let modifiedQuestion = ""
    // if (memoriesPrompt != ""){

      const promptPlusMemoryV = `QuestionAsking: ${messageQ}


      ${finalMemoriesPositionTrainingPrompt}

      ${finalMemoriesCVPrompt}

      - your goal is to collect the information from the candidate for this specific question and Job Role
      - First make a small responded/acknowledgment of the answer with 1-8 words, if it applies
      - You can only ask 1 question at a time, 
      - you should use a maximum 1-2 sentence
      
      Interviewer Reply: 
       `;

       printC(promptPlusMemoryV, "1", "promptPlusMemoryV", "p")

      modifiedQuestion = await useGPTchatSimple(promptPlusMemoryV);

    // } else {
    //   modifiedQuestion = messageQ
    // }

    printC(modifiedQuestion, "5", "modifiedQuestion", "g")



    return modifiedQuestion
}

async function askQuestionAgain(prompt_conversation,nextQuestion,lastMessage,userID,topK,positionID=undefined) {

  let finalMemoriesPositionTrainingPrompt = ""
  let memoriesPositionTrainingPrompt = ""
  if (positionID != undefined){
    filter = {
      label: "Company_TrainEdenAI_memory",
      _id: positionID,
    }

    memoriesPositionTrainingPrompt = await getMemory(nextQuestion + "\n\n" + lastMessage,filter,topK)

    finalMemoriesPositionTrainingPrompt = `
    Job Role is given (delimited by <>) 

    Job Role: < ${memoriesPositionTrainingPrompt}`


    printC(finalMemoriesPositionTrainingPrompt, "2", "finalMemoriesPositionTrainingPrompt", "g")
  }

  let finalMemoriesCVPrompt = ""

  if (topK > 0 && userID){
    filter = {
      label: "CV_user_memory",
      _id: userID,
    }

    let memoriesCVPrompt
    if (memoriesPositionTrainingPrompt != "")
      memoriesCVPrompt = await getMemory(nextQuestion + "\n\n" + lastMessage + "\n\n" + memoriesPositionTrainingPrompt,filter,topK)
    else 
      memoriesCVPrompt = await getMemory(nextQuestion + "\n\n" + lastMessage,filter,topK)

    

    printC(memoriesCVPrompt, "2", "memoriesCVPrompt", "g")

    finalMemoriesCVPrompt = `
    Memory is given within (delimited by <>)
    - The memory might be completely irrelevant! Don't use it if it doesn't add value

    Memory: < ${memoriesCVPrompt} > `

    
  } 

  askGPT = `You are an Interviewer, you need to reply to the candidate with goal to deeply understand the candidate

      ${finalMemoriesPositionTrainingPrompt}

      ${finalMemoriesCVPrompt}

      - You have the Conversation between the Interviewer and the Candidate (delimited by <>)            

      < ${prompt_conversation} >

      - The original question that you need to collect information is (delimited by <>) 

      < ${nextQuestion} >

      - your goal is to collect the information from the candidate for this specific question and Job Role
      - First make a small responded/acknowledgment of the answer with 1-8 words, if it applies
      - You can only ask 1 question at a time, 
      - you should use a maximum 1-2 sentence
      
      Interviewer Reply: 
      `
  return (askGPT)

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
  
async function deletePineCone(deletePineIDs){

    const pinecone = new PineconeClient();
    await pinecone.init({
      environment: "us-east1-gcp",
      apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
    });
  
    const index = await pinecone.Index("profile-eden-information");

    
    try{   
        res = await index.delete1({ ids: deletePineIDs });
        // console.log("res = " , res)
    }catch (err){
        console.log("err = ", err);
    }
}

const updateConversation = async (fields) => {

    console.log("fields = " , fields)
    // asdf1

    const query = gql`
    mutation UpdateConversation($fields: updateConversationInput) {
        updateConversation(fields: $fields) {
            _id
            userID
            convKey
            conversation {
                role
                content
            }
            summaryReady
            summary {
                pineConeID
                content
            }
            updatedAt
        }
    }`;

    const variables  = {
        fields: {
            userID: fields.userID,
            conversation: fields.conversation,
        }
    };

    res = await request('https://soil-api-backend-kgfromai2.up.railway.app/graphql', query, variables)


    console.log("res.updateConversation = " , res.updateConversation)

    return res.updateConversation

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
    }

    if (data._id){
        metadata = {
            ...metadata,
            _id: data._id,
        }
    }

    if (data.convKey) {
        metadata = {
            ...metadata,
            convKey: data.convKey,
        }
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

    console.log("id_message = " , id_message)
  
    let upsertResponse = await index.upsert({ upsertRequest });

    upsertResponse = {
        ...upsertResponse,
        pineConeID: id_message,
    }
  
    return upsertResponse;
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

function chooseAPIkey(chooseAPI="") {
    // openAI_keys = [
    //   "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",
    //   // "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",
    //   "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",
    //   "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",
    // ];
  
    let openAI_keys = ["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"];
   
    if (chooseAPI == "API 2"){
      openAI_keys = ["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"];
    } else if (chooseAPI == "API 1"){
      openAI_keys = ["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"];
    }
  
    // randomly choose one of the keys
    let randomIndex = Math.floor(Math.random() * openAI_keys.length);
    let key = openAI_keys[randomIndex];
  
    return key;
  }

  async function useGPTchat(
    userNewMessage,
    discussionOld,
    systemPrompt,
    userQuestion = "",
    temperature = 0.7,
    chooseAPI = "API 1"
  ) {
  
    let discussion = [...discussionOld]
  
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
  
  async function useGPTchatSimple(prompt,temperature=0.7,chooseAPI = "API 1") {
    
    discussion = [{
      "role": "user",
      "content": prompt
    }]
  
  
    
    let OPENAI_API_KEY = chooseAPIkey(chooseAPI);
    response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        messages: discussion,
        model: "gpt-3.5-turbo",
        temperature: temperature
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

const nodes_aiModule = async (nodesID,weightModulesObj,memberObj,filter,membersIDallowObj={}) => {

    

    
    let nodeData = await Node.find({ _id: nodesID }).select(
        "_id node match_v2"
    );

    if (!nodeData) throw new ApolloError("Node Don't exist");


    memberObj = await nodesFindMembers(nodeData,memberObj,membersIDallowObj)

    


    // console.log("memberObj = " , memberObj)
    // for (const [memberID, member] of Object.entries(memberObj)) {
    //     console.log("member.nodes = " , memberID,member.nodes)
    // }
    // sdf00

    // memberObj = await findMemberAndFilter(memberObj)

    console.log("memberObj = " , memberObj)
    // sdf0

    // console.log("memberObj = " , memberObj)
    // sdf2

    

    memberObj = await distanceFromFilter(memberObj,filter)

    console.log("memberObj = " , memberObj)


    memberObj = await membersScoreMap(memberObj,weightModulesObj)

    // console.log("change = " , change)
    await showObject(memberObj,"memberObj")

    // asdf5


    return memberObj
}

const totalScore_aiModule = async (memberObj,weightModulesObj,numberNodes) => {



    max_S = -1
    min_S = 100000000

    newMin_total = 20
    newMax_total = parseInt(nodeToMaxScore(numberNodes))

    if (newMax_total>100){
        newMax_total = 100
    }

    

    
    for (const [memberID, member] of Object.entries(memberObj)) {
        let scoreOriginalTotal = 0;
        let scoreOriginalBeforeMap = 0;

        console.log("member = " , member)

        if (member.nodesTotal) {
            if (weightModulesObj["node_total"]) {
                scoreOriginalTotal += member.nodesTotal.score * (weightModulesObj["node_total"].weight*0.01);
                scoreOriginalBeforeMap += member.nodesTotal.scoreOriginal * (weightModulesObj["node_total"].weight*0.01);

            } 
            // else {
            //     scoreOriginalTotal += member.nodesTotal.score;
            //     scoreOriginalBeforeMap += member.nodesTotal.scoreOriginal;
            // }
        }

        if (member.distanceHoursPerWeekMap) {
            if (weightModulesObj["availability_total"]) {
                scoreOriginalTotal += member.distanceHoursPerWeekMap * (weightModulesObj["availability_total"].weight*0.01);
            } 
            // else {
            //     scoreOriginalTotal += member.distanceHoursPerWeekMap;
            // }
        }

        if (member.distanceBudgetPerHourMap) {
            if (weightModulesObj["budget_total"]) {
                scoreOriginalTotal += member.distanceBudgetPerHourMap * (weightModulesObj["budget_total"].weight*0.01);
            } 
            // else {
            //     scoreOriginalTotal += member.distanceBudgetPerHourMap;
            // }
        }

        if (member.distanceExperienceLevelMap) {
            if (weightModulesObj["experience_total"]) {
                scoreOriginalTotal += member.distanceExperienceLevelMap * (weightModulesObj["experience_total"].weight*0.01);
            } 
            // else {
            //     scoreOriginalTotal += member.experience_total;
            // }
        }

        if (max_S < scoreOriginalTotal) max_S = scoreOriginalTotal;
        if (min_S > scoreOriginalTotal) min_S = scoreOriginalTotal;
        
        if (!memberObj[memberID].total) {
            memberObj[memberID].total = {
                scoreOriginal: scoreOriginalTotal,
                scoreOriginalBeforeMap: scoreOriginalBeforeMap,
            }
        }
    }
    // sdf12

    // console.log("max_S,min_S = " , max_S,min_S)

    for (const [memberID, member] of Object.entries(memberObj)) {
        let scoreOriginalTotal = member.total.scoreOriginal;
        let scoreOriginalBeforeMap = member.total.scoreOriginalBeforeMap;

        let scoreMap = mapValue(scoreOriginalTotal, min_S, max_S, newMin_total, newMax_total);

        memberObj[memberID].total.score = parseInt(scoreMap);
        memberObj[memberID].total.realTotalPercentage = scoreOriginalTotal;
        memberObj[memberID].total.scoreOriginalBeforeMap = scoreOriginalBeforeMap;

    }

    return memberObj
}

const sortArray_aiModule = async (memberObj) => {

    memberArray = []

    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = member.total.score;

        // console.log("member = " , member)

        // -------------- Add Nodes --------------
        nodesPercentage = []
        for (const [nodeID, node] of Object.entries(member.nodes)) {
            // console.log("node = " , node)
            nodesPercentage.push({
                nodeID: nodeID,
                totalPercentage: parseInt(node.score*100),
                conn_nodeIDs: node.conn_nodeIDs,
            })

            // console.log("node.conn_nodeObj = " , member._id,node.conn_nodeObj)

            let mostRelevantMemberNodes = []

            for (const [conn_nodeID, conn_nodeObj] of Object.entries(node.conn_nodeObj)) {
                // console.log("conn_nodeObj = " , conn_nodeObj)
                mostRelevantMemberNodes.push({
                    nodeID: conn_nodeID,
                    totalPercentage: conn_nodeObj.scoreOriginal*100,
                })
            }

            mostRelevantMemberNodes.sort((a, b) => (a.totalPercentage > b.totalPercentage) ? -1 : 1)

            nodesPercentage[nodesPercentage.length-1].mostRelevantMemberNodes = mostRelevantMemberNodes

        }

        nodesPercentage.sort((a, b) => (a.totalPercentage > b.totalPercentage) ? -1 : 1)
        // -------------- Add Nodes --------------

        memberArray.push({
            memberID: memberID,
            matchPercentage: {
                totalPercentage: score,
                realTotalPercentage: member.total.scoreOriginalBeforeMap,
            },
            nodesPercentage: nodesPercentage,
        })
    }

    // console.log("memberArray = " , memberArray)
    for (let i = 0; i < memberArray.length; i++) {
        let member = memberArray[i];
        // console.log("member._id = " , member._id)
        let nodesPercentage = member.nodesPercentage;
        // console.log("nodesPercentage = " , nodesPercentage)
        for (let j = 0; j < nodesPercentage.length; j++) {
            let node = nodesPercentage[j];
            let mostRelevantMemberNodes = node.mostRelevantMemberNodes;
            // console.log("mostRelevantMemberNodes = " , mostRelevantMemberNodes)
        }
    }

    // sdf

    // console.log("memberArray = " , memberArray)

    memberArray.sort((a, b) => (a.matchPercentage.totalPercentage > b.matchPercentage.totalPercentage) ? -1 : 1)

    return memberArray
}

const membersScoreMap = async (memberObj,weightModulesObj) => {

    let max_S = -1
    let min_S = 100000000

    let newMin_members = 0.2
    let newMax_members = 1
   
    // ----------- Find original Scores every Member -----------
    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = 0;
        let nodes = member.nodes;
        for (const [nodeID, node] of Object.entries(nodes)) {
            // score += node.score;

            if (weightModulesObj[`node_${node.type}`]) {
                // score += node.score * (weightModulesObj[`node_${node.type}`].weight*0.01);
                score += node.scoreOriginal * (weightModulesObj[`node_${node.type}`].weight*0.01);
                console.log("change = 1" , `node_${node.type}`,weightModulesObj[`node_${node.type}`].weight,node.scoreOriginal, node.scoreOriginal * (weightModulesObj[`node_${node.type}`].weight*0.01),score,memberID)
            } else {
                if (weightModulesObj["node_else"]) {
                    // console.log("change = 2" , `node_else`)

                    // score += node.score * (weightModulesObj["node_else"].weight*0.01);
                    score += node.scoreOriginal * (weightModulesObj["node_else"].weight*0.01);
                } else {
                    // console.log("change = 3" , `node nothing`)
                    // score += node.score;
                    score += node.scoreOriginal;
                }
            }
            

            // if (node.type == "sub_expertise") {
                // if (weightModulesObj["node_subExpertise"]) {
                //     score += node.score * (weightModulesObj["node_subExpertise"].weight*0.01);
                // } else {
                //     score += node.score;
                // }
            // } else if (node.type == "sub_typeProject") {
            //     if (weightModulesObj["node_subTypeProject"]) {
            //         score += node.score * (weightModulesObj["node_subTypeProject"].weight*0.01);
            //     } else {
            //         score += node.score;
            //     }
            // } else {
                // if (weightModulesObj["node_else"]) {
                //     score += node.score * (weightModulesObj["node_else"].weight*0.01);
                // } else {
                //     score += node.score;
                // }
            // }
        }
        
        if (score > max_S) max_S = score;
        if (score < min_S) min_S = score;

        if (!memberObj[memberID].nodesTotal) {
            memberObj[memberID].nodesTotal = {
                scoreOriginal: score
            }
        }
    }
    // ----------- Find original Scores every Member -----------

    // console.log("max_S,min_S = " , max_S,min_S)
    // asdf12


    // ----------- Map Scores every Member -----------
    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = member.nodesTotal.scoreOriginal;
        let scoreMap = mapValue(score, min_S, max_S, newMin_members, newMax_members);

        // console.log("scoreMap = " , scoreMap, min_S, max_S, newMin_members, newMax_members)

        memberObj[memberID].nodesTotal.score = scoreMap;
    }
    // ----------- Map Scores every Member -----------

    return memberObj
    
}

const passFilterTestMember = async (memberData) => {


    if (!memberData?.hoursPerWeek) return false;

    if (!memberData?.budget?.perHour) return false;



    // if (!memberData?.experienceLevel?.total) return false;

    return true

}

const findMemberAndFilter = async (memberObj) => {

    
    // from memberObj take only the keys and make a new array
    memberIDs = Object.keys(memberObj);

    // search on the mongo for all the members
    let membersData = await Members.find({ _id: memberIDs }).select('_id hoursPerWeek totalNodeTrust experienceLevel budget');

    // console.log("membersData = " , membersData)


    // add the members data to the memberObj
    for (let i = 0; i < membersData.length; i++) {
        let memberID = membersData[i]._id;

        if (memberObj[memberID]) {

            passFilter = await passFilterTestMember(membersData[i])

            if (passFilter== true){
                memberObj[memberID] = {
                    ...memberObj[memberID],
                    ...membersData[i]._doc
                }

            } else  delete memberObj[memberID]

        }
    }

    return memberObj
}

const distanceFromFilter = async (memberObj,filter) => {

    minDisBudgetPerHour = 100000000
    maxDisBudgetPerHour = -1

    minDisHoursPerWeek = 100000000
    maxDisHoursPerWeek = -1

    minDisExperienceLevel = 100000000
    maxDisExperienceLevel = -1

    for (const [memberID, member] of Object.entries(memberObj)) {
        let distance = 0;

        // ---------------------- hoursPerWeek
        if (filter?.availability?.minHourPerWeek && filter?.availability?.maxHourPerWeek){
            averageFilterHourPerWeek = (filter.availability.minHourPerWeek + filter.availability.maxHourPerWeek) / 2;
            distance = Math.abs(member.hoursPerWeek - averageFilterHourPerWeek);
            memberObj[memberID].distanceHoursPerWeek = distance;

            if (distance < minDisHoursPerWeek) minDisHoursPerWeek = distance;
            if (distance > maxDisHoursPerWeek) maxDisHoursPerWeek = distance;
        }


        // ---------------------- budget
        if (filter?.budget?.minPerHour && filter?.budget?.maxPerHour){
            averageFilterBudgetPerHour = (filter.budget.minPerHour + filter.budget.maxPerHour) / 2;
            distance = Math.abs(member.budget.perHour - averageFilterBudgetPerHour);
            memberObj[memberID].distanceBudgetPerHour = distance;

            // console.log("filter.budget.minPerHour, filter.budget.maxPerHour = " , filter.budget.minPerHour, filter.budget.maxPerHour,averageFilterBudgetPerHour)
            // console.log("distance = " , distance, member.budget.perHour, averageFilterBudgetPerHour, memberID)
            // console.log("change = ------" )

            if (distance < minDisBudgetPerHour) minDisBudgetPerHour = distance;
            if (distance > maxDisBudgetPerHour) maxDisBudgetPerHour = distance;
        }

        // ---------------------- experienceLevel
        if (filter?.experienceLevel){
            distance = Math.abs(member.experienceLevel.total - filter.experienceLevel);
            memberObj[memberID].distanceExperienceLevel = distance;

            if (distance < minDisExperienceLevel) minDisExperienceLevel = distance;
            if (distance > maxDisExperienceLevel) maxDisExperienceLevel = distance;
        }
    }


    // Map the distance to 0-1
    for (const [memberID, member] of Object.entries(memberObj)) {

        memberObj[memberID].distanceHoursPerWeekMap = 0
        memberObj[memberID].distanceBudgetPerHourMap = 0
        memberObj[memberID].distanceExperienceLevelMap = 0

        if (member.distanceHoursPerWeek != undefined){
            let distanceHoursPerWeek = mapValue(maxDisHoursPerWeek - member.distanceHoursPerWeek, minDisHoursPerWeek, maxDisHoursPerWeek, 0, 1);
            memberObj[memberID].distanceHoursPerWeekMap = distanceHoursPerWeek;
        }

        if (member.distanceBudgetPerHour != undefined){
            let distanceBudgetPerHour = mapValue(maxDisBudgetPerHour - member.distanceBudgetPerHour, minDisBudgetPerHour, maxDisBudgetPerHour, 0, 1);
            memberObj[memberID].distanceBudgetPerHourMap = distanceBudgetPerHour;
        }


        if (member.distanceExperienceLevel != undefined){
            let distanceExperienceLevel = mapValue(maxDisExperienceLevel - member.distanceExperienceLevel, minDisExperienceLevel, maxDisExperienceLevel, 0.3, 1);
            memberObj[memberID].distanceExperienceLevelMap = distanceExperienceLevel;
        }


    }

    // console.log("memberObj = " , memberObj)
    // asdf


    // sdf99
    
    return memberObj
}

const nodesFindMembers = async (nodeData,memberObj,membersIDallowObj={}) => {

    memberIDs = [];

    // console.log(" = --->> tora -1" )

    for (let i = 0; i < nodeData.length; i++) {
        // loop on the nodes
        let match_v2 = nodeData[i].match_v2;
        let node = nodeData[i];

        console.log(" = --->> tora tt0", node._id, match_v2.length)
        // console.log(" = --->> tora tt0", match_v2)
        const tstID = match_v2.map((item) => item.nodeResID);

        console.log("tstID = " , tstID)

        memberObj = await nodeScoreMembersMap(match_v2,node,memberObj,membersIDallowObj)

    }
    // sd9

    console.log(" = --->> tora 3",memberObj )
    // sdf
    


    return memberObj
}

const nodeScoreMembersMap = async (match_v2,node,memberObj,membersIDallowObj={}) => {

    let nodeID = node._id;

    max_S = -1
    min_S = 100000000

    // console.log("membersIDallowObj = " , membersIDallowObj)
    // sdf0

    newMin_nodeMember = 0.2
    newMax_nodeMember = 1
    // ---------- Find nodes and Max Min -----------
    for (let j = 0; j < match_v2.length; j++) {

        if (! (match_v2[j].type == "Member")) continue;

        let memberID = match_v2[j].nodeResID;


        if (membersIDallowObj[memberID] == undefined && membersIDallowObj["all"] != true) continue;

        console.log("memberID = " , memberID)

        let scoreUser = match_v2[j].wh_sum;

        // ------------- Find all connected nodes -------------
        let conn_node = match_v2[j].conn_node_wh;
        let conn_nodeIDs = conn_node.map((item) => item.nodeConnID);

        // ------------- Find all connected nodes -------------

        if (scoreUser > max_S) max_S = scoreUser;
        if (scoreUser < min_S) min_S = scoreUser;

        // console.log(" = --->> tora ttk",node._id )


        if (!memberObj[memberID]) {
            
            memberObj[memberID] = {
                nodes: {}
            }
            memberObj[memberID].nodes[nodeID] = {
                scoreOriginal: scoreUser,
                type: node.node,
                conn_nodeIDs: conn_nodeIDs,
                conn_nodeObj: {},
            }
        } else {
            if (!memberObj[memberID].nodes[nodeID]){
                memberObj[memberID].nodes[nodeID] = {
                    scoreOriginal: scoreUser,
                    type: node.node,
                    conn_nodeIDs: conn_nodeIDs,
                    conn_nodeObj: {},
                };
            } else {
                memberObj[memberID].nodes[nodeID].scoreOriginal = scoreUser;
                memberObj[memberID].nodes[nodeID].type = node.node;
                memberObj[memberID].nodes[nodeID].conn_nodeIDs = conn_nodeIDs;
            }
        }

        // console.log(" = --->> tora ttk 2",node._id )


        // ----------- Add nodes to conn_nodeObj ----------
        let conn_nodeObj = memberObj[memberID].nodes[nodeID].conn_nodeObj;
        for (let k = 0; k < conn_nodeIDs.length; k++) {
            let conn_nodeID = conn_nodeIDs[k];
            if (!conn_nodeObj[conn_nodeID]){
                conn_nodeObj[conn_nodeID] = {
                    nodeID: conn_nodeID,
                    scoreOriginal: conn_node[k].wh_sum,
                }
            } else {
                conn_nodeObj[conn_nodeID].scoreOriginal += conn_node[k].wh_sum;
            }
        }
        memberObj[memberID].nodes[nodeID].conn_nodeObj = conn_nodeObj;
        // ----------- Add nodes to conn_nodeObj ----------

        // console.log(" = --->> tora ttk 3",node._id )


        // console.log("memberObj[memberID].nodes[nodeID] = " , memberObj[memberID].nodes[nodeID])
    }
    // ---------- Find nodes and Max Min -----------
    // sdf99

    // console.log(" = --->> tora 1" )
    // ---------- Map Score [0,1]-----------
    for (let j = 0; j < match_v2.length; j++) {

        if (! (match_v2[j].type == "Member")) continue;

        let memberID = match_v2[j].nodeResID;




        if (membersIDallowObj[memberID] == undefined && membersIDallowObj["all"] != true) continue;

        console.log("Dokeratorinolari = " , memberID)



        let scoreUser = match_v2[j].wh_sum;

        let scoreUserMap = mapValue(scoreUser, min_S, max_S, newMin_nodeMember, newMax_nodeMember);

        // console.log("memberObj[memberID] = " , memberObj[memberID]) // TODO: delete
        // console.log("memberObj[memberID].nodes[nodeID] = " , memberObj[memberID].nodes[nodeID]) // TODO: delete

        if (Number.isNaN(scoreUserMap)) {
            memberObj[memberID].nodes[nodeID].score = 0.6
        } else {
            memberObj[memberID].nodes[nodeID].score = scoreUserMap;
        }

        // console.log("change = " , scoreUserMap)

        // console.log("scoreUserMap = -------------" , scoreUserMap,scoreUser, min_S, max_S, newMin_nodeMember, newMax_nodeMember)

        
    }
    // console.log(" = --->> tora 2",memberObj )

    // ---------- Map Score [0,1]-----------
    // sfaf6

    return memberObj

}

async function taskPlanning(conversation,executedTasks,previusTaskDoneID) {

    
    
    // -------- ExecutedTasks to Prompt + Find previus Task --------
    endConversation = true // End the conversation if all tasks are done

    availableTasks = []

    let executedTasksString = "Executed Task percentage:\n"
    for (let i = 0; i < executedTasks.length; i++) {
        let task = executedTasks[i]
        console.log("task = " , task)
        if ( task.percentageCompleted != 100){
            executedTasksString = executedTasksString + task.taskType + " - " + task.percentageCompleted + "% \n"
            endConversation = false

            if (task.taskTypeID == previusTaskDoneID){
                return "Next priority task: " + task.taskType
            }


            availableTasks.push(task)
        } else {
            executedTasksString = executedTasksString + task.taskType + " - DONE \n"
        }
    }
    console.log(" executedTasksString = " , executedTasksString)
    // -------- ExecutedTasks to Prompt + Find previus Task --------


    if (endConversation == true){
        return "Next priority task: End Conversation"
    }

    
    promptToGPT = executedTasksString + `\n Please provide me the next priority Task to execute based on the conversation and the available executed task percentage. only choose from the ones available`

    promptToGPT += `\n\n Provide the smallest sentence without explanation: \n`


    keywordsGPTresult = await useGPTchat(
      promptToGPT,
      conversation,
      ""
    );


    return keywordsGPTresult
}

async function updateExecutedTasks(bestKeywordsFromEmbed,executedTasks) {

    if (bestKeywordsFromEmbed.length == 0) return executedTasks

    console.log("bestKeywordsFromEmbed = " , bestKeywordsFromEmbed)

    updateTaskType = bestKeywordsFromEmbed[0].metadata.taskType

    // find index of the taskTypeID in the executedTasks array that is equal to updateTaskType
    let index = executedTasks.findIndex((task) => task.taskTypeID == updateTaskType);

    if (updateTaskType == "skill_task") {

      if (executedTasks[index].percentageCompleted < 50) {
        executedTasks[index].percentageCompleted += 25
      } else {
        executedTasks[index].percentageCompleted = 100
      }

    } else if (updateTaskType == "insudtry_task") {

      if (executedTasks[index].percentageCompleted < 50) {
        executedTasks[index].percentageCompleted += 35
      } else {
        executedTasks[index].percentageCompleted = 100
        
      }
    } else {
      executedTasks[index].percentageCompleted = 100
    }

    return executedTasks
}

async function userAnsweredOrGiveIdeas(conversation,potentialTask) {

    if (potentialTask.includes("End Conversation")) {
        return ""
    }

    prompt_T = `
        based on the user reply

        Decide if:
        1) User is asking for ideas or doesn't have an answer
        or
        2) had an answer to the question from the assistant

        Answer with only 1 word 
        1) GIVE IDEAS
        2) USER ANSWERED
    `

  
    resGPT = await useGPTchat(
    prompt_T,
    conversation.slice(-2),
    "You are a recruiter, talking to a manager and collecting information about a new candidate that wants to find",
    "",
    0.7,
    "API 2"
    );

    return resGPT
}


async function edenReplyBasedTaskInfo(conversation,bestKeywordsFromEmbed,answeredOrIdeas,potentialTask) {

    if (potentialTask.includes("End Conversation") || bestKeywordsFromEmbed.length == 0) {
        return "Thank you for the information, you can how look at your right and find the best talent for you"
    }
   
    systemPrompt = bestKeywordsFromEmbed[0].metadata.systemPrompt;

    let userQuestion = ""

    if (answeredOrIdeas.includes("GIVE IDEAS")) {
      userQuestion = bestKeywordsFromEmbed[0].metadata.userPromptGiveIdeas;
    } else if (answeredOrIdeas.includes("USER ANSWERED")) {
      userQuestion = bestKeywordsFromEmbed[0].metadata.userPromptAskQuestion;
    } else {
      userQuestion = bestKeywordsFromEmbed[0].metadata.userPromptAskQuestion;
    }

    // conversation.pop()
    // conversation.shift()

    edenReply = await useGPTchat(
      userQuestion,
      conversation,
      systemPrompt
    );

    return edenReply
}

async function evaluateAnswerEdenAIFunc(question,answer,bestAnswer ,findReason) {

    let  score, reason

    let promptT = "QUESTION: " + question

    promptT += "\n\n BEST DESIRED answer: " + bestAnswer

    promptT += "\n\n USER answer: " + answer

    promptT += `\n\n 
    How much you will rate the USER VS the BEST DESIRED answer,  1 to 10
    
    First, give only a number from 1 to 10, then give the reason:
    
    Example 
    Evaluate: 6
    Reason: the reason is this...`


    resGPT = await useGPTchat(
        promptT,
        [],
        "You are an interviewer, your job is to score the candidate answer VS the optimal answer that comes from the comapny",
    )

    console.log("resGPT = " , resGPT)

    // resGPT = " evaluate: 4 reason: While the user's answer indicates a preference for working from the office, their focus on having"

    let re = /evaluate:\s*(\d+)\s*reason:\s*(.*)/i;
    let matches = resGPT.match(re);
    score = matches[1];
    reason = matches[2];
    console.log(score); // output: 4
    console.log(reason); // output: The user's answer indicates

    

    return {
        score,
        reason
    }
}

async function findAvailTaskPineCone(keywordsGPTresult,topK=3) {

    if (keywordsGPTresult.includes("End Conversation")) {
        return []
    }

    const filter = {
        label: "instructions_edenAI",
      };

      bestKeywordsFromEmbed = await findBestEmbedings(
        keywordsGPTresult,
        filter,
        (topK = topK)
      );

    return bestKeywordsFromEmbed
}


function mapValue(value, oldMin, oldMax, newMin, newMax) {
    var oldRange = oldMax - oldMin;
    if (oldRange == 0){
        // return newMax*0.9;
        return 0.1;
    } else {
        var newRange = newMax - newMin;
        var newValue = ((value - oldMin) * newRange / oldRange) + newMin;
        return newValue;
    }
}
// function mapValue(value, oldMin, oldMax, newMin, newMax, reverse = false) {
//     var oldRange = oldMax - oldMin;
//     var newRange = newMax - newMin;
    
//     if (oldRange === 0) {
//       return reverse ? newMin : newMax * 0.9;
//     } else {
//     //   var mappedValue = ((value - oldMin) * newRange / oldRange) + newMin;
//     //   return reverse ? newMax - mappedValue + newMin : mappedValue;
//         if (reverse) {
//             return newMax - (((value - oldMin) * newRange / oldRange) + newMin) + newMin;
//         } else {
//             return ((value - oldMin) * newRange / oldRange) + newMin;
//         }
//     }
//   }

async function showArray(arr,name="arr") {
    console.log(" ------------------ " + name + " ------------------")
    for (let i = 0; i < arr.length; i++) {
        console.log(arr[i]);
    }
    console.log(" ------------------ " + name + " ------------------")

}

async function showObject(objectT,name="objectT") {
    console.log(" ------------------ " + name + " ------------------")
    for (const [key, value] of Object.entries(objectT)) {
        console.log("key = " , key)
        console.log("value = " , value)
    }
    console.log(" ------------------ " + name + " ------------------")
}

async function arrayToObject(arrayT) {
    let objectT = {};
    for (let i = 0; i < arrayT.length; i++) {
        objectT[arrayT[i].type] = arrayT[i];
    }
    return objectT;
}

function nodeToMaxScore(x) {
    const a = -0.056;
    const b = 3.972;
    const c = 66.084;
    const y = a * Math.pow(x, 2) + b * x + c;



    return y;
}


async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    wait,
    nodes_aiModule,
    totalScore_aiModule,
    showObject,
    sortArray_aiModule,
    upsertEmbedingPineCone,
    deletePineCone,
    chooseAPIkey,
    useGPTchat,
    useGPTchatSimple,
    arrayToObject,
    taskPlanning,
    findAvailTaskPineCone,
    userAnsweredOrGiveIdeas,
    updateExecutedTasks,
    edenReplyBasedTaskInfo,
    updateConversation,
    findBestEmbedings,
    evaluateAnswerEdenAIFunc,
    getMemory,
    modifyQuestionFromCVMemory,
    MessageMapKG_V2APICallF,
    MessageMapKG_V4APICallF,
    InterviewQuestionCreationUserAPICallF,
    createEmbeddingsGPT,
    askQuestionAgain,
    CandidateNotesEdenAIAPICallF,
    interviewQuestionCreationUserFunc,
  };