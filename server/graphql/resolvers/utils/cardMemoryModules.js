


const { Position } = require("../../../models/positionModel");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { Conversation } = require("../../../models/conversationModel");
const { Members } = require("../../../models/membersModel");

const {upsertEmbedingPineCone} = require("../utils/aiExtraModules");


const { printC } = require("../../../printModule");

require("dotenv").config();


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
    // explanation: `Check if the candidate has high-signal credibility markers. Examples of credibility markers that should contribute to a HIGH, positive credibility scores:  
    // 1. Industry Accolades
    
    // 2. Advanced Degrees and Certifications
    
    // 3. Successful Projects
    
    // 4. Patent Ownership
    
    // 5. Significant Business Growth
    
    // 6. Published Work
    
    // 7. Keynote Speaking Engagements
    
    // 8. Leadership Roles
    
    // 9. Mentoring
    
    // 10. Positive Impact on Company
    
    // 11. International Experience
    
    // 12. Philanthropy
    
    // 13. Implementation of New Technologies or Systems
    
    // 14. Multiple Languages
    
    // 15. Powerful References
    
    // 16. Problem Solving
    
    // 17. Entrepreneurship
    
    // 18. Professional Training
    
    // 19. Large Social or Professional Network
    
    // 20. Excellence in Competitive Areas
    
    // 21. Creating and Driving New Strategies
    
    // 22. Successful Fundraising
    
    // 23. Influencing Industry Trend or Conventions
    
    // 24. Breaking Company Records
    
    // 25. Tailored Skills
    
    // 26. Outstanding ROI
    
    // 27. Crisis Management
    
    // 28. Collaborations and Partnerships
    
    // 29. Volunteer Leadership
    
    // 30. Research Contributions
    
    // Examples of things that should give a LOW credibility score
    // 1. Dishonesty
    
    // 2. Poor Communication Skills
    
    // 3. Unprofessional Behavior
    
    // 4. Lack of Preparation
    
    // 5. Job Hopping
    
    // 6. Negative Attitude
    
    // 7. Poor References
    
    // 8. Inconsistencies in Application Materials
    
    // 9. Late or Missed Interviews
    
    // 10. Irrelevant Experience
    
    // 11. Failure to Follow Instructions
    
    // 12. Criminal History
    
    // 13. Inability to Explain Employment Gaps
      
    // 14. Lack of Flexibility
    
    // 15. Being Overqualified
    
    // 16. Not Dressing Appropriately for an Interview
    
    // 17. Inappropriate Behavior during Interview
    
    // 18. Spelling and Grammar Mistakes on Resume/CV
    
    // 19. Displaying Lack of Confidence
    
    // 20. Failure to Take Responsibility for Past Failures
    
    // 21. Substance Abuse
    
    // 22. Failure to Respect Confidentiality
    
    // 23. Bad Credit Score/Financial Mismanagement
    
    // 24. Non-verifiable Achievements
    
    // 25. Lack of Initiative
    
    // 26. Being Unresponsive
    
    // 27. Aggressive or Confrontational Behavior
    
    // 28. Failure to Demonstrate Core Values`,
    explanation: `Check if the candidate has high-signal credibility markers. Examples of credibility markers that should contribute to a HIGH, positive credibility scores:  
    1. Industry Accolades: Recognition by professional organizations or industry groups can be a highly influential sign of top talent. Winning industry awards, being named to prestigious "top" career lists, or receiving other professional acknowledgments.
    
    2. Advanced Degrees and Certifications: Notable education, such as advanced degrees (Masters, PhD), especially from renowned universities. In addition, specialized professional certifications can also be seen as an outstanding achievement.
    
    3. Successful Projects: An ability to efficiently manage and complete complex projects, particularly those that have significantly benefited the business in terms of revenue, efficiency, or other key performance indicators.
    
    4. Patent Ownership: Holding a patent for an invention or design is a very impressive achievement that indicates innovative thinking and can set an individual apart.
    
    5. Significant Business Growth: Demonstrating a direct impact on significant business growth such as increasing sales, boosting customer base, expanding product lines or services, increasing market share, etc.
    
    6. Published Work: Having your work published in well-respected journals, books, or online outlets, shows high level of expertise in your field.
    
    7. Keynote Speaking Engagements: Being invited to speak at industry conferences or other high-profile events indicates recognition of your expertise by peers.
    
    8. Leadership Roles: Holding leadership positions within reputable professional organizations or in previous employments. This could include managing large teams, leading successful initiatives, improving company culture, etc.
    
    9. Mentoring: Playing an official mentoring role in an organization or contributing significantly to the development of others shows leadership and teamwork skills. 
    
    10. Positive Impact on Company: Leaving a significant positive legacy in a previous role, such as turning around a struggling department, dramatically improving processes, or bringing in high-profile clients.
    
    11. International Experience: Having experience in working in different countries or serving multinational clients or teams. This shows one's ability to adapt and deal with different cultures and languages.
    
    12. Philanthropy: Significant involvement in charitable activities or community services, indicating a balanced perspective on work and life, while demonstrating leadership and initiative outside of work.
    
    
    Examples of things that should give a LOW credibility score: 
    1. Dishonesty: This could include lying about qualifications or experience on a resume, or being dishonest during the interview process. 

    2. Poor Communication Skills: This includes not only verbal communication, but also written communication and body language. Communication is crucial in every job, and a candidate who struggles with it could be harder to place in a role.

    3. Unprofessional Behavior: This could range from inappropriate language or behavior during the interview to an unprofessional or inappropriate online presence.

    4. Lack of Preparation: Candidates who haven't researched the company or the role, or who aren't prepared with thoughtful questions, can be seen as uncommitted or disinterested.

    5. Job Hopping: While this isn't necessarily a deal-breaker in every case, frequent job changes can sometimes be a red flag and cause concern about a candidate's stability or commitment.

    6. Negative Attitude: Candidates who have a negative perspective, or who speak poorly about previous roles or employers during the interview, can be seen as a problem employee in future.

    7. Poor References: A critical aspect of credibility is having positive references from past employers. If a candidate hesitates to provide references, or if the references they do provide aren't strong, this can detract from their credibility.

    8. Inconsistencies in Application Materials: If there are discrepancies between a candidate's resume, cover letter, LinkedIn, or other application materials, it can raise questions about their truthfulness and attention to detail.

    9. Late or Missed Interviews: Being late for an interview or missing it entirely without a valid reason displays a lack of respect for the interviewer's time and a lack of commitment to the hiring process.

    10. Irrelevant Experience: If a candidate's prior work experience is completely unrelated to the role they're applying for, and they can't articulate how their skills could transfer, it could question their suitability for the role and raise doubts about their career direction.
`,
//     explanation_old: "Check if what the candidate has credibility markers like university degree or working on companies to prove what he says",
//     // examples: "Credibility is a judgment that the other person makes about you, based on how you present yourself, how you behave, and what you say. ",
  },
  {
    ID: "CONSISTENCY",
    name: "Consistency",
    explanation:`Check the folloiwng things & score accordingly. Score neutral if none of these apply. 
    1. Match Employment History: A high consistency score would be given if the candidate provides detailed and matching information about their past job roles, dates, and organizations as shown on their CV. A low consistency score would be given if there are significant discrepancies.
  
  2. Skill Set: A high score would be given if the candidate confidently and accurately reflects the skills stated on their CV, embellishing it with real-life examples and applications. A low score would be given if the candidate fumbles or can't provide clear instances of using those skills.
  
  3. Specific Achievements: High points would be awarded if the candidate clearly describes achievements mentioned on the CV, including their role in it, how it was achieved and the impact of it. A low score would be given if they beat around the bush or are unable to explain the specifics.
  
  4. Verify Educational Details: High consistency is seen when the candidate's explanation of their educational journey, including lessons learnt, correlates with what's on the CV. A low score would result from mismatched information or inability to coherently discuss their educational background.
  
  5. Check Candidates' Projects: A high score would be given if candidates can thoroughly explain the projects on their CV – their role, project outcomes, results, and learnings. A low score would be given for a vague or inconsistent explanation.
  
  6. References: High marks would be given if references verify candidate's experience and vouch for their skills and character. A low score would be given if the references contradict the candidate's claims or do not respond.
  
  7. Behavioral Consistency: High score would be awarded for candidates whose behavior in the interview consistently matches their characteristic traits stated on the CV. A low score corresponds to candidates who contradict or misrepresent their traits.
  
  8. Competency-based Questions: A high consistency score is given if the candidate can clearly demonstrate the competences from their CV with past examples. Low score is awarded for vague or irrelevant responses.
  
  9. Cross-checking Details: High score if all details provided in the interview match those given in the CV. Low score if the candidate disagrees with or contradicts information in their CV.
  
  10. Enquire About Gaps: High score if the candidate provides logical, credible reasons for employment gaps. Low points if they are unable or unwilling to explain career gaps. `,
    // explanation_old: "Check if the stories they tell are aligned with what they say in their CV",
    // examples: "Consistency is a judgment that the other person makes about you, based on how you present yourself, how you behave, and what you say. ",
  },
  {
    ID: "EXPERT",
    name: "Expert",
    explanation: `Become an expert in the field of the candidate. Score them according to the level of experitse they seem to have.
    Categories to consider when scoring - when a candidate clearly exhibits any of these in an advanced way, give them a high score - if they don't give them a low score. :
    1. Depth of Knowledge: An expert should have an in-depth understanding of the field's foundations, principles, and theories.They should also be knowledgeable about recent advances and current trends in the field.
    
    2. Practical Skills: Being able to apply theory to practice is key. These skills should extend beyond using standard tools to being able to manually adapt where necessary.

    3. Problem Solving: An expert should possess strong problem-solving skills, including the ability to identify the right approaches or techniques to solve unique problems and the underlying elements that contribute to effective problem solving in their field. 

    4. Experience with Real-world Projects: Experience with actual projects in the field can separate an expert from a novice.

    5. Research and Innovation: If someone has conducted research, published papers, or developed new methodologies in the field, this would be a strong sign of expertise.

    6. Communication: Experts should be able to communicate complex ideas effectively and the implications of results to both technical and non-technical audiences.

    7. Learning Agility: Experts will exhibit a drive to stay current with new developments and integrate them into their work as applicable.

    8. Understanding of Business: Experts should understand how their piece fits into the larger business or organizational context. This includes understanding how to translate business problems into field related tasks, understanding and managing risks, articulating the strategic value of their field speciifc  projects, etc. 

    9. Professional References: References or endorsements from other recognized experts in the field can also be a strong indicator of a person's level of expertise. 

    10. Ethics and Responsibility: Understanding the importance of areas like privacy, security, fairness, and the prevention of bias in ther field s is crucial for experts in the field. 

    In conclusion, expertise extends far beyond just understanding the basics - it involves a deep, comprehensive knowledge of the field, practical experience, ongoing learning, and the ability to apply all of these to real-world situations. `,
    // explanation_old: "Become the perfect Expert for this candidate and check if the candidate is an expert in the field",
    // examples: "Expert is a judgment that the other person makes about you, based on how you present yourself, how you behave, and what you say. ",
  }
]

async function createCardsScoresCandidate_3(cvInfo,promptConv,userID) {


  cardMemoriesDataCandidate = await CardMemory.find({ "authorCard.userID": userID  });


  let cardMemoriesCandidateArray = [];
  let oldMemoriesIDprompt = ""



  if (cardMemoriesDataCandidate.length == 0) {
   // --------- Prompt for finding Cards-----------
  //  promptFindMemoriesCandidate = `
  //  CV Candidate (delimited <>): <${cvInfo}>
  //  Candidate Conversation for Job (delimited <>): <${promptConv}>


   
  //  - Your task is to create a Memory that will indicate the most important information about a candidate
  //  - You need to extract for each Memory the Category, Content
  //  - Category can ONLY be one of this!! : TECHNICAL_SKILLS, SOFT_SKILLS, EXPERIENCE, INDUSTRY_KNOWLEDGE, INTERESTS, CORE_VALUES, GOALS, EDUCATION, OTHER
  //  - Content is a text that describes the Memory
  //  - Be careful choosing the right amount of memories you have from 0 to 30 Memories to represent the most important parts of the Job

  //  - Example of Memory:
  //  1. TECHNICAL_SKILLS / Working as Senior in Google using Python
  //  2. SOFT_SKILLS / Leader for 3 years, position in a team in Netflix
  //  3. EXPERIENCE / Worked in really big projects for 5 years with react
  //  4. ...

  //  Memories Result 0 to 30:
  //  `
  promptFindMemoriesCandidate = `
  CV Candidate (delimited <>): <${cvInfo}>
  Interview (delimited <>): <${promptConv}>
     
    - Your task is to create a detailed candidate Memory that will capture the most important information about a candidate. Your objective is to find & package as many pieces as high-signal information. High-signal information is information that tells a lot about who the person is, in & outside of a work setting.  
    - You need to extract for each Memory the Category, Content
    - The Category can ONLY be one of these!! : TECHNICAL_SKILLS, BEHAVIOR, EXPERIENCE, DOMAIN_EXPERTISE, INTERESTS, CORE_VALUES, GOALS, EDUCATION, OTHER
    - Content is text that describes the Memory. Extract facts only & be hyper specific. Do NOT use any vauge non-descriptive words like "good", "proficient",etc.
    - BEHAVIOR category memories should include Situation, Task , Action & Outcome.
    - TECHNICAL_SKILL memories should have specific credibility indicators such as years of experience, the specific projects they worked on, the companies they worked on, speicifc descriptions of their contributions regarding those skills, relevant courses they took, attestations from coworkers, ... 
    - Be intentional with what memories you want to include about this person as you have maximum 40 Memories to represent this person's talents, personality & potential. 
    - Don't repeat information, if you already have a memory, don't add another one related.
    - DO NOT MAKE THINGS UP. 
    - Don't use all 40 memories if you don't have to
    
    - Examples of Memories:
    1. TECHNICAL_SKILLS / Worked as Senior Network Engineer at Google having worked on projects at the Google Maps team using Python, C++ & SQL. 
    2. BEHAVIOR / Held a leadership position tasked with taking over the fledgeling Ipad devision at Apple after the previous leader was fired. They were given a tight deadline to come up with a prototype that would incorporate the new biometric scan and against all odds were able to deliver 1 week before. They sold 20% more of these ipads in the first year.   
    3. EXPERIENCE / Helped get the platform back up at 3am on a saturday after a cyber-security attack in less than 4 hours.
    4. DOMAIN_EXPERTISE / Got a PhD in Graph Convolutional Neural Nets with his thesis on Unifying graph convolutional neural networks and label propagation.
    5. INTERESTS / Founded the blockchain club at Yale.
    6. CORE_VALUES / Mentioned reading one self-development book a week indicating that self-development is one of her core - values
    7. GOALS / Mentioned that his dream job is to become VP of engineering at a fortune 500 company.
    8. EDUCATION / Got a Bsc in Computer Science from the KU Leuven university in Belgium.
    9. OTHER / Recognised by his colleagues as a fun-to-be-around go-getter. 
    10. ...

    Memories Result From 10 to 40 MAX:
   `

   printC(promptFindMemoriesCandidate, "5", "promptFindMemoriesCandidate", "p")
  //  s21

  //  cardMemoriesCandidate = await useGPTchatSimple(promptFindMemoriesCandidate, 0, "API 1");
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

  // ------------------------- Organise the memories for the next phase connecting with the company ------------
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
  // ------------------------- Organise the memories for the next phase connecting with the company ------------

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
    - Score of Agent can be a number from -10 LOW to 10 HIGH to 0 NEUTRAL
    - Be really harsh wit the scoring its better to put a low score than a high one, put high score only if you are SURE!
    - Only return the ID of the memory and the score of the agent

    - Example Results: 
    1. ID_1 / 10
    2. ID_2 / 2
    3. ID_3 / -5
    4. ID_4 / 8
    5. ID_5 / -10


    Results: 
    `

    // printC(cardScoreAgentPrompt, "5", "cardScoreAgentPrompt", "p")

    cardScoreAgentString = await useGPTchatSimple(cardScoreAgentPrompt, 0, "API 1");
    // cardScoreAgentString = await useGPTchatSimple(cardScoreAgentPrompt, 0, "API 1","chatGPT4");

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
 // --------- Find Scores for Agents ----------



 // --------- Add this cards to Mongo ----------
 const reactAppMongoDatabase = process.env.REACT_APP_MONGO_DATABASE
 for (let i = 0; i < cardMemoriesCandidateArray.length; i++) {
  let cardMemoryCandidate = cardMemoriesCandidateArray[i];

  if (cardMemoryCandidate?.cardID) {

    //  ---------------- Add to Pinecone ------------------
    cardMemoryDataNowT = await CardMemory.findOne({ _id: cardMemoryCandidate.cardID });

    if (!cardMemoryDataNowT?.pineconeDB?.pineconeID) {
      let textPinecone = cardMemoryDataNowT.content + "\n Category: " + cardMemoryDataNowT.type

      let filterUpsert = {
        text: textPinecone,
        database: reactAppMongoDatabase,
        label: "scoreCardMemory",
        category: cardMemoryDataNowT.type,
        userID: userID,
        mongoID: cardMemoryDataNowT._id,
      }

      let resPineCone  = await upsertEmbedingPineCone(filterUpsert)

      cardMemoryDataNowT.pineconeDB = {
        pineconeID: resPineCone.pineConeID,
        text: textPinecone,
        metadata: {
          label: "scoreCardMemory",
          database: reactAppMongoDatabase,
          userID: userID,
        }
      }

      cardMemoryDataNowT.save();
    }
    //  ---------------- Add to Pinecone ------------------


    continue;
  }

  let agentArray = []

  for (let i = 0; i < Agents.length; i++) {
    let agent = Agents[i];
    agentArray.push({
      category: agent.ID,
      score: cardMemoryCandidate[agent.ID]
    })
  }


  cardMemoryDataNow = await addCardMemoryFunc({ 
    content: cardMemoryCandidate.description,
    type: cardMemoryCandidate.category,
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


  //  ---------------- Add to Pinecone ------------------
  let textPinecone = cardMemoryDataNow.content + "\n Category: " + cardMemoryDataNow.type

  let filterUpsert = {
    text: textPinecone,
    database: reactAppMongoDatabase,
    label: "scoreCardMemory",
    category: cardMemoryDataNow.type,
    userID: userID,
    mongoID: cardMemoryDataNow._id,
  }

  let resPineCone  = await upsertEmbedingPineCone(filterUpsert)

  cardMemoryDataNow.pineconeDB = {
    pineconeID: resPineCone.pineConeID,
    text: textPinecone,
    metadata: {
      label: "scoreCardMemory",
      database: reactAppMongoDatabase,
      userID: userID,
    }
  }

  cardMemoryDataNow.save();
  //  ---------------- Add to Pinecone ------------------

}
// d13
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
