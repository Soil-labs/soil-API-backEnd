


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


typeAccepted = ["TECHNICAL_SKILLS","SOFT_SKILLS","BEHAVIOR","EXPERIENCE","INDUSTRY_KNOWLEDGE","DOMAIN_EXPERTISE","INTERESTS","CORE_VALUES","GOALS","EDUCATION","OTHER"]

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

  // if type is not part of this array typeAccepted  then continue
  if (!typeAccepted.includes(cardMemoryCandidate.category)) {
    continue;
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

      evaluationCriteria = ""
      if (cardMemoryPosition?.scoreCriteria) {
        evaluationCriteria = `Explanation Evaluation Criteria for this Position Requirement (delimited <>): <${cardMemoryPosition.scoreCriteria}>`
      }


      promptFindRelatedCards = `
      Position Requirement  (delimited <>): <${cardMemoryPosition.content}>
      ${evaluationCriteria}

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


async function createCardsCandidateForPositionFunc(positionID, userID) {


  if (!positionID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > createCardsCandidateForPosition" });
  positionData = await Position.findOne({ _id: positionID }).select('_id name positionsRequirements candidates');
  if (!positionData) throw new ApolloError("Position not found", { component: "cardMemoryMutation > createCardsCandidateForPosition" });
  

  // -------------- Read every Card of the Position --------------
  cardMemoriesData = await CardMemory.find({ "authorCard.positionID": positionID  });

  if (cardMemoriesData.length == 0) throw new ApolloError("CardMemory for Position not found First Create Cards for the Position", { component: "cardMemoryMutation > createCardsCandidateForPosition" });

  printC(cardMemoriesData, "1", "cardMemoriesData", "b")
  // -------------- Read every Card of the Position --------------

  
  try {

    let membersData = []
    let userIDs = []
    

    // ---------------------- Collect all the users ------------
    if (userID) {
      memberData = await Members.findOne({ _id: userID }).select('_id discordName cvInfo');
      
      if (!memberData) throw new ApolloError("User not found", { component: "cardMemoryMutation > createCardsCandidateForPosition" });

      membersData.push(memberData)
    } else {

      for (let i = 0; i < positionData.candidates.length; i++) {
        const candidate = positionData.candidates[i];

        if (candidate.scoreCardCategoryMemories.length != 0) continue

        userIDs.push(candidate.userID)


      }

      membersData = await Members.find({ _id: userIDs }).select('_id discordName cvInfo');


    }
    // ---------------------- Collect all the users ------------


    
    let cardMemoryDataNowAll = []
    
    for (let i = 0; i < membersData.length; i++) {
      const memberData = membersData[i];
      userID = memberData._id



      // ---------- CV member ----------
      const cvInfo = memberData.cvInfo.cvContent

      // ---------- CV member ----------

      //  --------- Find conversation of position ---------

      positionF = {
        $or: [{ positionID: positionID }, { extraPositionsID: positionID }],
      }

      convData = await Conversation.findOne({
        $and: [positionF, { userID: userID }],
      }).select("_id conversation");


      if (!convData) continue;

      let promptConv = "";
      for (let i = 0; i < convData.conversation.length; i++) {
        let convDataNow = convData.conversation[i];
        if (convDataNow.role == "assistant")
          promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
        else
          promptConv = promptConv + "User: " + convDataNow.content + " \n\n";
      }

      printC(promptConv, "2", "promptConv", "y")
      //  --------- Find conversation of position ---------

      let cardMemoriesCandidateArray = await createCardsScoresCandidate_3(cvInfo,promptConv,userID)

      printC(cardMemoriesCandidateArray, "3", "cardMemoriesCandidateArray", "g")

      // f6

      cardMemoryDataNowAll = await connectCardsPositionToCandidateAndScore(cardMemoriesCandidateArray,cardMemoriesData,userID)


      wait(5)
    }



    return cardMemoryDataNowAll

    
  } catch (err) {
    console.log("err = ",err)
    throw new ApolloError(
      err.message,
      err.extensions?.code || "createCardsCandidateForPosition",
      { component: "cardMemoryMutation > createCardsCandidateForPosition" }
    );
  }

}

async function calculateScoreCardCandidateToPositionFunc(userID,positionID) {

  e = 0.9 // Important 😮 - Variable for Curvature of score
  u = 0.1 // Important 😮 - Variable for Curvature of score
  

  let A_m = 0.9// Important 😮 - Variables to change the equation for m which is  weight/importance of each card 
  let B_m = 0.2 
  // m = A*e**(-B*n)
  // m = 0.5 //Old -  Variable to change the weight/importance of each card 




  if (!positionID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });
  positionData = await Position.findOne({ _id: positionID }).select('_id name positionsRequirements candidates');
  if (!positionData) throw new ApolloError("Position not found", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });
  

   // -------------- Read every Card of the Position --------------
   cardMemoriesDataPosition = await CardMemory.find({ "authorCard.positionID": positionID  });

   if (cardMemoriesDataPosition.length == 0) throw new ApolloError("CardMemory for Position not found First Create Cards for the Position", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });

   printC(cardMemoriesDataPosition, "1", "cardMemoriesDataPosition", "b")
   // -------------- Read every Card of the Position --------------

  // -------------- Find all the userIDs that we need to calculate --------------
  let userIDs = []
  if (userID) {
    userIDs = [userID]
  } else {
    for (let i = 0; i < positionData.candidates.length; i++) {
      const candidate = positionData.candidates[i];

      // if (candidate.scoreCardCategoryMemories.length != 0) continue // SOS 🆘 - If the candidate already has a full scoreCardCategoryMemories then continue

      userIDs.push(candidate.userID)

    }
  }
  // -------------- Find all the userIDs that we need to calculate --------------

  // printC(userIDs, "1", "userIDs", "b")
  // d99

  try {

    for (let i = 0; i < userIDs.length; i++) {

      userID = userIDs[i];


      // find were is the userID inside teh positionData.candidates.userID and keep this index
      let indexCandidateOnPosition = -1

      for (let i = 0; i < positionData.candidates.length; i++) {
        const candidate = positionData.candidates[i];
        if (candidate.userID.toString() == userID.toString()){
          indexCandidateOnPosition = i
          break
        }
      }

      if (indexCandidateOnPosition == -1) continue;


      // -------------- Check if the candidate already has a full scoreCardCategoryMemories --------------
      // if ( positionData.candidates[indexCandidateOnPosition].scoreCardTotal.scoreCardCalculated == true) 
      //   continue; // SOS 🆘 - If the candidate already has a full scoreCardCategoryMemories then continue
      // -------------- Check if the candidate already has a full scoreCardCategoryMemories --------------

     


      memberData = await Members.findOne({ _id: userID }).select('_id discordName cvInfo');

      if (!memberData) continue;

      // ------------- Find all the IDs of teh cardMemoriesDataPosition connected cards --------
      connectedCardsID = []

      for (let i = 0; i < cardMemoriesDataPosition.length; i++) {
        const cardMemoryPos = cardMemoriesDataPosition[i];
        for (let j = 0; j < cardMemoryPos.connectedCards.length; j++) {
          const connectedCard = cardMemoryPos.connectedCards[j];
          if (connectedCard.cardID) connectedCardsID.push(connectedCard.cardID)
        }
      }

      const connectedCardDataN = await CardMemory.find({ _id: connectedCardsID });
      
      // Check if this connectedCardDataN are authorCard CANDIDATE
      let cardMemoriesDataCandidate = []
      let cardMemoriesDataCandidateObj = {}


      let dataCardCandidateObj = {}
      let dataCardPositionObj = {}
      let dataCardCategoriesObj = {}
      let cardMemoriesEverything = [] // all together the final think that we will save in the DB

      // --- Create all the arrays


      for (let i = 0; i < connectedCardDataN.length; i++) {
        const connectedCardDataNow = connectedCardDataN[i];
        if (connectedCardDataNow.authorCard.category == "CANDIDATE" && connectedCardDataNow.authorCard.userID.toString() == userID.toString()) {
          cardMemoriesDataCandidate.push(connectedCardDataNow)

          cardMemoriesDataCandidateObj[connectedCardDataNow._id] = connectedCardDataNow

        }
      }

      printC(cardMemoriesDataCandidate, "3", "cardMemoriesDataCandidate", "r")
      // ------------- Find all the IDs of teh cardMemoriesDataPosition connected cards --------


      // --------------- Go to each candidate card and calculate the internal score ---------------
      for (let i = 0; i < cardMemoriesDataCandidate.length; i++) {
        const cardMemoryCandidate = cardMemoriesDataCandidate[i];

        
        if (!cardMemoryCandidate?.score) continue
        

        if (cardMemoryCandidate?.score?.overall) {
          
          if (cardMemoriesDataCandidateObj[cardMemoryCandidate._id]?.score?.overall )
            cardMemoriesDataCandidateObj[cardMemoryCandidate._id].score.overall = cardMemoryCandidate.score.overall
          
          continue
          
        }



        let scoreInternal = 0
        let scoreInternalCount = 0
        
        for (let j = 0; j < cardMemoryCandidate?.score?.agent?.length; j++) {
          const scoreAgent = cardMemoryCandidate.score.agent[j];

          if (scoreAgent?.score){ // Change the Weights based on the category
            if (scoreAgent.category == "CREDIBILITY"){
              scoreInternal = scoreInternal + scoreAgent.score
              scoreInternalCount = scoreInternalCount + 1

            } else if (scoreAgent.category == "CONSISTENCY"){
              scoreInternal = scoreInternal + scoreAgent.score
              scoreInternalCount = scoreInternalCount + 1

            } else if (scoreAgent.category == "EXPERT"){
              scoreInternal = scoreInternal + scoreAgent.score
              scoreInternalCount = scoreInternalCount + 1

            } else {
              scoreInternal = scoreInternal + scoreAgent.score
              scoreInternalCount = scoreInternalCount + 1
            }
          } 
            
        }

        if (scoreInternalCount > 0) scoreInternal = scoreInternal / scoreInternalCount

        cardMemoryCandidate.score.overall = scoreInternal

        cardMemoriesDataCandidateObj[cardMemoryCandidate._id].score.overall = scoreInternal

        await cardMemoryCandidate.save()
      }
      // s1
      // --------------- Go to each candidate card and calculate the internal score ---------------


      
      
      // --------------- Go to each position card and calculate the external-internal score ---------------
      for (let i = 0; i < cardMemoriesDataPosition.length; i++) {
        const cardMemoryPosition = cardMemoriesDataPosition[i];

        // printC(cardMemoryPosition.connectedCards, "3", "cardMemoryPosition.connectedCards", "p")

        let scoreInternalExternal = 0
        let scoreInternalExternalCount = 0

        let n = 0
        for (let j = 0; j < cardMemoryPosition.connectedCards.length; j++) {
          const connectedCard = cardMemoryPosition.connectedCards[j];

          if (!cardMemoriesDataCandidateObj[connectedCard.cardID]) continue // Only keep the cards that are in the candidate cards

          if (cardMemoriesDataCandidateObj[connectedCard.cardID].authorCard.userID.toString() != userID.toString()) continue // Only keep the cards that are from the correct user

          if (!cardMemoriesDataCandidateObj[connectedCard.cardID]?.score?.overall) continue // cards ned to have scores

          n += 1
        }

        let m = A_m*(2.71)**(-B_m*n)

        // printC(m, "3", "m", "p")
        // printC(n, "3", "n", "p")
        // d0

        let scoreCardsCandidate = []
        
        for (let j = 0; j < cardMemoryPosition.connectedCards.length; j++) {
          const connectedCard = cardMemoryPosition.connectedCards[j];

          if (!cardMemoriesDataCandidateObj[connectedCard.cardID]) continue // Only keep the cards that are in the candidate cards

          if (cardMemoriesDataCandidateObj[connectedCard.cardID].authorCard.userID.toString() != userID.toString()) continue // Only keep the cards that are from the correct user

          if (!cardMemoriesDataCandidateObj[connectedCard.cardID]?.score?.overall) continue // cards ned to have scores


          let scoreExternal = 0
          let scoreExternalCont = 0

          for (let k=0; k < connectedCard.agent.length; k++) {
            const agent = connectedCard.agent[k];
            if (agent?.score) {
              scoreExternal = scoreExternal + agent.score
              scoreExternalCont = scoreExternalCont + 1

            }
          }

          if (scoreExternalCont > 0) scoreExternal = scoreExternal / scoreExternalCont


          printC(cardMemoriesDataCandidateObj[connectedCard.cardID], "6", "cardMemoriesDataCandidateObj[connectedCard.cardID]", "r")

          let scoreInternal = cardMemoriesDataCandidateObj[connectedCard.cardID].score.overall

          let scoreInternalExternalNow = (scoreInternal*0.1) * (scoreExternal*0.1) //  multiple with 0.1 to reduce score from 0 to 1

          cardMemoryPosition.connectedCards[j].score = scoreInternalExternalNow.toFixed(2)

          scoreInternalExternal += scoreInternalExternalNow*m // multiple with m to change the weight of the card
          scoreInternalExternalCount = scoreInternalExternalCount + 1

          scoreCardsCandidate.push({
            cardID: connectedCard.cardID,
            scoreAlignment: parseFloat((scoreExternal*0.1).toFixed(2)),
          })
        }

        if (scoreInternalExternalCount > 0) {
          scoreInternalExternal = e*(scoreInternalExternal**2) + u 

          if (scoreInternalExternal > 1) scoreInternalExternal = 1

          cardMemoryPosition.score.overall = scoreInternalExternal.toFixed(2)

          printC(cardMemoryPosition, "3", "cardMemoryPosition", "p")
          printC(scoreInternalExternal, "4", "scoreInternalExternal", "b")

          // keep all the candidate cards
          dataCardPositionObj[cardMemoryPosition._id] = {
            cardID: cardMemoryPosition._id,
            score: scoreInternalExternal,
            scoreCardsCandidate: scoreCardsCandidate,
          }

          // await cardMemoryPosition.save()
        } else {
          dataCardPositionObj[cardMemoryPosition._id] = {
            cardID: cardMemoryPosition._id,
            score: null,
            scoreCardsCandidate: [],
          }
        }


        
      }
      // printC(dataCardPositionObj, "3", "dataCardPositionObj", "r")
      // s9
      // --------------- Go to each position card and calculate the external-internal score ---------------


      // --------------- Loop Position Cards find the reasons for the scores ---------------
      for (let i = 0; i < cardMemoriesDataPosition.length; i++) {

        // continue // SOS 🆘 - Remove this line to activate the reason

        const cardMemoriesDataPositionN = cardMemoriesDataPosition[i];

        const cardMemoriesScore = cardMemoriesDataPositionN.score.overall;

        if (!cardMemoriesScore) continue

        // if (cardMemoriesDataPositionN.score.reason) {

        //   dataCardPositionObj[cardMemoriesDataPositionN._id] = {
        //     ...dataCardPositionObj[cardMemoriesDataPositionN._id],
        //     reason: "great reason",
        //   }
        //   continue
        // }
        
        

        // Fid the Data for the prompt
        const cardMemoryPositionContent = cardMemoriesDataPositionN.content;

        let cardMemoryCandidateContent = ""

        for (let j=0;j<cardMemoriesDataPositionN?.connectedCards?.length;j++){
          const connectedCard = cardMemoriesDataPositionN.connectedCards[j];

          // printC(connectedCard, "3", "connectedCard", "p")
          
          const connectedCardDataTT = cardMemoriesDataCandidateObj[connectedCard.cardID]

          if (!connectedCardDataTT?.content ) continue
          
          // printC(connectedCardDataTT, "3", "connectedCardDataTT", "g")
          // s1

          // cardMemoryCandidateContent += `- ${connectedCardDataTT.content} \n\n`
          // printC(connectedCard.score, "3", "connectedCard.score", "g")
          // s09
          cardMemoryCandidateContent += `- ${connectedCardDataTT.content} / Score: ${connectedCard.score.toFixed(1)} \n\n`
        }

        // printC(cardMemoryPositionContent, "3", "cardMemoryPositionContent", "p")
        // printC(cardMemoriesScore, "3", "cardMemoriesScore", "p")
        // printC(cardMemoryCandidateContent, "3", "cardMemoryCandidateContent", "p")
        // d91



        // Create the prompt
        const promptReasonScore = `
        Card that is evaluated (delimited <>): <${cardMemoryPositionContent}>
        
        Score of the Card that is evaluated 0 LOW 1 HIGH (delimited <>): <${cardMemoriesScore.toFixed(1)}>
        
        Connected cards and their scores (delimited <>): <${cardMemoryCandidateContent}>

        - Your task is to write why it got this Score
        - Go straight to the point, don't mention the score, keep it really small
        - 2 bullet points 10 word MAX each

        reason 2 bullet points: 
        `

        printC(promptReasonScore, "5", "promptReasonScore", "p")
        // s10

        const apiVersion = Math.random() < 0.5 ? "API 1" : "API 2";
        reasonScoreString = await useGPTchatSimple(promptReasonScore, 0,apiVersion);

        printC(reasonScoreString, "5", "reasonScoreString", "b")


        cardMemoriesDataPositionN.score.reason = reasonScoreString


        // dataCardPositionObj[cardMemoriesDataPositionN._id].reason = reasonScoreString
        dataCardPositionObj[cardMemoriesDataPositionN._id] = {
          ...dataCardPositionObj[cardMemoriesDataPositionN._id],
          reason: reasonScoreString,
        }

        // await cardMemoriesDataPositionN.save()

        // s0



        wait(2)

      }
      printC(cardMemoriesDataPosition, "3", "cardMemoriesDataPosition", "r")
      // --------------- Loop Position Cards find the reasons for the scores ---------------




      // ------------------ Organize per category -------------------
      let cardMemoriesDataPositionObj = {}
      for (let i = 0; i < cardMemoriesDataPosition.length; i++) {
        const cardMemoryPosition = cardMemoriesDataPosition[i];


        if (!cardMemoriesDataPositionObj[cardMemoryPosition.type]){
          cardMemoriesDataPositionObj[cardMemoryPosition.type] = {
            totalPriority: 0,
            cardMemoryPosition: [],
            score: -1,
            reason: "",
            priority: 0,
            idxScoreCategoryCandidates: -1,
          }
        }

        if (cardMemoryPosition.priority){
          cardMemoriesDataPositionObj[cardMemoryPosition.type].totalPriority += (6 - cardMemoryPosition.priority)
        }

        cardMemoriesDataPositionObj[cardMemoryPosition.type].cardMemoryPosition.push(cardMemoryPosition) 
        
        // ---------------- if already score or reason exist add it to the object ------------
        candidate = positionData.candidates[indexCandidateOnPosition]

        for (let j=0;j< candidate?.scoreCardCategoryMemories?.length;j++){
          const scoreCardCategoryMemory = candidate.scoreCardCategoryMemories[j];

          printC(scoreCardCategoryMemory, "F2", "scoreCardCategoryMemory", "p")

          if (scoreCardCategoryMemory.category == cardMemoryPosition.type){
            if (scoreCardCategoryMemory._id) cardMemoriesDataPositionObj[cardMemoryPosition.type]._id = scoreCardCategoryMemory._id
            if (scoreCardCategoryMemory.score) cardMemoriesDataPositionObj[cardMemoryPosition.type].score = scoreCardCategoryMemory.score

            if (scoreCardCategoryMemory.reason) cardMemoriesDataPositionObj[cardMemoryPosition.type].reason = scoreCardCategoryMemory.reason

            if (scoreCardCategoryMemory.priority) cardMemoriesDataPositionObj[cardMemoryPosition.type].priority = scoreCardCategoryMemory.priority

            cardMemoriesDataPositionObj[cardMemoryPosition.type].idxScoreCategoryCandidates = j
            
          }
        }
        // ---------------- if already score or reason exist add it to the object ------------
      }
      // printC(cardMemoriesDataPositionObj, "3", "cardMemoriesDataPositionObj", "r")
      // f2
      // ------------------ Organize per category -------------------





      // ------------------ calculate total score and reason in each category ------------
      for (const category in cardMemoriesDataPositionObj) {
        if (Object.hasOwnProperty.call(cardMemoriesDataPositionObj, category)) {
          const cardMemoriesDataPositionObjNow = cardMemoriesDataPositionObj[category];


          // if (cardMemoriesDataPositionObjNow.score != -1) continue

          
          let totalScore = 0
          let totalScoreCount = 0
          let totalScoreC = 0
          let averagePriorityCategory = 0

          let scoreCardsPosition = []

          for (let i = 0; i < cardMemoriesDataPositionObjNow.cardMemoryPosition.length; i++) {
            const cardMemoryPosition = cardMemoriesDataPositionObjNow.cardMemoryPosition[i];

            // if (category == "OTHER") {
            //   printC(cardMemoryPosition, "12", "cardMemoryPosition", "r")

            // }

            if (dataCardPositionObj[cardMemoryPosition._id]){

              // console.log("category = ", category)
              // console.log("hi - ",cardMemoryPosition.score?.overall)
              // console.log("hi yoj0",dataCardPositionObj[cardMemoryPosition._id])

              // printC(cardMemoryPosition.score?.overall, "0", "cardMemoryPosition.score?.overall", "p")

              // if (cardMemoryPosition.score?.overall){
              //   totalScore += cardMemoryPosition.score.overall*(6 - cardMemoryPosition.priority)
              //   totalScoreCount += 6 - cardMemoryPosition.priority
              //   totalScoreC += 1
              // }
              if (dataCardPositionObj[cardMemoryPosition._id].score){
                totalScore += dataCardPositionObj[cardMemoryPosition._id].score*(6 - cardMemoryPosition.priority)
                totalScoreCount += 6 - cardMemoryPosition.priority
                totalScoreC += 1
              } else {
                totalScoreCount += 6 - cardMemoryPosition.priority
                totalScoreC += 1
              }

              // printC(dataCardPositionObj[cardMemoryPosition._id], "3", "dataCardPositionObj[cardMemoryPosition._id]", "g")
            
              scoreCardsPosition.push(
                dataCardPositionObj[cardMemoryPosition._id]
              )
            }

          }

          // if (category == "OTHER") {
          //   console.log("totalScore = ",totalScore)
          //   console.log("totalScoreCount = ",totalScoreCount)
          //   console.log("scoreCardsPosition = ",scoreCardsPosition)
          //   d12
          // }

          // printC(category, "3", "category", "g")
          // printC(totalScore, "4", "totalScore", "g")
          // printC(totalScoreCount, "4", "totalScoreCount", "g")
          // printC(averagePriorityCategory, "5", "averagePriorityCategory", "g")

          // printC(scoreCardsPosition, "f5", "scoreCardsPosition", "p")
          if (scoreCardsPosition.length >0 ){
            printC(scoreCardsPosition[0].scoreCardsCandidate, "f5", "scoreCardsPosition[0].scoreCardsCandidate", "p")
          }
          // // console.log(cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates)
          // s10

          if (totalScoreCount > 0) totalScore = totalScore / totalScoreCount
          if (totalScoreC > 0) averagePriorityCategory = totalScoreCount / totalScoreC

          cardMemoriesDataPositionObj[category].score = totalScore

          if (cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates != -1) {

            const idx = cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates

            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[idx].score = totalScore
            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[idx].priority = averagePriorityCategory.toFixed(2)
            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[idx].scoreCardsPosition = scoreCardsPosition

          } else {
            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.push({
              category: category,
              score: totalScore,
              priority: averagePriorityCategory.toFixed(2),
              scoreCardsPosition: scoreCardsPosition,
            })

            cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates = positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.length - 1

          }

          cardMemoriesDataPositionObj[category].priority = parseFloat(averagePriorityCategory.toFixed(2))

          // printC(scoreCardsPosition, "3", "scoreCardsPosition", "g")
          // d9

        }
      }
      // printC( positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories, "8", " positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories", "b")
      // printC( positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[6], "9", "next", "p")
      // printC( positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[6].scoreCardsPosition[0], "10", "next", "r")

      // f1
      // ------------------ calculate total score and reason in each category ------------

  



      // ------------ Categories find reason for score------------
      for (const category in cardMemoriesDataPositionObj) {
        if (Object.hasOwnProperty.call(cardMemoriesDataPositionObj, category)) {
          const cardMemoriesDataPositionObjNow = cardMemoriesDataPositionObj[category];

          // continue // SOS 🆘 - Remove this line to activate the reason for the score

          if (cardMemoriesDataPositionObjNow.reason) continue

          let scoreCategoryPrompt = "0"
          if (cardMemoriesDataPositionObjNow.totalScore)
            scoreCategoryPrompt = cardMemoriesDataPositionObjNow.totalScore.toString()

          const categoryPrompt = category

          let cardsPositionContentAndScorePrompt = ""

          for (let i = 0; i < cardMemoriesDataPositionObjNow.cardMemoryPosition.length; i++) {
            const cardMemoryPosition = cardMemoriesDataPositionObjNow.cardMemoryPosition[i];

            if (cardMemoryPosition.score?.overall && cardMemoryPosition.content){

              cardsPositionContentAndScorePrompt += `- ${cardMemoryPosition.content} / Score: ${cardMemoryPosition.score.overall.toFixed(1)} \n\n`
            }

          }
          printC(cardsPositionContentAndScorePrompt, "3", "cardsPositionContentAndScorePrompt", "g")
          


          // Create the prompt
          let promptReasonCategoryScore = `
          Card Category that is evaluated (delimited <>): <${categoryPrompt}>
          
          Score of the Category that is evaluated 0 LOW 1 HIGH (delimited <>): <${scoreCategoryPrompt}>
          
          Connected cards and their scores (delimited <>): <${cardsPositionContentAndScorePrompt}>

          - Your task is to write why it got this Score
          - Go straight to the point, don't mention the score, keep it really small 
          - Go straight to the point, don't mention the score, keep it really small
          - 2 bullet points 10 word MAX each
  
          reason 2 bullet points: 
          `

          printC(promptReasonCategoryScore, "5", "promptReasonCategoryScore", "p")


          const apiVersion = Math.random() < 0.5 ? "API 1" : "API 2";
          // let reasonCategoryScore = await useGPTchatSimple(promptReasonCategoryScore, 0,apiVersion);

          let reasonCategoryScore = "not calculated let me know if I should calculate it"
  
          printC(reasonCategoryScore, "5", "reasonCategoryScore", "b")


          if (cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates != -1){

            const idx = cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates

            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[idx].reason = reasonCategoryScore
          } else {
            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.push({
              _id: cardMemoryPosition._id,
              category: category,
              reason: reasonCategoryScore,
            })

            cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates = positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.length - 1

          }



          wait (3);

        }
      }

      // ------------ Categories find reason for score------------


      // f1
      // -------------- Total Score of Candidate --------------
      // printC(positionData.candidates[indexCandidateOnPosition].scoreCardTotal, "12", "positionData.candidates[indexCandidateOnPosition].scoreCardTotal", "g")
      let totalScoreCandidate = 0
      let totalScoreCandidateCount = 0

      for (const category in cardMemoriesDataPositionObj) {
        if (Object.hasOwnProperty.call(cardMemoriesDataPositionObj, category)) {
          const cardMemoriesDataPositionObjNow = cardMemoriesDataPositionObj[category];

          // printC(cardMemoriesDataPositionObjNow, "3", "cardMemoriesDataPositionObjNow", "r")

          if (cardMemoriesDataPositionObjNow.score != null){
            totalScoreCandidate += cardMemoriesDataPositionObjNow.score*cardMemoriesDataPositionObjNow.priority
            totalScoreCandidateCount += cardMemoriesDataPositionObjNow.priority
            printC(category, "F5", "category", "g")
          }

        }
      }

      if (totalScoreCandidateCount >= 0) {
        // printC(totalScoreCandidate, "14", "totalScoreCandidate", "b")
        // printC(totalScoreCandidateCount, "14", "totalScoreCandidateCount", "b")
        totalScoreCandidate = totalScoreCandidate / totalScoreCandidateCount
        // positionData.candidates[indexCandidateOnPosition].scoreCardTotal.score = totalScoreCandidate.toFixed(2)
        positionData.candidates[indexCandidateOnPosition].scoreCardTotal = {
          score: totalScoreCandidate.toFixed(2),
          scoreCardCalculated: true,
        }
        

        // printC(totalScoreCandidate, "15", "totalScoreCandidate", "g")
      } else {
        // positionData.candidates[indexCandidateOnPosition].scoreCardTotal.score = 0

        positionData.candidates[indexCandidateOnPosition].scoreCardTotal = {
          score: 0,
          scoreCardCalculated: true,
        }
        
      }
      // -------------- Total Score of Candidate --------------

      printC(positionData.candidates[indexCandidateOnPosition], "12", "positionData.candidates[indexCandidateOnPosition]", "g")
      // f1
      await positionData.save()


    }
    // return cardMemoriesDataCandidate
    return 
    
  } catch (err) {
    console.log(err.message)
    console.log(err)
    // throw new ApolloError(
    //   err.message,
    //   err.extensions?.code || "calculateScoreCardCandidateToPosition",
    //   { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" }
    // );
  }

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


async function findCardMemories(memoriesPinecone) {

  

  try {

    let memoriesID = []
    let cardMemoriesDataRes = []

    for (let i = 0; i < memoriesPinecone.length; i++) {
      const memoryCard = memoriesPinecone[i];

      // printC(memoryCard, "3", "memoryCard", "p")

      if (memoryCard?.metadata?.mongoID){
        memoriesID.push(memoryCard.metadata)

        cardMemoriesDataRes.push({
          cardMemoryID: memoryCard.metadata.mongoID,
          score: memoryCard.score
        })
      }

    }

    // cardMemoriesData = await CardMemory.find({
    //   _id: { $in: memoriesID },
    // });

    // cardMemoriesDataRes = cardMemoriesData.map((cardMemory) => {
    //   return {
    //     cardMemory: cardMemory,
    //     score: 0.5,
    //   };
    // });

    return cardMemoriesDataRes
    
  } catch (err) {
    console.log("err = ",err)
    throw new ApolloError(
      err.message,
      err.extensions?.code || "createCardsCandidateForPosition",
      { component: "cardMemoryMutation > createCardsCandidateForPosition" }
    );
  }

}

module.exports = {
  addCardMemoryFunc,
  createCardsScoresCandidate,
  createCardsScoresCandidate_2,
  createCardsScoresCandidate_3,
  connectCardsPositionToCandidateAndScore,
  createCardsCandidateForPositionFunc,
  calculateScoreCardCandidateToPositionFunc,
  findCardMemories,
};
