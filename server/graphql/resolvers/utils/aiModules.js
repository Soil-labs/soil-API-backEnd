

const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");
const { Conversation } = require("../../../models/conversationModel");

const { Configuration, OpenAIApi } = require("openai");

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

async function positionTextToExtraQuestionsFunc(questionData,positionText, positionID) {


  if (!positionID) {
    throw new ApolloError("positionID is required");
  }

  positionData = await Position.findOne({ _id: positionID }).select('_id interviewQuestionsForPosition');

  if (!positionData) {
    throw new ApolloError("Position not found");
  }


  questionsPrompt = ""
  for (let i=0;i<questionData.length;i++){
    const questionNow = questionData[i];


    questionsPrompt += ` ${i+1}. ${questionNow.content} \n`
  }

  printC(questionsPrompt,"3","questionsPrompt","b")



  let promptNewQuestions = `
    REQUIREMENTS of Job Position (delimiters <>): <${positionText}>

    QUESTIONS (delimiters <>) <${questionsPrompt}>

  
    - You can improve each of the QUESTION using any of the REQUIREMENTS
    - you can only ask 1 question at a time
    - You should stay really close to the meaning of the QUESTIONS!
    - make the question simple light and too the point 
    - only ask the question don't add were you found the info or anything else
    
    
    Improved QUESTIONS: 
  `

  printC(promptNewQuestions,"3","promptNewQuestions","b")
  // s0

  improvedQuestions = await useGPTchatSimple(promptNewQuestions,0,"API 2")

//   improvedQuestions = `
//   1. How does the technical expertise of the candidates you're looking for align with the company's focus on databases, SQL, and Cloud (preferably AWS) in achieving its overall business goals?
// 2. What are the specific responsibilities for the backend development roles you're hiring for, and how do they relate to maintaining and improving infrastructure in AWS using Pulumi TypeScript IaC?
// 3. What are the key technical skills and attributes you're looking for in a candidate, particularly in terms of experience with programming languages such as javascript or python, familiarity with continuous integration tools and services, and the ability to scale services through architectural changes and infrastructure improvements?
// 4. Is there a preferred timeline for filling these positions, and are there any deadlines or milestones we should be aware of, given the importance of excellent English communication skills, a strong work ethic, and a collaborative/cooperative attitude in the roles you're hiring for?
// `
  printC(improvedQuestions,"4","improvedQuestions","r")
  // sdf0

  const improvedQuestionsArray_ = improvedQuestions.split('\n').map((item) => item.replace(/^\d+\.\s*/, ''));


  const improvedQuestionsArray = improvedQuestionsArray_.filter(element => element != "");

  printC(improvedQuestionsArray,"5","improvedQuestionsArray","p")


  let interviewQuestionsForCandidate = []


  for (let i=0;i<improvedQuestionsArray.length;i++){
    const improvedQuestion = improvedQuestionsArray[i];

    
    printC(questionData[i],"5","questionData[i]","y")


    interviewQuestionsForCandidate.push({
      originalQuestionID: questionData[i]?.questionID,
      originalContent: questionData[i]?.content,
      personalizedContent: improvedQuestion.replace(/^\s*\d+\.\s*/, ''),
    })
  }


  return interviewQuestionsForCandidate
  
}

async function positionTextAndConvoToReportCriteriaFunc(positionID) {

  
  positionData = await Position.findOne({ _id: positionID }).select('_id positionsRequirements content');

  if (!positionData) {
    throw new ApolloError("Position not found");
  }

  positionsRequirements = positionData.positionsRequirements.originalContent;
  // printC(positionsRequirements,"0","positionsRequirements","b")

  positionsRequirements = positionsRequirements.replace(/b\d+:\s/g, "");
  printC(positionsRequirements,"0.5","positionsRequirements","b")
  // sdf9


  let convData_ = await Conversation.find({ 
    $and:[
      {positionID: positionID},
      {positionTrainEdenAI: true},
    ]
 }).select('_id positionID conversation');

  printC(convData_,"1","convData","p")


  let convData = convData_.pop();

  let promptConv = "";
  for (let i = 0; i < convData.conversation.length; i++) {
    let convDataNow = convData.conversation[i];
    if (convDataNow.role == "assistant")
      promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
    else
      promptConv = promptConv + "Employ" + ": " + convDataNow.content + " \n\n";
  }

  printC(promptConv,"2","promptConv","b")


  promptReport = ` You are a professional Recruiter, have as input the Details of a Job Position and the Conversation with the Company Representation
  Job Position (delimiters <>): <${positionsRequirements}>

  Conversation with the Company for Position (delimiters <>): <${promptConv}>


  Your Task is to create a report for the most important categories and subCategories the Candidate should have and will be evaluated!


  - Every Category can have from  1 to 4 bullet points
  - To include information in the output you must first find it in text of <Job Position> and <Conversation with the Company Representation> Do not make up fake information
  - Include 4-8 categories 
  - You need make really small bullet points maximum 15 words about what the Candidate should have to pass on every Category
  - Each bullet point will have a UNIQUE ID following this order b1, b2, b3, etc. 
  - Add parts of the Conversation to the report in a Category if it is relevant!

  For example: 
    <Category 1: title>
      - b1: small content max 15 words
      - b2: small content max 15 words
    <Category 2: title>
      - b3: small content max 15 words

  Answer:`;
   let report = await useGPTchatSimple(promptReport, 0);

   let idCounter = 1;

   report = report.replace(/(-\s+b\d+:)/g, (match) => {
     return match.replace(/\d+/, idCounter++);
   });



  // - Create the minimum number of categories by creating smart titles and smart unique bullet points 

  // let report = "Category 1: Skills>\n- Experience with databases and SQL\n- Cloud experience, preferably with AWS\n- Programming experience\n- TypeScript experience is a plus\n\n<Category 2: Qualifications>\n- Experience building and maintaining backend systems\n- Experience with infrastructure improvements and scaling\n- Experience troubleshooting production issues and conducting root cause analysis\n- Experience conducting systems tests for security, performance, and availability\n\n<Category 3: Education>\n- No specific education requirements mentioned\n\n<Category 4: Culture Fit>\n- Team player\n- Willingness to work on everything on the backend side\n- Strong communication skills\n- Ability to work in a fast-paced environment\n\n<Category 5: Personality Type>\n- Detail-oriented\n- Problem solver\n- Self-motivated\n- Adaptable\n\n<Category 6: Experience>\n- Experience maintaining and improving infrastructure in AWS\n- Experience maintaining TypeScript SDKs and writing internal and public documentation\n- No specific years of experience mentioned\n- Experience with observability, monitoring, and alerting for services"

  printC(report, "3", "report", "g");



  return report
}

async function findInterviewQuestion(positionData,candidate, questionAskingID,positionTrainEdenAI) {

  let newQuestion
  if (positionTrainEdenAI == true){
    newQuestion = positionData?.interviewQuestionsForPosition?.find((question) => question?.originalQuestionID?.toString() == questionAskingID.toString());

  } else{
    console.log("change = " )
    newQuestion = candidate?.interviewQuestionsForCandidate?.find((question) => question?.originalQuestionID?.toString() == questionAskingID.toString());
  }
  return newQuestion;

}

async function conversationCVPositionToReportFunc(memberID,positionID) {

  if (!positionID) {
    throw new ApolloError("positionID is required");
  }

  positionData = await Position.findOne({ _id: positionID });

  if (!positionData) {
    throw new ApolloError("Position not found");
  }

  
  if (!memberID) {  
    throw new ApolloError("memberID is required");
  }

  memberData = await Members.findOne({ _id: memberID });



  let index_ = positionData?.candidates?.findIndex(
    (x) => x.userID.toString() == memberID.toString()
  );

  if (index_ == undefined || index_ == -1) {
    throw new ApolloError("Candidate not found");
  }

  let candidateData = positionData.candidates[index_];

  const conversationID = candidateData.conversationID;


  const CVToPositionReport = candidateData?.compareCandidatePosition?.CVToPosition?.content

  printC(candidateData,"0","candidateData","b")

  printC(conversationID,"1","conversationID","b")

  printC(CVToPositionReport,"2","CVToPositionReport","p")

  const convoCandidateRecruiterPrompt = await findConversationPrompt(conversationID)

  printC(convoCandidateRecruiterPrompt,"3","convoCandidateRecruiterPrompt","p")
  
  
  promptReport = ` You are a Professional Recruiter writing reports to find the best candidate for a Job Position

  Report Candidate CV to Job Position (delimiters <>): <${CVToPositionReport}>

  Conversation of Candidate With Recruiter (delimiters <>): <${convoCandidateRecruiterPrompt}>


  Your Task is to create a Report that analyze if this is the right candidate for the Job Position using CV to Job Position and the Conversation

  - You need make really small bullet points of information about the Candidate for every Category
  - Do not make up fake information, only use what you have in the CV Report and Conversation
  - Include up to 6 categories and nothing else
  - For Each Category give a Match Score with only a number from 0 to 10 on the SCORE_AREA

  For example: 
    <Category 1: title - SCORE_AREA >
      - explanation really small
      - explanation really small
    <Category 2: title - SCORE_AREA >
      - explanation really small

  Categories:`;


  let report = await useGPTchatSimple(promptReport, 0);

  // report  = `
  // <Category 1: Relevant Skills - 9>
  //   - Experience with databases and SQL, which is a required skill for the JOB_ROLE.
  //   - Worked as a Full Stack Developer, indicating experience with both front-end and back-end systems.
  //   - Experience with messaging services, which could be useful for conducting systems tests for security and availability.
  //   - Worked on Web3 projects, indicating an ability to adapt to new technologies and a willingness to learn.

  // <Category 2: Education - 8>
  //   - B.Tech in CSE, showing a strong educational background in computer science.

  // <Category 3: Team Management - 7>
  //   - Managed a team of SDE2s and interns, showing strong communication skills and an ability to work in a team environment.

  // <Category 4: Machine Learning - 6>
  //   - Extensive experience in developing computer vision models for various applications, including object detection and image classification.
  //   - Background in managing teams and building MLOps procedures.

  // <Category 5: Python Proficiency - 8>
  //   - Proficient in Python and has used it extensively in developing backend solutions for various applications.

  // <Category 6: Innovation - 5>
  // `

  printC(report,"4","report","g")


  let scoreAll = 0
  let nAll = 0



  const regex = /<Category\s+\d+:\s*([^>]+)>([\s\S]*?)(?=<|$)/gs;
  const categoriesT = [];
  let result;
  while ((result = regex.exec(report)) !== null) {
    let reason_score = result[1].trim()

    printC(reason_score, "0", "reason_score", "y")
    // const match = reason_score.match(/(\d+)\s-\s(.*)/);
    const match = reason_score.match(/(.*) - (\d+)/)

    const title = match[1];
    const score = match[2];

    //  const score = 0
    // const title = reason_score;

    // console.log("score,title = " , score,title)
    // sdf2

    const category = {
      categoryName: title,
      score: parseInt(score)*10,
      reason: result[2].trim().split('\n').map(detail => detail.trim()),
    };
    scoreAll += parseInt(score)*10
    nAll +=1

    categoriesT.push(category);
  }

  scoreAll = parseInt(scoreAll/nAll)
  console.log("categoriesT = " , categoriesT)
  // df9


  // update Mongo
  positionData.candidates[index_].compareCandidatePosition.CV_ConvoToPosition = categoriesT
  positionData.candidates[index_].compareCandidatePosition.CV_ConvoToPositionAverageScore = scoreAll
  await positionData.save();


  return {
    success: true,
    report,
    categoriesT,
    scoreAll,
  }

}

async function reportPassFailCVPositionConversationFunc(memberID,positionID) {

  if (!positionID) {
    throw new ApolloError("positionID is required");
  }

  positionData = await Position.findOne({ _id: positionID });

  if (!positionData) {
    throw new ApolloError("Position not found");
  }

  
  if (!memberID) {  
    throw new ApolloError("memberID is required");
  }

  memberData = await Members.findOne({ _id: memberID });



  let index_ = positionData?.candidates?.findIndex(
    (x) => x.userID.toString() == memberID.toString()
  );

  if (index_ == undefined || index_ == -1) {
    throw new ApolloError("Candidate not found");
  }

  let positionsRequirements = positionData?.positionsRequirements?.content
  printC(positionsRequirements,"3","positionsRequirements","g")



  // sdf0
  
  // ---------------- Create Object for Position Report ----------------
  const regexT = /<(.+)>((?:\n\s*- \w+: .+)*)/g;
  const regexB = /- (\w+): (.+)/g;

  const categories = {};

  let matchT;
  while ((matchT = regexT.exec(positionsRequirements)) !== null) {
    const categoryTitle = matchT[1];
    const categoryRequirements = matchT[2];
    const requirements = {};

    let matchB;
    while ((matchB = regexB.exec(categoryRequirements)) !== null) {
      const id = matchB[1];
      const title = matchB[2];
      requirements[id] = title;

      categories[id] = {
        categoryName: categoryTitle,
        title: title,
      }
    }

    // categories[categoryTitle] = requirements;
  }


  printC(categories,"4","categories","g")
  // ---------------- Create Object for Position Report ----------------



  let candidateData = positionData.candidates[index_];

  const conversationID = candidateData.conversationID;


  let CVToPositionReport = candidateData?.compareCandidatePosition?.CVToPosition?.content





  printC(candidateData,"0","candidateData","b")

  printC(conversationID,"1","conversationID","b")

  printC(CVToPositionReport,"2","CVToPositionReport","p")


  // sd0

  const convoCandidateRecruiterPrompt = await findConversationPrompt(conversationID)

  printC(convoCandidateRecruiterPrompt,"3","convoCandidateRecruiterPrompt","p")

  
  
  
  promptReport = ` You are a Professional Recruiter Scoring a candidate to find the best fit for a Job Position

  Report Candidate CV to Job Position (delimiters <>): <${CVToPositionReport}>

  Conversation of Candidate With Recruiter (delimiters <>): <${convoCandidateRecruiterPrompt}>

  Requirements of Job Position (delimiters <>): <${positionsRequirements}>


 
  Your Task is to Score each of the Job Requirements based on the CV and the Conversation to find the right candidate for the Job Position 

  - You need to Score the Bullet points overall from 0 to 10 for each ID
   - For each bullet point ONLY give ID, really small reason max 10 words and score
   - Give exactly the same number of bullet points(IDs)
 

For example: 
Category 1:
      - ID: Score - A really small reason      
      - ID: Score - A really small reason

  Only Output the ID, Scores, really small reason:`;


  printC(promptReport,"4","promptReport","y")
  
  let report = await useGPTchatSimple(promptReport, 0);

  // printC(report,"4","report","g")

  // sdf12

//   report  = `
//   <Category 1: Education>
//   - b1: 10 - MS in Computer Science, Engineering, Math, Science or related field. PhD preferred.

// <Category 2: Experience>
//   - b2: 10 - Over 11 years of experience in Computer Vision, Machine Learning, and Robotics.
//   - b3: 10 - Proven track record of excellence in applying Machine Learning techniques for solving difficult real world problems.

// <Category 3: Skills>
//   - b4: 10 - Experience with cutting-edge technologies such as Pytorch, TensorFlow, and CUDA.
  
// <Category 4: Job Responsibilities>
//   - b5: 10 - Experience in leading teams and managing projects.
//   - b5: 10 - Experience in applying Deep Learning techniques to challenging real world problems.
  
// <Category 5: Diversity and Inclusion>
//   - b6: 10 - Equal Opportunity Employer and a good fit for the culture.
//   `

  printC(report,"4","report","g")


  report = report.replace(/N\/A/g, "0"); // if you dont know something make it as zero score

  const regexScores = /- (\w+): (\d+) - (.+)/g;
  const scores = {};


  while ((match = regexScores.exec(report))) {
    const id = match[1];
    const score = parseInt(match[2]);
    const reason = match[3];
    scores[id] = { score, reason };
  }

  printC(scores,"4","scores","g")
  printC(categories,"4","categories","b")

  // df9
  
  const merged = {};
  
  for (const id in categories) {
    merged[id] = { ...categories[id], ...scores[id] };
  }

  printC(merged,"4","merged","r")
  
  // find Average Score
  let scoreAll = 0
  let nAll = 0

  // transform to array
  const reportPoints = [];
  for (const id in merged) {
    reportPoints.push({
      IDb: id,
      categoryName: merged[id].categoryName,
      title: merged[id].title,
      score: merged[id].score,
      reason: merged[id].reason,
    });

    if (merged[id].score != undefined && merged[id].score != null && merged[id].score != "N/A"){
      scoreAll += merged[id].score
      nAll +=1
    }
  }

  scoreAll = parseInt(scoreAll/nAll)*10

  printC(reportPoints,"6","reportPoints","b")


  printC(index_,"6","index_","b")
  console.log("index_ = " , index_)
  // sdf3

  // update Mongo
  positionData.candidates[index_].compareCandidatePosition.reportPassFail = reportPoints
  positionData.candidates[index_].compareCandidatePosition.CV_ConvoToPositionAverageScore = scoreAll
  await positionData.save();


  return {
    success: true,
    report,
    // categoriesT,
    // scoreAll,
    reportPassFail: reportPoints,
  }

}

async function interviewQuestionCreationUserFunc(positionID,userID,cvContent) {

  try {

  positionData = await Position.findOne({ _id: positionID}).select('_id name candidates questionsToAsk positionsRequirements');
  if (!positionData) throw new ApolloError("Position not found", "interviewQuestionCreationUser", { component: "positionMutation > interviewQuestionCreationUser" });


  userData = await Members.findOne({ _id: userID}).select('_id discordName');
  if (!userData) throw new ApolloError("User not found", "interviewQuestionCreationUser", { component: "positionMutation > interviewQuestionCreationUser" });


  const questionsToAsk = positionData.questionsToAsk

  

  const questionsToAskID = questionsToAsk.map((question) => question.questionID)

  printC(questionsToAskID,"0","questionsToAskID","b")

  const questionData_ = await QuestionsEdenAI.find({ _id:  questionsToAskID  }).select('_id content');

  const questionDataMap = {};
  questionData_.forEach(question => {
    questionDataMap[question._id] = question;
  });

  let questionData = questionsToAskID.map(id => questionDataMap[id]);

  // console.log(questionData);


  printC(questionData,"0","questionData","b")
  // sdf9


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
  

  cvSummary = cvContent


  console.log("----------------------------" )

  printC(cvSummary,"2","cvSummary","b")

  // asfd9
  // -------- Create Prompt ---------
  
  // let promptJOB_CV = `
  //   JOB_ROLE (delimiters <>): <${bestJobRoleMemories}>

  //   USER_CV (delimiters <>) <${cvSummary}>

  //   - Your goal is to collect information from the candidate for the JOB_ROLE.
  //   - Analyse for each point of the JOB_ROLE if a Candidate has the right CV info or he is missing something, be creative on the ways that the candidate background can be applied on the role

  //   - smallest number of Bullet points with small summary analyzing the JOB_ROLE for this USER CV:
  // `
  // let promptJOB_CV = `
  //   JOB_ROLE (delimiters <>): <${bestJobRoleMemories}>

  //   USER_CV (delimiters <>) <${cvSummary}>

  //   - Your goal is to collect information from the candidate for the JOB_ROLE.
  //   - Analyse JOB_ROLE and USER_CV and understand if a Candidate has the right CV info or he is missing something, 
  //   - be creative on the ways that the candidate background can be applied on the role

  //   - Your task is to create notes on the candidate’s skills, experience, and education to determine if they are a good fit for the JOB_ROLE.


  //   3-6 small Bullet points:
  // `



  let promptJOB_CV = `
    USER_CV (delimiters <>) <${cvSummary}>

    JOB_ROLE (delimiters <>): <${bestJobRoleMemories}>


    - Your goal is to create a professional really critical Report of the candidate USER_CV for the JOB_ROLE.
    - Report what is missing and what ia a plus for the JOB_ROLE based on the USER_CV

    - Your task is to create a Critical Report on the candidate’s to determine if they are a good fit for the JOB_ROLE.


    Report 3-8 bullet points for JOB_ROLE analyzing USER_CV:
  `
  printC(promptJOB_CV,"3","promptJOB_CV","b")

  infoCandidateForJob = await useGPTchatSimple(promptJOB_CV,0,"API 1","davinci")


  // infoCandidateForJob = `
  // 1. Can you tell us about a time when you had to understand user needs and solve their problems? How did you approach the situation and what was the outcome?
  // 2. How familiar are you with GraphQL, Next.js, React, and TailwindCSS? Can you give us an example of a project you worked on using these technologies?
  // 3. Have you ever worked independently to innovate and create code? Can you tell us about a project where you had to come up with a unique solution?
  // 4. How do you stay up-to-date with the latest developments in front-end development? Do you have any favorite resources or communities you follow?
  // 5. Can you tell us about a time when you had to work collaboratively with a team to achieve a common goal? How did you contribute to the team's success?
  // 6. How do you approach problem-solving and troubleshooting in your work? Can you give us an example of a particularly challenging issue you faced and how you resolved it?
  // `

  // infoCandidateForJob = `        
  // - Lolita Mileta has experience in team leadership, Scrum adoption, and facilitating Scrum ceremonies, which are all relevant skills for the JOB_ROLE.
  // - She has successfully established smooth communication and clear vision for planned tasks, increasing performance by 30%.
  // - Lolita does not have any specific education requirements mentioned in her CV, which is a plus for the JOB_ROLE.
  // - Her personality type is well-suited for the JOB_ROLE, as she is a problem solver, analytical thinker, self-motivated, and results-driven.
  // - Lolita has experience with AWS infrastructure, maintaining TypeScript SDKs and writing documentation, improving observability, monitoring, and alerting for services, and making architectural changes for scaling services.
  // - She does not have any experience with databases and SQL, cloud experience, programming experience, or TypeScript experience, which are all required skills for the JOB_ROLE.
  // `

  printC(infoCandidateForJob,"3","infoCandidateForJob","p")
  // sdf0



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

  // sdf0

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

  // printC(improvedQuestions,"4","improvedQuestions","r")
  // SDF0

        // improvedQuestions = `1. Can you provide examples of web UI applications you have built using TypeScript and React? How did you approach understanding user needs and solving their problems during the development process?
        // 2. How familiar are you with GraphQL and have you used it in any of your previous projects? Can you give an example of how you integrated GraphQL into a React application?
        // 3. Have you worked with Next.js before? If so, can you give an example of a project you have built using it and how it improved the performance of the application?
        // 4. Do you have any experience with REST, SQL, or NoSQL databases? Can you give an example of how you integrated a database into a React application?
        // 5. Have you worked with Java, Scala, Kubernetes, Helm, or containerization before? If not, are you willing to learn and integrate these technologies into your development process?
        // 6. Can you describe a time when you took ownership of a project and what the outcome was? How did you approach problem-solving and collaborating with team members during the project?
        // 7. How do you stay updated with industry trends and developments? Can you give examples of any resources or communities you follow to stay informed?
        // 8. Can you give an example of a time when you had to work independently and in a team to complete a project? How did you balance your individual responsibilities with collaborating with team members?
        // 9. How do you approach code reviews and what is your process for giving and receiving feedback? Can you give an example of a time when you received constructive feedback and how you implemented it into your work?`



  const improvedQuestionsArray = improvedQuestions.split('\n').map((item) => item.replace(/^\d+\.\s*/, ''));

  printC(improvedQuestionsArray,"5","improvedQuestionsArray","r")

  let interviewQuestionsForCandidate = []

  // questionData = await QuestionsEdenAI.find({ _id: questionsToAskID }).select('_id content');

  for (let i=0;i<improvedQuestionsArray.length;i++){
    const improvedQuestion = improvedQuestionsArray[i];

    
    printC(questionData[i],"5","questionData[i]","y")


    interviewQuestionsForCandidate.push({
      originalQuestionID: questionData[i]?._id,
      originalContent: questionData[i]?.content,
      personalizedContent: improvedQuestion,
    })
  }

  printC(interviewQuestionsForCandidate,"3","interviewQuestionsForCandidate","r")

  // sdf0

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

} catch (err) {
  console.log("err = " , err)
}


 
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

async function findConversationPrompt(conversationID) {
  
  convData = await Conversation.findOne({ _id: conversationID }).select('_id userID conversation');

  if (!convData) {
    return ""
  }

  let promptConv = "";
  for (let i = 0; i < convData.conversation.length; i++) {
    let convDataNow = convData.conversation[i];
    if (convDataNow.role == "assistant")
      promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
    else
      promptConv = promptConv + "Employ" + ": " + convDataNow.content + " \n\n";
  }

  return promptConv

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

  
  
  async function useGPTchatSimple(prompt,temperature=0.7,chooseAPI = "API 1",useMode="chatGPT") {
    
    let success = false;
    let retries = 0;
    let apiKey = chooseAPI;

    let extraTimeWait = 0

    let resContent
    while (!success && retries < 4) {
      try {
        console.log("TRY OPENAI = " , apiKey,useMode)

        if (useMode == "chatGPT")
          resContent = await onlyGPTchat(prompt, temperature, apiKey);
        else if (useMode == "davinci"){
          resContent = await onlyGPTDavinci(prompt, temperature, apiKey);
        }
        success = true;
      } catch (e) {
        console.log("Error OpenAI = " , e.response)

        // Sleep for a while before trying again
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Switch to the other API key
        apiKey = apiKey === "API 1" ? "API 2" : "API 1";
      }
      retries++;

      extraTimeWait += 2000
    }

    if (!success) {
      console.error("Failed to get response from OpenAI API");
      return;
    }

    console.log("resContent = " , resContent)

    return resContent;
  }

  async function onlyGPTDavinci(prompt,temperature=0.7,chooseAPI = "API 1",max_tokens = 3000) {
    
    const configuration = new Configuration({
      apiKey: chooseAPIkey(chooseAPI)
    });

    const openai = new OpenAIApi(configuration);

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
    
  
    return generatedText
  }

  async function onlyGPTchat(prompt,temperature=0.7,chooseAPI = "API 1") {
    
    let OPENAI_API_KEY = chooseAPIkey(chooseAPI);

    discussion = [{
      "role": "user",
      "content": prompt
    }]

    
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

    console.log("response.data = " , response.data)
  
    return response.data.choices[0].message.content
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
    findConversationPrompt,
    conversationCVPositionToReportFunc,
    reportPassFailCVPositionConversationFunc,
    findInterviewQuestion,
    positionTextAndConvoToReportCriteriaFunc,
    positionTextToExtraQuestionsFunc,
  };