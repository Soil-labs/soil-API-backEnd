


const { Position } = require("../../../models/positionModel");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { Conversation } = require("../../../models/conversationModel");
const { Members } = require("../../../models/membersModel");


const { printC } = require("../../../printModule");


const {
  useGPTchatSimple,
} = require("../utils/aiModules");


async function addCardMemoryFunc(filter) {

    let { _id, content, priority, tradeOffBoost, type, connectedCards, authorCard, score } = filter;



    let cardMemoryData = null;

    if (_id) { // update

      cardMemoryData = await CardMemory.findOne({ _id });

      if (!cardMemoryData) throw new ApolloError("CardMemory not found", { component: "cardMemoryMutation > addCardMemory" });

      if (content) cardMemoryData.content = content;
      if (priority) cardMemoryData.priority = priority;
      if (tradeOffBoost) cardMemoryData.tradeOffBoost = tradeOffBoost;
      if (type) cardMemoryData.type = type;
      if (authorCard) cardMemoryData.authorCard = authorCard;
      if (score) cardMemoryData.score = score;
      
      if (connectedCards) {
        // Check if the cardID already exist on the connectedCards
        for (let i = 0; i < connectedCards.length; i++) {
          let connectedCardNEW = connectedCards[i];

          let cardExist = false
          for (let j=0;j< cardMemoryData?.connectedCards?.length;j++){
            let connectedCardOLD = cardMemoryData?.connectedCards[j];

            if (connectedCardOLD?.cardID?.toString() == connectedCardNEW?.cardID?.toString()) {
              // Update the score
              cardMemoryData.connectedCards[j].score = connectedCardNEW.score
              cardMemoryData.connectedCards[j].reason = connectedCardNEW.reason
              cardMemoryData.connectedCards[j].agent = connectedCardNEW.agent

              cardExist = true
            } 
          }

          if (!cardExist) {
            // Add the new card
            cardMemoryData?.connectedCards.push(connectedCardNEW);
          }
        


        }
          
      }
      
      // if (connectedCards) cardMemoryData.connectedCards = connectedCards;
    


    } else { // create

      cardMemoryData = new CardMemory({
        content,
        priority,
        tradeOffBoost,
        type,
        connectedCards,
        score
      });

      if (authorCard) cardMemoryData.authorCard = authorCard;

      
    }

    await cardMemoryData.save();

    // printC(cardMemoryData, "1", "cardMemoryData", "b")


    // console.log("sss00 2----")


    // ---------- Add the same connection to the opposite card -------------
    if (connectedCards) {
      
      let connectedCardOriginal = cardMemoryData;
      for (let i = 0; i < connectedCards.length; i++) {
        let connectedCardOLD = connectedCards[i];
        let connectedCardMemoryNEW = await CardMemory.findOne({ _id: connectedCardOLD?.cardID });

        if (!connectedCardMemoryNEW) continue;

        // connectedCardMemoryNEW.connectedCards.push({ 
        //     cardID: cardMemoryData._id,   
        //     score: connectedCard.score, 
        //     reason: connectedCard.reason,
        //   });

        let cardExist = false

        for (let j=0;j< connectedCardMemoryNEW?.connectedCards?.length;j++){
          let connectedCardNEW = connectedCardMemoryNEW?.connectedCards[j];

          if (connectedCardNEW?.cardID?.toString() == connectedCardOriginal?._id?.toString()) {
            // Update the score
            // connectedCardMemoryNEW.connectedCards[j].score = connectedCardOLD.score
            // connectedCardMemoryNEW.connectedCards[j].reason = connectedCardOLD.reason
            // connectedCardMemoryNEW.connectedCards[j].agent = connectedCardOLD.agent

            cardExist = true
          } 
        }
        if (!cardExist) {
          // Add the new card
          connectedCardMemoryNEW?.connectedCards.push({
            cardID: connectedCardOriginal._id,
            // ...connectedCardMemoryNEW.connectedCards[j]
          });
        }

        await connectedCardMemoryNEW.save();
      }
    }
    // ---------- Add the same connection to the opposite card -------------


    return cardMemoryData;
}

const Agents = [
  {
    ID: "CREDIBILITY",
    name: "Credibility",
    explanation: "Check if what the candidate has credibility markers like university degree or working on companies to prove what he says",
    // examples: "Credibility is a judgment that the other person makes about you, based on how you present yourself, how you behave, and what you say. ",
  },
  {
    ID: "CONSISTENCY",
    name: "Consistency",
    explanation: "Check if the stories they tell are aligned with what they say in their CV",
    // examples: "Consistency is a judgment that the other person makes about you, based on how you present yourself, how you behave, and what you say. ",
  },
  {
    ID: "EXPERT",
    name: "Expert",
    explanation: "Become the perfect Expert for this candidate and check if the candidate is an expert in the field",
    // examples: "Expert is a judgment that the other person makes about you, based on how you present yourself, how you behave, and what you say. ",
  }
]

async function createCardsScoresCandidate_3(cvInfo,promptConv,userID) {


  cardMemoriesDataCandidate = await CardMemory.find({ "authorCard.userID": userID  });


  let cardMemoriesCandidateArray = [];
  let oldMemoriesIDprompt = ""



  if (cardMemoriesDataCandidate.length == 0) {
   // --------- Prompt for finding Cards-----------
   promptFindMemoriesCandidate = `
   CV Candidate (delimited <>): <${cvInfo}>
   Candidate Conversation for Job (delimited <>): <${promptConv}>


   
   - Your task is to create a Memory that will indicate the most important information about a candidate
   - You need to extract for each Memory the Category, Content
   - Category can ONLY be one of this!! : TECHNICAL_SKILLS, SOFT_SKILLS, EXPERIENCE, INDUSTRY_KNOWLEDGE, INTERESTS, CORE_VALUES, GOALS, EDUCATION, OTHER
   - Content is a text that describes the Memory
   - Be careful choosing the right amount of memories you have from 0 to 30 Memories to represent the most important parts of the Job

   - Example of Memory:
   1. TECHNICAL_SKILLS / Working as Senior in Google using Python
   2. SOFT_SKILLS / Leader for 3 years, position in a team in Netflix
   3. EXPERIENCE / Worked in really big projects for 5 years with react
   4. ...

   Memories Result 0 to 30:
   `

   printC(promptFindMemoriesCandidate, "5", "promptFindMemoriesCandidate", "p")
  //  s21

   cardMemoriesCandidate = await useGPTchatSimple(promptFindMemoriesCandidate, 0, "API 1","chatGPT4");


  // cardMemoriesCandidate = `1. TECHNICAL_SKILLS / Experienced Full Stack Developer with a solid track record of 7 years in the software development industry.
  // 2. TECHNICAL_SKILLS / Proficient in both front-end and back-end technologies, including React.js, Angular, Node.js, PHP, Python, Vue.js, Java, React Native, Next.js, Javascript, Typescript, Laravel, HTML, CSS, Mobile Development, MongoDB, SQL, AWS.
  // 3. SOFT_SKILLS / Strong problem-solving and analytical thinking skills, instrumental in identifying and rectifying bottlenecks in application performance.
  // 4. SOFT_SKILLS / Strong Agile methodologies and version control skills, fostering efficient collaboration within development teams.
  // 5. EXPERIENCE / Worked with a team of skillful developers at Bullhu to build, improve and maintain both the back-end and front-end systems.
  // 6. EXPERIENCE / Built many projects including mobile apps, websites(frontend & backend) as a full stack developer at ITWerks Group of Companies.
  // 7. EXPERIENCE / Developed shopping, education and company websites using React, Angular, Node, HTML, CSS, JavaScript, and PHP at Miquido.
  // 8. INDUSTRY_KNOWLEDGE / Built and implemented data integration with REST APIs to insightful information.
  // 9. INDUSTRY_KNOWLEDGE / Integrated with other frameworks like eCommerce & Woocommerce and libraries like live-video streaming services.
  // 10. EDUCATION / Bachelor's Degree of Computer Science from Ivan Franko National University of Lviv.
  // 11. SOFT_SKILLS / Excellent task prioritization and management skills, with a structured approach to designing user-friendly and visually appealing UI.
  // 12. EXPERIENCE / Worked on projects that required extensive application of front-end development skills, including creating user profiles, timelines, newsfeeds, implementing real-time updates and notifications, and developing interactive features like comments, likes, and shares.
  // 13. SOFT_SKILLS / Demonstrated successful collaboration with backend teams, particularly in areas such as API design, testing and validation, real-time integration, security and authentication, scalability, testing and bug fixing, documentation, deployment and maintenance, and establishing a feedback loop.
  // 14. SOFT_SKILLS / Strong emphasis on collaboration and communication, with a comprehensive and detailed approach to task management.
  // 15. GOALS / Committed to staying updated with emerging technologies and producing top-tier code, aligning seamlessly with the fast-paced nature of modern development environments.
  // 16. CORE_VALUES / Demonstrates a commitment to excellence and adaptability in tackling new challenges.
  // 17. INTERESTS / Passionate about delivering innovative solutions that bridge the gap between functionality and design.`

   
   printC(cardMemoriesCandidate, "1", "cardMemoriesCandidate", "b")
 // --------- Prompt for finding Cards-----------


 // --------- Regex the cardMemoriesString ----------
 const regex = /^(.*?) \/ (.*)$/gm;


 let match;
 let i = 0;
 while ((match = regex.exec(cardMemoriesCandidate)) !== null) {
   i++;
   const obj = {
     category: match[1].trim().split('. ')[1],
     description: match[2].trim(),
     ID: i,
   };
   cardMemoriesCandidateArray.push(obj);

   oldMemoriesIDprompt += `ID_${i}. ${obj.description}\n`
 }

 printC(cardMemoriesCandidateArray, "4", "cardMemoriesCandidateArray", "g")
 printC(oldMemoriesIDprompt, "3", "oldMemoriesIDprompt", "p")
//  a3
 // --------- Regex the cardMemoriesString ----------

} else {
  for (let i = 0; i < cardMemoriesDataCandidate.length; i++) {
    let cardMemory = cardMemoriesDataCandidate[i];

    cardMemoriesCandidateArray.push({
      category: cardMemory.type,
      description: cardMemory.content,
      ID: i + 1,
      cardID: cardMemory._id,
    });

    oldMemoriesIDprompt += `ID_${i + 1}. ${cardMemory.content}\n`

    if (cardMemory?.score && cardMemory?.score?.agent) {
      for (let j = 0; j < cardMemory?.score?.agent.length; j++) {
        let agentScore = cardMemory?.score?.agent[j];

        cardMemoriesCandidateArray[i] = {
          ...cardMemoriesCandidateArray[i],
          [agentScore.category]: agentScore.score
        }
        
      }
    }
  }
}

  printC(cardMemoriesCandidateArray, "4", "cardMemoriesCandidateArray", "g")
  printC(oldMemoriesIDprompt, "3", "oldMemoriesIDprompt", "p")



 // --------- Find Scores for Agents ----------
 for (let i = 0; i < Agents.length; i++) {

    // check if this Agents.ID already exist on the cardMemoriesCandidateArray

    if (cardMemoriesCandidateArray[0][Agents[i].ID] != undefined) {
      continue;
    }

    // ---------- Agent Organization ------------
    agentMainPrompt = `You are a ${Agents[i].name}, your job is to evaluate the candidate based on the following 
    criteria: <${Agents[i].explanation}>`
    // ---------- Agent Organization ------------
  
    // --------- Prompt for finding Cards for Agent-----------
    cardScoreAgentPrompt = `
    CV Candidate (delimited <>): <${cvInfo}>
    Candidate Conversation for Job (delimited <>): <${promptConv}>

    Memories to Evaluate (delimited <>): <${oldMemoriesIDprompt}>

    ${agentMainPrompt}
    - Score of Agent can be a number from 0 LOW to 10 HIGH
    - Be really harsh wit the scoring its better to put a low score than a high one, put high score only if you are SURE!
    - Only return the ID of the memory and the score of the agent

    - Example Results: 
    1. ID_1 / 10
    2. ID_2 / 8


    Results: 
    `

    // printC(cardScoreAgentPrompt, "5", "cardScoreAgentPrompt", "p")

    cardScoreAgentString = await useGPTchatSimple(cardScoreAgentPrompt, 0, "API 1");

    // cardScoreAgentString = `ID_1 / 9
    // ID_2 / 10
    // ID_3 / 8
    // ID_4 / 7
    // ID_5 / 9
    // ID_6 / 9
    // ID_7 / 9
    // ID_8 / 8
    // ID_9 / 8
    // ID_10 / 10
    // ID_11 / 9
    // ID_12 / 9
    // ID_13 / 9
    // ID_14 / 9
    // ID_15 / 9
    // ID_16 / 8
    // ID_17 / 9`

    printC(cardScoreAgentString, "3", "cardScoreAgentString", "y")

    // a5

    // --------- Regex the cardScoreAgentString ----------

    const regex = /^(.*?) \/ (-?\d+)$/gm;
    const cardScoreAgentArray = [];

    let match;
    let t = 0;
    while ((match = regex.exec(cardScoreAgentString)) !== null) {

      t++;

      const obj = {
        ID: match[1].trim().split('_')[1],
        score: parseInt(match[2]),
      };
      cardScoreAgentArray.push(obj);

      idN = parseInt(obj.ID) - 1

      
      cardMemoriesCandidateArray[idN] = {
        ...cardMemoriesCandidateArray[idN],
        [Agents[i].ID]: obj.score
      }
    }

    // printC(cardScoreAgentArray, "4", "cardScoreAgentArray", "g")
    // printC(cardMemoriesCandidateArray, "5", "cardMemoriesCandidateArray", "g")
    // a6

    // --------- Regex the cardScoreAgentString ----------

 }
    // printC(cardMemoriesCandidateArray, "5", "cardMemoriesCandidateArray", "g")
    // a6
 // --------- Find Scores for Agents ----------


 // --------- Add this cards to Mongo ----------
 for (let i = 0; i < cardMemoriesCandidateArray.length; i++) {
  let relatedCardMemory = cardMemoriesCandidateArray[i];

  if (relatedCardMemory?.cardID) {
    continue;
  }

  let agentArray = []

  for (let i = 0; i < Agents.length; i++) {
    let agent = Agents[i];
    agentArray.push({
      category: agent.ID,
      score: relatedCardMemory[agent.ID]
    })
  }

  // printC(agentArray, "5", "agentArray", "g")
  // sd9

  cardMemoryDataNow = await addCardMemoryFunc({ 
    content: relatedCardMemory.description,
    type: relatedCardMemory.category,
    authorCard:{
      userID: userID,
      category: "CANDIDATE"
    },
    score: {
      agent: agentArray
    }
  });

  cardMemoriesCandidateArray[i] = {
    ...cardMemoriesCandidateArray[i],
    cardID: cardMemoryDataNow._id
  }

}
// --------- Add this cards to Mongo ----------


return cardMemoriesCandidateArray;
  
}

async function connectCardsPositionToCandidateAndScore(cardMemoriesCandidateArray,cardMemoriesDataPosition,userID) {


  cardMemoriesCandidate = ""

  for (let i=0; i < cardMemoriesCandidateArray.length; i++) {
    let cardMemoryCandidate = cardMemoriesCandidateArray[i];

    cardMemoriesCandidate += `ID_${cardMemoryCandidate.ID}. ${cardMemoryCandidate.description}\n`
    
  }

  let cardMemoryDataNowAll = []
  
  for (let i = 0; i < cardMemoriesDataPosition.length; i++) {
    // for (let i = 0; i < 1; i++) {
      const cardMemoryPosition = cardMemoriesDataPosition[i];
      
      printC(cardMemoryPosition, "5", "cardMemoryPosition", "r");


      // -------------------- Check if there is already connected cards from this userID --------------------
      connectedCardsID = []
      for (let j = 0; j < cardMemoryPosition?.connectedCards?.length; j++) {
        const connectedCard = cardMemoryPosition?.connectedCards[j];
        
        const connectedCardDataN = await CardMemory.findOne({ _id: connectedCard?.cardID });

        if (connectedCardDataN && connectedCardDataN?.authorCard?.userID?.toString() == userID?.toString()){
          connectedCardsID.push(connectedCard?.cardID)

          cardMemoryDataNowAll.push(connectedCardDataN)
        }
      }

      // printC(connectedCardsID, "6", "connectedCardsID", "p")
      if (connectedCardsID.length > 0) {

        continue
      }
      // -------------------- Check if there is already connected cards from this userID --------------------

      


      // --------- Prompt for finding Cards -----------

      // Position Requirement  (delimited <>): <"Be really good at dancing and yoga">
      promptFindRelatedCards = `
      Position Requirement  (delimited <>): <${cardMemoryPosition.content}>

      Card Memories Candidate (delimited <>): <${cardMemoriesCandidate}>


      - Your task is to find the Candidate Card Memories that are extremely closely related to the Position Requirement and the score
      - Only use extremely highly relevant memories! Don't use any memory that is not extremely relevant
      - Be careful choosing the right amount of memories you can find from 0 to 5 Candidate Memories
      - Return the number ID of the Card Memories, and the score of the relevancy 
      - The score is a number from 1 Low to 10 High of the relevancy, Be really careful with the score its way better to have a really low score than being high from a mistake!

      - Example 1: ID_18 / 3, ID_15 / 6
      - Example 2: ID_2 / 2
      - Example 3: 
      - Example 4: ID_1 / 3, ID_8 / 5, ID_5 / 8, ID_15 / 3, ID_2 / 1


      Result with CardIDs and Scores: 
      `

      printC(promptFindRelatedCards, "5", "promptFindRelatedCards", "p")
      // ss00
      

      const apiVersion = Math.random() < 0.5 ? "API 1" : "API 2";
      relatedCardMemoriesString = await useGPTchatSimple(promptFindRelatedCards, 0, apiVersion,"chatGPT4");

      // relatedCardMemoriesString = `ID_1 / 7, ID_8 / 5, ID_5 / 4, ID_15 / 3, ID_2 / 1`
      // relatedCardMemoriesString = `1. EXPERIENCE / Worked with a team of skillful developers to build, improve and maintain both the back-end and front-end systems at Bullhu.
      // 2. TECHNICAL_SKILLS / Built REST APIs for websites and mobile apps at Bullhu.
      // 3. EXPERIENCE / Built many projects including mobile apps, websites (frontend & backend) as a full stack developer at ITWerks Group of Companies.
      // 4. SOFT_SKILLS / Played various roles such as mobile developer, front-end developer, back-end developer, and project manager at ITWerks Group of Companies.
      // 5. EXPERIENCE / Developed shopping, education, and company websites using React, Angular, Node, HTML, CSS, JavaScript, and PHP at Miquido.`

      printC(relatedCardMemoriesString, "3", "relatedCardMemoriesString", "g")
      
      // --------- Prompt for finding Cards -----------

      // --------- Regex the cardMemoriesString ----------
      const regex = /ID_(\d+) \/ (\d+)/g;

      let relatedCardMemoriesArray = [];
      let match;

      while ((match = regex.exec(relatedCardMemoriesString)) !== null) {
        const id = parseInt(match[1]);
        const score = parseInt(match[2]);
        relatedCardMemoriesArray.push({ _id: id, score: score });
      }

      console.log(relatedCardMemoriesArray);
      // --------- Regex the cardMemoriesString ----------

      //  -------- Add to the card the connection ------------
      let cardMemoryDataNow = null 

      let connectedCardsT = []
      for (let k=0;k<relatedCardMemoriesArray.length;k++){
        const posArray = relatedCardMemoriesArray[k]
        const relatedCardMemory = cardMemoriesCandidateArray[posArray._id -1];

        connectedCardsT.push({
          cardID: relatedCardMemory?.cardID,
          agent: [{
            category: "ALIGNMENT",
            score: posArray.score
          }]
        })


      }

      // printC(connectedCardsT, "5", "connectedCardsT", "g")
      // ss0s

      cardMemoryDataNow = await addCardMemoryFunc({ 
        _id: cardMemoryPosition._id,
        connectedCards: connectedCardsT,
      });

      printC(cardMemoryDataNow, "5", "cardMemoryDataNow", "g")

      cardMemoryDataNowAll.push(cardMemoryDataNow)

      await wait(3)

      //  -------- Add to the card the connection ------------

    }

    return cardMemoryDataNowAll


}

async function createCardsScoresCandidate_2(cvInfo,promptConv) {


  // --------- Prompt for finding Cards for Agent-----------
  let agentMainPrompt = ""
  let agentNamePrompt = ""
  let agentNameExamplePrompt = ""
  let scoreExample = []

  for (let i = 0; i < Agents.length; i++) {
    let agent = Agents[i];
    agentMainPrompt += `- For ${agent.name} Score ${agent.explanation} \n`

    agentNamePrompt += `${agent.name} Score, `
    agentNameExamplePrompt += `${agent.name} Score / `

  }

  agentNameExamplePrompt = agentNameExamplePrompt.slice(0, -2);

  agentMainPrompt = agentMainPrompt.slice(0, -1);

  for (let j = 0; j < 3; j++) {
    let scoreC = ""
    for (let i = 0; i < Agents.length; i++) {
      // find random 3 numbers from 0 to 10 for the score example
      let scoreT = Math.floor(Math.random() * 11)

      scoreC += `${scoreT} / `

    }

    scoreExample.push(scoreC.slice(0, -2))
  }

  agentNamePrompt = agentNamePrompt.slice(0, -2);

  printC(agentMainPrompt, "5", "agentMainPrompt", "p")
  printC(agentNamePrompt, "6", "agentNamePrompt", "p")
  printC(scoreExample, "7", "scoreExample", "p")
  // d17
  
  // --------- Prompt for finding Cards for Agent-----------

   // --------- Prompt for finding Cards for Agent-----------
   promptFindMemoriesCandidate = `
   CV Candidate (delimited <>): <${cvInfo}>
   Candidate Conversation for Job (delimited <>): <${promptConv}>


   
   - Your task is to create a Memory that will indicate the most important information about a candidate
   - You need to extract for each Memory the Category, ${agentNamePrompt}, Content
   - Category can ONLY be one of this!! : TECHNICAL_SKILLS, SOFT_SKILLS, EXPERIENCE, INDUSTRY_KNOWLEDGE, INTERESTS, CORE_VALUES, GOALS, EDUCATION, OTHER
   - Score can be a number from 0 LOW to 10 HIGH, Be really harsh wit the scoring its better to put a low score than a high one, put high score only if you are SURE!
   ${agentMainPrompt}
   - Content is a text that describes the Memory
   - Be careful choosing the right amount of memories you have from 0 to 30 Memories to represent the most important parts of the Job

   - Example of Memory:
   Number. Category / ${agentNameExamplePrompt}/ Content
   1. TECHNICAL_SKILLS / ${scoreExample[0]}/ Working as Senior in Google using Python
   2. SOFT_SKILLS / ${scoreExample[1]}/ Leader for 3 years, position in a team in Netflix
   3. EXPERIENCE / ${scoreExample[2]}/ Worked in really big projects for 5 years with react
   4. ...

   Memories Result 0 to 30:
   `

   printC(promptFindMemoriesCandidate, "5", "promptFindMemoriesCandidate", "p")
  //  s21

   cardMemoriesCandidate = await useGPTchatSimple(promptFindMemoriesCandidate, 0, "API 1","chatGPT4");

   
   printC(cardMemoriesCandidate, "1", "cardMemoriesCandidate", "b")

 // --------- Prompt for finding Cards for Agent-----------

  
}


function wait(x) {
  return new Promise(resolve => {
    setTimeout(resolve, x*1000);
  });
}



async function createCardsScoresCandidate(cvInfo,promptConv) {

  let agentMainPrompt = ""

  // let oldMemories = null // TODO - Delete later this is just for testing
  // let oldMemories = `ID_1. Extensive experience as a Full Stack Developer with proficiency in React.js, Angular, Node.js, PHP, Python, Vue.js, Java, React Native, Next.js, Javascript, Typescript, Laravel, HTML, CSS, Mobile Development, MongoDB, SQL, and AWS.
  // ID_2. Worked as a Full Stack Developer at Bullhu, ITWerks Group of Companies, and Miquido, handling both front-end and back-end systems, building REST APIs, and improving system quality.
  // ID_3. Demonstrated strong problem-solving and analytical thinking skills, with a knack for identifying and rectifying bottlenecks in application performance.
  // ID_4. Has a deep understanding of Agile methodologies and version control skills, fostering efficient collaboration within development teams.`

  let oldMemories = `ID_1. Extensive experience as a Full Stack Developer with proficiency in React.js, Angular, Node.js, PHP, Python, Vue.js, Java, React Native, Next.js, Javascript, Typescript, Laravel, HTML, CSS, Mobile Development, MongoDB, SQL, and AWS.
  ID_2. Worked as a Full Stack Developer at Bullhu, ITWerks Group of Companies, and Miquido, handling both front-end and back-end systems, building REST APIs, and improving system quality.
  ID_3. Demonstrated strong problem-solving and analytical thinking skills, with a knack for identifying and rectifying bottlenecks in application performance.
  ID_4. Has a deep understanding of Agile methodologies and version control skills, fostering efficient collaboration within development teams.
  ID_5. Shows commitment to excellence and adaptability in tackling new challenges, with a history of contributing to the growth and success of previous companies.
  ID_6. Holds a Bachelor's Degree in Computer Science from Ivan Franko National University of Lviv.
  ID_7. Demonstrated excellent collaboration skills, particularly in working with backend teams on GraphQL, and emphasized the importance of clear communication, testing, security, scalability, and documentation.
  ID_8. Has experience in developing shopping, education, and company websites using React, Angular, Node, HTML, CSS, JavaScript, and PHP.
  ID_9. Showed a structured approach to designing user-friendly and visually appealing UI, and has a comprehensive strategy for task prioritization and management.
  ID_10. Passionate about staying updated with emerging technologies and dedicated to producing top-tier code.
  ID_11. Aims to apply comprehensive skill set to contribute meaningfully to a forward-thinking team.
  ID_12. Has experience in building and implementing data integration with REST APIs to insightful information.
  ID_13. Has experience in mobile development, having built many projects including mobile apps as a full stack developer.
  ID_14. Demonstrated ability to work independently and manage tasks effectively in a dynamic and fast-paced environment.
  ID_15. Played various roles such as mobile developer, front-end developer, back-end developer, and project manager at ITWerks Group of Companies.
  ID_16. Has experience in integrating with other frameworks like eCommerce & Woocommerce and libraries like live-video streaming services.
  ID_17. Has experience in building and deploying solutions to improve email, website, and e-commerce performance.
  ID_18. Provided repair and troubleshooting support to high-end clients with strict deadlines at Miquido.
  ID_19. Demonstrated detail-oriented approach and creativity in driving impactful outcomes.
  ID_20. Fluent in English and has a LinkedIn profile for professional networking.`

  let oldMemoriesPrompt = ""
  let oldMemoriesExplanationPrompt = ""
  let oldMemoriesExplanationPrompt_2 = ""

  for (let i = 0; i < Agents.length; i++) {

    // ---------- Agent Organization ------------
    agentMainPrompt = `You are a ${Agents[i].name}, your job is to evaluate the candidate based on the following 
    criteria: <${Agents[i].explanation}>`
    // ---------- Agent Organization ------------

    // ---------- Old Memories Organization ------------
    if (oldMemories == null) {
    } else {

      oldMemoriesPrompt = `OLD_MEMORIES (delimited <>): <${oldMemories}>` // TODO


      oldMemoriesExplanationPrompt = `- Don't ever repeat any new memories that are similar to OLD_MEMORIES!! 
      - Every new memory Should be completely original!!!
      - Its better to not create a memory than to create a memory that is similar to OLD_MEMORIES!`
      // - Score all the old memories from 0 to 10, 0 is LOW and 10 is HIGH
      // - use the Memory ID and then score without repeating the Category or the Content!`

      // oldMemoriesExplanationPrompt_2 = `5. ID_2 / 8
      // 6. ID_3 / 3`
    }
    // ---------- Old Memories Organization ------------


    // --------- Prompt for finding Cards for Agent-----------
    promptFindMemoriesCandidate = `
      CV Candidate (delimited <>): <${cvInfo}>
      Candidate Conversation for Job (delimited <>): <${promptConv}>

      ${oldMemoriesPrompt}

      ${agentMainPrompt}
      - Your task is to create a Memory that will indicate the most important information about a candidate
      - You need to extract for each Memory the Category, Score of Agent, Content
      - Category can ONLY be one of this!! : TECHNICAL_SKILLS, SOFT_SKILLS, EXPERIENCE, INDUSTRY_KNOWLEDGE, INTERESTS, CORE_VALUES, GOALS, EDUCATION, OTHER
      - Score of Agent can be a number from 0 LOW to 10 HIGH
      - Be really harsh wit the scoring its better to put a low score than a high one, put high score only if you are SURE!
      - Content is a text that describes the Memory
      - Be careful choosing the right amount of memories you have from 0 to 20 Memories to represent the most important parts of the Job
      ${oldMemoriesExplanationPrompt}

      - Example of Memory:
      1. TECHNICAL_SKILLS / Working as Senior in Google using Python
      2. SOFT_SKILLS / 3 years leadership position in a team in Netflix
      3. EXPERIENCE / Worked in really big projects for 5 years with react
      4. ...
      ${oldMemoriesExplanationPrompt_2}

      Memories Result 0 to 20:
      `

      printC(promptFindMemoriesCandidate, "5", "promptFindMemoriesCandidate", "p")
      

      cardMemoriesCandidate = await useGPTchatSimple(promptFindMemoriesCandidate, 0, "API 1","chatGPT4");

      // cardMemoriesCandidate = `1. TECHNICAL_SKILLS / 10 / Extensive experience as a Full Stack Developer with proficiency in React.js, Angular, Node.js, PHP, Python, Vue.js, Java, React Native, Next.js, Javascript, Typescript, Laravel, HTML, CSS, Mobile Development, MongoDB, SQL, and AWS.
      // 2. EXPERIENCE / 10 / Worked as a Full Stack Developer at Bullhu, ITWerks Group of Companies, and Miquido, handling both front-end and back-end systems, building REST APIs, and improving system quality.
      // 3. SOFT_SKILLS / 9 / Demonstrated strong problem-solving and analytical thinking skills, with a knack for identifying and rectifying bottlenecks in application performance.
      // 4. INDUSTRY_KNOWLEDGE / 9 / Has a deep understanding of Agile methodologies and version control skills, fostering efficient collaboration within development teams.
      // 5. CORE_VALUES / 8 / Shows commitment to excellence and adaptability in tackling new challenges, with a history of contributing to the growth and success of previous companies.
      // 6. EDUCATION / 8 / Holds a Bachelor's Degree in Computer Science from Ivan Franko National University of Lviv.
      // 7. SOFT_SKILLS / 10 / Demonstrated excellent collaboration skills, particularly in working with backend teams on GraphQL, and emphasized the importance of clear communication, testing, security, scalability, and documentation.
      // 8. TECHNICAL_SKILLS / 9 / Has experience in developing shopping, education, and company websites using React, Angular, Node, HTML, CSS, JavaScript, and PHP.
      // 9. SOFT_SKILLS / 10 / Showed a structured approach to designing user-friendly and visually appealing UI, and has a comprehensive strategy for task prioritization and management.
      // 10. INTERESTS / 7 / Passionate about staying updated with emerging technologies and dedicated to producing top-tier code.
      // 11. GOALS / 8 / Aims to apply comprehensive skill set to contribute meaningfully to a forward-thinking team.
      // 12. EXPERIENCE / 9 / Has experience in building and implementing data integration with REST APIs to insightful information.
      // 13. TECHNICAL_SKILLS / 8 / Has experience in mobile development, having built many projects including mobile apps as a full stack developer.
      // 14. SOFT_SKILLS / 9 / Demonstrated ability to work independently and manage tasks effectively in a dynamic and fast-paced environment.
      // 15. EXPERIENCE / 8 / Played various roles such as mobile developer, front-end developer, back-end developer, and project manager at ITWerks Group of Companies.
      // 16. INDUSTRY_KNOWLEDGE / 8 / Has experience in integrating with other frameworks like eCommerce & Woocommerce and libraries like live-video streaming services.
      // 17. TECHNICAL_SKILLS / 9 / Has experience in building and deploying solutions to improve email, website, and e-commerce performance.
      // 18. EXPERIENCE / 8 / Provided repair and troubleshooting support to high-end clients with strict deadlines at Miquido.
      // 19. SOFT_SKILLS / 9 / Demonstrated detail-oriented approach and creativity in driving impactful outcomes.
      // 20. OTHER / 8 / Fluent in English and has a LinkedIn profile for professional networking.`
      // cardMemoriesCandidate = `1. TECHNICAL_SKILLS / 10 / Extensive experience as a Full Stack Developer with proficiency in React.js, Angular, Node.js, PHP, Python, Vue.js, Java, React Native, Next.js, Javascript, Typescript, Laravel, HTML, CSS, Mobile Development, MongoDB, SQL, and AWS.
      // 2. EXPERIENCE / 10 / Worked as a Full Stack Developer at Bullhu, ITWerks Group of Companies, and Miquido, handling both front-end and back-end systems, building REST APIs, and improving system quality.
      // 3. SOFT_SKILLS / 9 / Demonstrated strong problem-solving and analytical thinking skills, with a knack for identifying and rectifying bottlenecks in application performance.
      // 4. INDUSTRY_KNOWLEDGE / 9 / Has a deep understanding of Agile methodologies and version control skills, fostering efficient collaboration within development teams.
      // 5. CORE_VALUES / 8 / Shows commitment to excellence and adaptability in tackling new challenges, with a history of contributing to the growth and success of previous companies.`

      printC(cardMemoriesCandidate, "1", "cardMemoriesCandidate", "b")

    // --------- Prompt for finding Cards for Agent-----------

    sd11

    // --------- Regex the cardMemoriesString ----------
    const regex = /^(.*?) \/ (-?\d+) \/ (.*)$/gm;
    const cardMemoriesArray = [];
    
    let match;
    let k = 0;
    while ((match = regex.exec(cardMemoriesCandidate)) !== null) {
      k++;
      const obj = {
        category: match[1].trim().split('. ')[1],
        score: parseInt(match[2]),
        description: match[3].trim(),
      };
      cardMemoriesArray.push(obj);

      oldMemoriesPrompt += `${k}. ${obj.description}\n`

    }
    
    // printC(cardMemoriesArray, "2", "cardMemoriesArray", "g")
    printC(oldMemoriesPrompt, "3", "oldMemoriesPrompt", "g")
    // --------- Regex the cardMemoriesString ----------


    printC(i, "", "Phase Agent Loop", "r")
    await wait(1)
  }


  
}


module.exports = {
  addCardMemoryFunc,
  createCardsScoresCandidate,
  createCardsScoresCandidate_2,
  createCardsScoresCandidate_3,
  connectCardsPositionToCandidateAndScore,
};
