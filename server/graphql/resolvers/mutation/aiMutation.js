require("dotenv").config();
const { AI } = require("../../../models/aiModel");
const { Members } = require("../../../models/membersModel");
const { Position } = require("../../../models/positionModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const { CardMemory } = require("../../../models/cardMemoryModel");

const {
  findOrCreateNewConvFunc,
  findConversationFunc,
} = require("../utils/conversationModules");

const {
  positionSuggestQuestionsAskCandidateFunc,
} = require("../utils/positionModules");

const { talkToEdenMain } = require("../utils/talkToEdenModules");

const { ApolloError } = require("apollo-server-express");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
const math = require("mathjs");
const numeric = require("numeric");
const fs = require("fs");

const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");

const { PineconeClient } = require("@pinecone-database/pinecone");
const fetch = require("node-fetch");

const { request, gql } = require("graphql-request");

const { printC } = require("../../../printModule");
const {
  useGPTchatSimple,
  useGPTchat,
  MessageMapKG_V2APICallF,
  MessageMapKG_V4APICallF,
  findConversationPrompt,
  interviewQuestionCreationUserFunc,
  interviewCreateCVNotesFunc,
  conversationCVPositionToReportFunc,
  reportPassFailCVPositionConversationFunc,
  positionTextAndConvoToReportCriteriaFunc,
  positionTextToExtraQuestionsFunc,
  useWhisperAPI,
} = require("../utils/aiModules");

const {
  addMemoryPineconeFunc,
  deleteMemoriesPineconeFunc,
} = require("../utils/memoryPineconeModules");

const {
  wait,
  findRoleDescriptionAndBenefits,
} = require("../utils/aiExtraModules");

const { addNodesToMemberFunc } = require("../utils/nodeModules");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

globalThis.fetch = fetch;

const configuration = new Configuration({
  apiKey: chooseAPIkey(),
});

console.log("chooseAPIkey = ", chooseAPIkey());
const openai = new OpenAIApi(configuration);

module.exports = {
  addMessage: async (parent, args, context, info) => {
    const { creator, mentioned, message, serverID } = args.fields;
    console.log("Mutation > addMessage > args.fields = ", args.fields);
    try {
      if (!creator)
        throw new ApolloError("The creator of the message is required.");
      if (!mentioned) throw new ApolloError("The mentioned array is required");
      if (!message) throw new ApolloError("The message is required");

      let fields = {
        createdAt: new Date(),
      };

      if (serverID) fields.serverID = serverID;

      fields.message = message;
      fields.creator = creator;
      fields.mentioned = mentioned;

      const newAIData = await new AI(fields);

      newAIData.save();
      console.log("new ai data : ", newAIData);
      return newAIData;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "addMessage", {
        component: "aiMutation > addMessage",
      });
    }
  },
  addMessages: async (parent, args, context, info) => {
    const { data } = args.fields;
    console.log("Mutation > addMessages > args.fields = ", args.fields);
    try {
      if (!data || !data.length || data.length === 0)
        throw new ApolloError("The array of messages is required");
      let validData = [];
      data.forEach((addMessageInputData) => {
        const { creator, mentioned, message } = addMessageInputData;
        let valid = false;
        if (creator && mentioned && message) {
          valid = true;
        }

        if (valid) {
          addMessageInputData.createdAt = new Date();
          validData.push(addMessageInputData);
        }
      });

      if (validData.length === 0)
        throw new ApolloError("The passed data were not valid");

      console.log("valid data ", validData);

      //multiple insert
      const newAIDataArray = await AI.insertMany(validData);
      console.log("new ai data : ", newAIDataArray);
      return newAIDataArray;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addMessages",
        {
          component: "aiMutation > addMessages",
        }
      );
    }
  },
  updateMessage: async (parent, args, context, info) => {
    const { messageID, edenAI } = args.fields;
    console.log("Mutation > updateMessage > args.fields = ", args.fields);
    try {
      if (!messageID) throw new ApolloError("The messageID is required");
      if (!edenAI) throw new ApolloError("The edenAI array is required");

      if (edenAI && edenAI.length === 0)
        throw new ApolloError("The edenAI array length must be greater than 0");

      let aiData = await AI.findOne({ _id: messageID });
      if (!aiData) throw new ApolloError("The message does not exist");

      aiData = await AI.findOneAndUpdate(
        { _id: messageID },
        {
          $set: {
            edenAI: edenAI,
          },
        },

        { new: true }
      ).lean();

      const embeddingData = convertEmbeddingToFloat(aiData.edenAI.keywords);
      aiData.edenAI.keywords = embeddingData;
      return aiData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateMessage",
        {
          component: "aiMutation > updateMessage",
        }
      );
    }
  },
  secondInterviewLetter: async (parent, args, context, info) => {
    let { positionID, userID, message } = args.fields;

    console.log("Mutation > addNodesToPosition > args.fields = ", args.fields);

    if (!positionID) throw new ApolloError("positionID is required");
    if (!userID) throw new ApolloError("userID is required");

    memberData = await Members.findOne({ _id: userID }).select(
      "_id discordName cvInfo"
    );

    if (!memberData) throw new ApolloError("member not found");

    positionData = await Position.findOne({
      _id: positionID,
    });

    if (!positionData) throw new ApolloError("position not found");

    try {
      console.log("member data", memberData);

      cvInfo = "";
      if (memberData?.cvInfo?.cvMemory) {
        cvInfo = memberData?.cvInfo?.cvMemory
          ?.map((memory) => memory.memoryContent)
          .join(" \n\n ");
        console.log("prompt_cv", cvInfo);
      } else {
        cvInfo = memberData?.cvInfo?.cvContent;
        console.log("else", cvInfo);
      }

      let positionRequirements = await positionData.positionsRequirements
        .content;

      // promptInterviewLetter = `

      // Act as an HR Expert. I want you to write a letter to a candidate inviting them to a second interview.

      // For context there will two things: information from the CV and Job requirements.

      // Information from CV (delimiters <>): <${cvInfo}>

      // Job Requirements (delimiters <>): <${positionRequirements}>

      // Now here is the letter that you will customize based on the information above(delimiters ''' '''):

      // '''
      // Dear ${memberData.discordName},

      // We at Eden Protocol Inc. were deeply impressed by your application and interview. <change this part>Your proficiency in team leadership,
      // fueled by your profound drive and enthusiasm for the complexity of the problem space in which we operate<change this part>, resonated
      // deeply with our team ethos. We strongly believe that your distinctive experience and passion align perfectly with our mission.
      // Hence, it is exciting to extend an invitation to you for an in-person interview to expand on your vision and further witness your prowess firsthand.
      // We are keen on furthering this conversation and exploring potential avenues for mutual growth with you.

      // Feel free to pick a time that works for you here:
      // https://calendly.com/tomhusson/30

      // Yours sincerely,
      // Miltiadis Saratzidis

      // '''

      // Your job is to only change the variable part in the letter that is inside the <change this part>Your proficiency in team leadership,
      // fueled by your profound drive and enthusiasm for the complexity of the problem space in which we operate <change this part>. The goal is to make the variable part custom to the
      // candidate. You will use the Information from CV and Job Requirements to write that variable part. Keep the rest of the letter unchanged. Keep it very short & punchy
      // `;

      // letter = await useGPTchatSimple(promptInterviewLetter, 0.7);

      letterSystemPrompt = `Report Candidate CV and Interview (delimiters <>): <${cvInfo.substring(
        0,
        2500
      )}>
      
      Requirements of Job Position (delimiters <>): <${positionRequirements}>

      Name of Candidate (delimiters <>): <${memberData.discordName}>

      COMPANY NAME (delimiters <>): <${positionData.name}>
      
      You're a world-class senior recruiter named Eden
      You are recruiting for ${
        positionData.name
      } and you have all the information about the role given in POSITION REQUIREMENTS
      You communicate very effectively, to the point yet with care & compassion
      You have previously aligned with your hiring manger on the important TRADEOFFS, the most important SKILLS and their top PRIORITIES when it comes to what they’re looking for in a candidate
      You just finished the first interview with the candidate named 'CANDIDATE NAME' and now you're creating a report for the hiring manager.`;

      letterUserPrompt = `You've been asked by the hiring manager to invite the candidate for a second interview with a hiring manager
      - Based on the CV, interview & requirements explain why we're very excited to continue the conversation
      - Be very specific in why we liked the candidate's application
      - Make it short & fun, as a phone message NOT email.
      - Use \n\n whenever needed to be clear message.
      - MAX 2 paragraphs 100 words
      
      Message Inviting the candidate for second interview with hiring manager:`;

      letter = await useGPTchat(letterUserPrompt, [], letterSystemPrompt);

      console.log(letter);

      return {
        generatedLetter: letter,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addNodesToPosition",
        { component: "positionMutation > addNodesToPosition" }
      );
    }
  },
  rejectionLetter: async (parent, args, context, info) => {
    let { positionID, userID, message } = args.fields;

    console.log("Mutation > addNodesToPosition > args.fields = ", args.fields);

    if (!positionID) throw new ApolloError("positionID is required");
    if (!userID) throw new ApolloError("userID is required");

    try {
      memberData = await Members.findOne({ _id: userID }).select(
        "_id discordName cvInfo"
      );

      console.log("member data", memberData);

      cvInfo = "";
      if (memberData?.cvInfo?.cvMemory) {
        cvInfo = memberData?.cvInfo?.cvMemory
          ?.map((memory) => memory.memoryContent)
          .join(" \n\n ");
        console.log("prompt_cv", cvInfo);
      } else {
        cvInfo = memberData?.cvInfo?.cvContent;
        console.log("else", cvInfo);
      }

      positionData = await Position.find({
        _id: positionID,
      });

      positionRequirements = await positionData[0].positionsRequirements
        .content;

      console.log(positionRequirements);

      promptInterviewLetter = `

      Act as an HR Expert. I want you to write a rejection letter to a candidate, and also suggest some areas for improvement(laconically)

      For context there will two things: information from the CV and Job requirements.

      Information from CV (delimiters <>): <${cvInfo}>

      Job Requirements (delimiters <>): <${positionRequirements}>

      Now here is the letter that you will customize based on the information above(delimiters ''' '''):

      '''
      Dear  ${memberData.discordName},

      Thank you for taking the time to participate in our interview process. 
      We certainly appreciated the opportunity to learn more about your capabilities and technical skills. 
      However, after analyzing your profile,  <change this part 1>it was observed that your experience with some of the key technologies(mention the specific names of technologies) in our stack and leadership roles is somewhat limited. 
      For this position, proficiency in these technologies and the ability to guide team members effectively is crucial, and the ability to make sound technical trade-off decisions is of great significance <change this part 1>. 
   
      <change this part 2>We believe that with more experience and exploration, you'll be a capable candidate for similar roles in the future. We highly recommend looking into our sister companies that might have suitable opportunities fitting your current skill set.  <change this part 2> joineden.ai is a great resource where you can find these openings. We wish you the best in your future endeavors and career pursuits.
   
      Kind Regards,
      Miltiadis Saratzidis
      '''

  


    Your job is to only change the variable part in the letter that is inside the <change this part 1> and <change this part 2> . 
    The goal is to make the variable part custom to the candidate. 
    You will use the Information from CV and Job Requirements to write that variable part. 
    
    For <change this part 1>(delimiters) find where there is a mismatch between the CV and  Job Requirements use that as the reason for rejection, be specific.
    For <change this part 2>(delimiters) act as a coach and suggest where the candidate can improve, be specific and more detailed in how the candidate can be better prepared(specific actions that they could take).

    Keep the rest of the letter unchanged. 
    `;

      letter = await useGPTchatSimple(promptInterviewLetter, 0.7);

      console.log(letter);

      return {
        generatedLetter: letter,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addNodesToPosition",
        { component: "positionMutation > addNodesToPosition" }
      );
    }
  },
  storeLongTermMemory: async (parent, args, context, info) => {
    const { messages, userID } = args.fields;
    console.log("Mutation > storeLongTermMemory > args.fields = ", args.fields);
    try {
      // ------------ create string paragraph for prompot --------
      const paragraph = messages.reduce((accumulator, message) => {
        if (message.name)
          return accumulator + message.name + ": " + message.message + " \n ";
        else return accumulator + message.message + " \n ";
      }, "");

      // ------------ create string paragraph for prompot --------

      // console.log("paragraph = " , paragraph)
      // asdf

      prompt =
        "Sumarise this conversation between user and recruiter in order to keep it as a long term memory: \n \n" +
        paragraph;

      summary = await useGPTchatSimple(prompt, 0.7);
      // summary = "The conversation between the user and recruiter was about finding a Designer for the user's position. The desired skills for the designer were the ability to work well in a team, and proficiency in Figma and wireframe design. The user's position is working with a web3 NFT marketplace."

      // embed_summary = await createEmbeddingsGPT(summary);

      // upsertDoc = await upsertEmbedingPineCone({
      //   text: summary,
      //   embedding: embed_summary[0],
      //   _id: userID,
      //   label: "long_term_memory",
      // });

      // console.log("upsertDoc = ", upsertDoc);

      res = await addMemoryPineconeFunc({
        userID: userID,
        label: "long_term_memory",
        memory: summary,
      });

      return {
        summary: summary,
        success: true,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "storeLongTermMemory",
        {
          component: "aiMutation > storeLongTermMemory",
        }
      );
    }
  },
  storeLongTermMemorySummary: async (parent, args, context, info) => {
    const { message, userID } = args.fields;
    console.log("Mutation > storeLongTermMemory > args.fields = ", args.fields);

    if (!userID) {
      throw new ApolloError("userID is required");
    }
    try {
      promptMemory = `I will provide you with a string extracted from a CV (resume), delimited with triple quotes """ """. Your job is to thoroughly scan the whole string and list facts that you find in the string. 
        These facts will be stored in Pinecone to later be retrieved and enhance the interview-like conversation with an AI. 
        I want you to find experiences in the CV and combine them with a description of what was done there + the skills that were associated with that experience. 
        
        Never have a bullet point for skills in the output, do not list skills as a separate category. 
        Do not list experiences, descriptions, or skills separately, only list them in relation to other things. For categories, include job, education(make sure to include the highest level of education(Bachelors < Masters < Ph.D )), project, internship (take your time and make sure that this is not a job, make sure that it is actually an internship), and published article. 
        If an internship was not found, do not include it as an output, just skip it(DO NOT output: (• Internship: None found), just leave it blank), this would apply to any category that was not found in text. 
        Only list categories in the output if you find them in the text. If a category is not found in the text, do not have a output it as a bullet-point.
        
        Follow this strict format (each category should be limited to 200 characters, do not go beyond 200 character limit for each category):
        • Category: name: explanation: skills (limit 6 skills per category, do not go beyond 6 skills per category)
         Example (but do not include these examples in the output, also do not include the label category in the output) Delimiters<>:
          <• Job: Facebook: worked at this position for 1 year focusing on frontend and backend: C++, React, Node.js>
        
        Here is the string to extract the information from: """${message}"""`;

      summaryBulletPoints = await useGPTchatSimple(prompt, 0);

      jobsArr = summaryBulletPoints
        .replace(/\n/g, "")
        .split("•")
        .filter((item) => item.trim() !== "");

      for (let i = 0; i < jobsArr.length; i++) {
        if (jobsArr[i].includes("Skills:")) {
          jobsArr.splice(i, 1);
        }
      }

      console.log("jobsArr", jobsArr);

      const getUpserts = async () => {
        for (let i = 0; i < jobsArr.length; i++) {
          // let embeddings = await createEmbeddingsGPT(jobsArr[i]);
          // console.log("embeddings", embeddings); //
          // upsertSum = await upsertEmbedingPineCone({
          //   text: jobsArr[i],
          //   embedding: embeddings[0],
          //   _id: userID,
          //   label: "CV_user_memory",
          // });
          // console.log("upsertSum=", upsertSum);
          res = await addMemoryPineconeFunc({
            userID: userID,
            label: "CV_user_memory",
            memory: jobsArr[i],
          });
        }
      };

      getUpserts();

      // embed_summary = await createEmbeddingsGPT(summary);

      // let result = [];

      // previousJobs = () => {
      //   for (let i = 0; i < jobsArr.length; i += 2) {
      //     result.push({
      //       job: jobs Arr[i],
      //       description: jobsArr[i + 1],
      //     });
      //   }
      //   return JSON.stringify(result);
      // };
      // upsertDoc = await upsertEmbedingPineCone({
      //   text: summary,
      //   embedding: embed_summary[0],
      //   _id: userID,
      //   label: "long_term_memory",
      // });

      // console.log("upsertDoc = ", upsertDoc);

      return {
        message: summaryBulletPoints,
        success: true,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "storeLongTermMemory",
        {
          component: "aiMutation > storeLongTermMemory",
        }
      );
    }
  },
  websiteToMemoryCompany: async (parent, args, context, info) => {
    const { message, positionID } = args.fields;
    console.log(
      "Mutation > websiteToMemoryCompany > args.fields = ",
      args.fields
    );

    if (!positionID) {
      throw new ApolloError("positionID is required");
    }

    positionData = await Position.findOne({ _id: positionID });

    if (!positionData) {
      throw new ApolloError("Position not found");
    }

    printC(positionData, "0", "positionData", "b");

    stringFromWebsite = message;

    try {
      // //  ------------- Notes ----------------
      // promptConvoQuestions = `
      // POSITION REQUIRMENTS: <${stringFromWebsite}>

      // - you are a recruiter, your task is to create Notes based on POSITION REQUIRMENTS that are Efficient and concise.
      // - the format will be on bullet points
      // - each bullet point can be from 1 to 2 sentenses
      // - you can create as many bullet points as you need

      // Position Notes:
      // `;

      // printC(promptConvoQuestions, "2", "promptConvoQuestions", "p");

      // const promptConvoQuestionsRes = await useGPTchatSimple(
      //   promptConvoQuestions,
      //   0.7,
      //   "API 1"
      // );

      // printC(promptConvoQuestionsRes, "2", "promptConvoQuestionsRes", "p");

      // //  ------------- Notes ----------------

      // // ------------- Report ----------------
      // promptReport = ` You have as input the Details of a Job Position
      // Job Position (delimiters <>): <${stringFromWebsite}>

      // The Recruiter Task is to create a report for the most important categories and subCategories the Candidate should have and will be evaluated!

      // - Every Category can have from  1 to 4 bullet points
      // - To include information in the output you must first find it in text of <Job Position> Do not make up fake information
      // - Include 2-4 categories from Skills, education, Experience, Industry Knowledge, Culture Fit, Communication Skills
      // - You need make really small bullet points maximum 15 words about what the Candidate should have to pass on every Category
      // - Each bullet point will have a UNIQUE ID following this order b1, b2, b3, etc.

      // For example:
      //   <Category 1: title>
      //     - b1: small content max 15 words
      //     - b2: small content max 15 words
      //   <Category 2: title>
      //     - b3: small content max 15 words

      // Answer:`;
      // let report = await useGPTchatSimple(promptReport, 0);

      // // let report = "Category 1: Skills>\n- Experience with databases and SQL\n- Cloud experience, preferably with AWS\n- Programming experience\n- TypeScript experience is a plus\n\n<Category 2: Qualifications>\n- Experience building and maintaining backend systems\n- Experience with infrastructure improvements and scaling\n- Experience troubleshooting production issues and conducting root cause analysis\n- Experience conducting systems tests for security, performance, and availability\n\n<Category 3: Education>\n- No specific education requirements mentioned\n\n<Category 4: Culture Fit>\n- Team player\n- Willingness to work on everything on the backend side\n- Strong communication skills\n- Ability to work in a fast-paced environment\n\n<Category 5: Personality Type>\n- Detail-oriented\n- Problem solver\n- Self-motivated\n- Adaptable\n\n<Category 6: Experience>\n- Experience maintaining and improving infrastructure in AWS\n- Experience maintaining TypeScript SDKs and writing internal and public documentation\n- No specific years of experience mentioned\n- Experience with observability, monitoring, and alerting for services"

      // printC(report, "0", "report", "b");

      // let idCounter = 1;

      // report = report.replace(/(-\s+b\d+:)/g, (match) => {
      //   return match.replace(/\d+/, idCounter++);
      // });

      // printC(report, "1", "report", "g");
      // // ------------- Report ----------------

      let nodeIDs;
      // // ---------------------- Map Nodes from Position text ---------------------
      // promptReportToMapSkills = `I give you a string extracted from a Job Position. Your task is to extract as much information as possible from that Job Position and list all the skills that person need to have to get hired for this position in a small paragraph.
      //       dont need to have complete sentences. Make it as dense as possible with just listing the skills, industries, technologies.
      //       Do not have any other words except for skills.

      //       Example output (delimiters <>): Skills: <Skill_1, Skill_2, ...>

      //       Job Position (delimiters <>): <${stringFromWebsite}>

      //       Skills Result:
      //       `;

      // let mapSkillText = await useGPTchatSimple(promptReportToMapSkills, 0);
      // // let mapSkillText = `Experience with databases and SQL, Cloud experience (preferably with AWS), Programming experience, TypeScript experience, Experience building and maintaining backend systems, Experience with infrastructure improvements and scaling, Experience troubleshooting production issues and conducting root cause analysis, Experience conducting systems tests for security, performance, and availability, Team player, Strong communication skills, Ability to work in a fast-paced environment, Detail-oriented, Problem solver, Self-motivated, Adaptable, Experience maintaining and improving infrastructure in AWS, Experience maintaining TypeScript SDKs and writing internal and public documentation, Experience with observability, monitoring, and alerting for services.`
      // printC(mapSkillText, "1", "mapSkillText", "g");

      // nodeIDs;
      // try {
      //   let nodesN = await MessageMapKG_V4APICallF(mapSkillText);
      //   printC(nodesN, "3", "nodesN", "p");

      //   nodeSave = nodesN.map((obj) => {
      //     return {
      //       _id: obj.nodeID,
      //     };
      //   });
      //   nodeIDs = nodeSave.map((obj) => {
      //     return {
      //       nodeID: obj._id,
      //     };
      //   });

      //   printC(nodeSave, "4", "nodeSave", "r");
      // } catch (err) {
      //   console.log("didn't create nodes = ");
      // }
      // // ---------------------- Map Nodes from Position text ---------------------

      // This is for GPT3 -> don't need it on GPT4
      // // --------------- positionText to Questions ---------------
      questionData = [
        {
          questionID: "6478a3df3bbea5508ea72af7",
          content:
            "What are your companys overall business goals and how does your hiring process align with them?",
        },
        {
          questionID: "6478a4183bbea5508ea72af9",
          content:
            "What specific roles are you looking to fill and what are the job responsibilities for each?",
        },
        {
          questionID: "6478a4753bbea5508ea72afb",
          content:
            "What are the key skills, qualifications, and attributes you're looking for in a candidate?",
        },
        {
          questionID: "6478a49f3bbea5508ea72afd",
          content:
            "What is the preferred timeline for filling these positions, and are there any deadlines or milestones we should be aware of?",
        },
      ];

      // const interviewQuestionsForCandidate =
      //   await positionTextToExtraQuestionsFunc(
      //     questionData,
      //     stringFromWebsite,
      //     positionID
      //   );
      // // --------------- positionText to Questions ---------------

      // if (nodeIDs) {
      //   positionData.nodes = nodeIDs;
      // }
      // positionData.interviewQuestionsForPosition =
      //   interviewQuestionsForCandidate;
      positionData.positionsRequirements.originalContent = stringFromWebsite;
      positionData.positionsRequirements.positionPreparationMemory = false;

      // let positionsRequirements = {
      //   ...positionData.positionsRequirements,
      //   notesRequirConv: promptConvoQuestionsRes,
      // };
      let positionsRequirements = {
        ...positionData.positionsRequirements,
        notesRequirConv: stringFromWebsite,
        content: stringFromWebsite,
      };

      positionData.positionsRequirements = positionsRequirements;

      // update Mongo
      await positionData.save();

      // findRoleDescriptionAndBenefits(message, positionData);

      // return {
      //   report: report,
      //   success: true,
      //   interviewQuestionsForPosition: interviewQuestionsForCandidate,
      // };
      return {
        report: stringFromWebsite,
        success: true,
        interviewQuestionsForPosition: questionData,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "websiteToMemoryCompany",
        {
          component: "aiMutation > websiteToMemoryCompany",
        }
      );
    }
  },
  positionTextToExtraQuestions: async (parent, args, context, info) => {
    const { positionText, positionID } = args.fields;
    console.log(
      "Mutation > positionTextToExtraQuestions > args.fields = ",
      args.fields
    );

    questionData = [
      {
        questionID: "6478a3df3bbea5508ea72af7",
        content:
          "What are your companys overall business goals and how does your hiring process align with them?",
      },
      {
        questionID: "6478a4183bbea5508ea72af9",
        content:
          "What specific roles are you looking to fill and what are the job responsibilities for each?",
      },
      {
        questionID: "6478a4753bbea5508ea72afb",
        content:
          "What are the key skills, qualifications, and attributes you're looking for in a candidate?",
      },
      {
        questionID: "6478a49f3bbea5508ea72afd",
        content:
          "What is the preferred timeline for filling these positions, and are there any deadlines or milestones we should be aware of?",
      },
    ];

    try {
      const interviewQuestionsForCandidate =
        await positionTextToExtraQuestionsFunc(
          questionData,
          positionText,
          positionID
        );

      printC(
        interviewQuestionsForCandidate,
        "3",
        "interviewQuestionsForCandidate",
        "r"
      );

      sd0;

      positionData.interviewQuestionsForPosition =
        interviewQuestionsForCandidate;

      await positionData.save();

      return {
        success: true,
        questions: interviewQuestionsForCandidate,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "positionTextToExtraQuestions",
        {
          component: "aiMutation > positionTextToExtraQuestions",
        }
      );
    }
  },

  conversationCVPositionToReport: async (parent, args, context, info) => {
    const { memberID, positionID } = args.fields;
    console.log(
      "Mutation > conversationCVPositionToReport > args.fields = ",
      args.fields
    );

    try {
      // const res = await conversationCVPositionToReportFunc(memberID, positionID)
      const res = await reportPassFailCVPositionConversationFunc(
        memberID,
        positionID
      );

      report = res.report;
      categoriesT = res.categoriesT;
      scoreAll = res.scoreAll;

      return {
        report: report,
        success: true,
        CV_ConvoToPosition: categoriesT,
        CV_ConvoToPositionAverageScore: scoreAll,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "conversationCVPositionToReport",
        {
          component: "aiMutation > conversationCVPositionToReport",
        }
      );
    }
  },

  positionTextAndConvoToReportCriteria: async (parent, args, context, info) => {
    const { positionID, updatedReport } = args.fields;
    console.log(
      "Mutation > positionTextAndConvoToReportCriteria > args.fields = ",
      args.fields
    );

    if (!positionID) {
      throw new ApolloError("positionID is required");
    }

    positionData = await Position.findOne({ _id: positionID }).select(
      "_id positionsRequirements"
    );

    if (!positionData) {
      throw new ApolloError("Position not found");
    }

    let report;

    try {
      if (positionData.positionsRequirements?.content && !updatedReport) {
        return {
          success: true,
          report: positionData.positionsRequirements?.content,
        };
      }

      // console.log("change = " , change)

      // --------------- Report ---------
      if (!updatedReport) {
        report = await positionTextAndConvoToReportCriteriaFunc(positionID);

        console.log("report = ", report);

        positionData.positionsRequirements.content = report;
      } else {
        positionData.positionsRequirements.content = updatedReport;
        report = updatedReport;
      }
      // --------------- Report ---------

      await positionData.save();

      // sdf0

      return {
        success: true,
        report: report,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "positionTextAndConvoToReportCriteria",
        {
          component: "aiMutation > positionTextAndConvoToReportCriteria",
        }
      );
    }
  },

  positionSuggestQuestionsAskCandidate: async (parent, args, context, info) => {
    const { positionID } = args.fields;
    console.log(
      "Mutation > positionSuggestQuestionsAskCandidate > args.fields = ",
      args.fields
    );

    res = await positionSuggestQuestionsAskCandidateFunc(args.fields);

    return {
      success: true,
      questionSuggest: res.questionSuggest,
    };
  },

  saveCVtoUser: async (parent, args, context, info) => {
    const { cvContent, cvFilename, userID, positionID } = args.fields;
    // console.log("Mutation > saveCVtoUser > args.fields = ", args.fields);

    if (!userID) {
      throw new ApolloError("userID is required");
    }

    let userData = await Members.findOne({ _id: userID });

    let positionData = await Position.findOne({ _id: positionID }).select(
      "_id candidates positionsRequirements"
    );

    if (!positionData) {
      throw new ApolloError("Position not found");
    }

    let positionRequirementsC = positionData.positionsRequirements.content;

    if (!positionRequirementsC) {
      positionRequirementsC =
        positionData.positionsRequirements.notesRequirConv;
    }

    if (!positionRequirementsC) {
      positionRequirementsC =
        positionData.positionsRequirements.originalContent;
    }

    if (!positionRequirementsC) {
      throw new ApolloError(
        "Position Requirements not found, the problem might be: 1. this position is not ready 2. This position is corrupted - Please talk to the creator of the position"
      );
    }
    // printC(positionRequirementsC,"3","positionRequirementsC","b")
    // sdf9s

    if (!userData) {
      throw new ApolloError("User not found");
    }
    try {
      userData = await Members.findOneAndUpdate(
        { _id: userID },
        {
          cvInfo: {
            ...userData.cvInfo,
            cvContent: cvContent,
            cvFilename: cvFilename,
            cvPreparationDone: false,
            cvPreparationBio: false,
            cvPreparationNodes: false,
            cvPreparationPreviousProjects: false,
            cvPreparationMemory: false,
          },
        },
        { new: true }
      );

      // ----------------- add candidate to position -----------------
      let index_ = positionData.candidates.findIndex(
        (x) => x.userID.toString() == userID.toString()
      );

      if (index_ == -1) {
        positionData.candidates.push({
          userID: userID,
          candidateScoreCardCalculated: false,
          dateApply: new Date(),
        });

        positionData.allCandidateScoreCardCalculated = false;

        await positionData.save();
      } else {
        positionData.candidates[index_].dateApply = new Date();
        positionData.candidates[index_].candidateScoreCardCalculated = false;

        positionData.allCandidateScoreCardCalculated = false;

        await positionData.save();

        console.log(
          "positionData.candidates[index_] = ",
          positionData.candidates[index_]
        );
      }
      // ----------------- add candidate to position -----------------

      // ----------- CV to Summary -------------
      let cvContentPrompt = `
        CV CANDIDATE (delimiters <>): <${cvContent.substring(0, 3500)}>

        JOB REQUIREMENTS (delimiters <>): <${positionRequirementsC.substring(
          0,
          3500
        )}>

        - You are a recruiter with task to understand the the Fit between a candidate's CV and Job Requirments
        - talk in "second person" like you are a recruiter and you are selling the position to the candidat

        1. persentage:  Percentage of match from 0 to 100
        2. skills: Main Skills CV CANDIDATE , 7 skills Max
        3. strengths: Were CV CANDIDATE has Strong Fit for  JOB REQUIREMENTS, 2 sentence Max
        4. weaknesses: Were the CV CANDIDATE can Improve for this  JOB REQUIREMENTS, 2 sentence Max
        5. growth: Were the CANDIDATE will Grow being in this JOB, 2 sentence Max
        6. improve: Were the Candidate will Improve the Professional Experience in this JOB, 2 sentence Max

        1. persentage:
        2. skills:
        3. strengths:
        4. weaknesses:
        5. growth:
        6. improve:
      `;
      printC(cvContentPrompt, "3", "cvContentPrompt", "b");

      titleSkillSummaryRes = await useGPTchatSimple(
        cvContentPrompt,
        0,
        "API 1",
        "chatGPT4"
      );

      // titleSkillSummaryRes = `1. Percentage: 70%
      // 2. Skills: Machine Learning, Deep Learning, Natural Language Processing (NLP), MLOps, Computer Vision, Voice Recognition, SQL
      // 3. Strengths: Your extensive experience in machine learning and deep learning, as well as your leadership role in managing a team of engineers, aligns well with the job requirements. Your proficiency in SQL and experience in data-driven product development are also valuable assets.
      // 4. Weaknesses: While your technical skills are impressive, the job requires experience in product management of ML-driven products, which is not evident in your CV. Additionally, fluency in French is required for this role, which is not mentioned in your language skills.
      // 5. Growth: This role offers an opportunity to expand your skills in product management, a critical aspect of ML-driven products. You will also have the chance to work in a multicultural environment, enhancing your language skills and cultural competence.
      // 6. Improve: In this role, you will be able to apply your technical skills to real-world problems, improving your ability to translate complex data into actionable business strategies. You will also gain experience in lean startup methodologies and processes, which will enhance your overall understanding of product development.`

      // t
      printC(titleSkillSummaryRes, "3", "titleSkillSummaryRes", "b");

      lines = titleSkillSummaryRes.split("\n");
      const extractedText = lines.map((line) => line.split(":")[1].trim());
      console.log(extractedText);

      const matchPercentage = extractedText[0].replace("%", "");
      console.log("Match Percentage:", matchPercentage);
      const strongFit = extractedText[2];
      console.log("Strong Fit:", strongFit);
      const improvementPoints = extractedText[3];
      console.log("Areas to Improve:", improvementPoints);
      const growthAreas = extractedText[4];
      console.log("Growth Opportunities:", growthAreas);
      const experienceAreas = extractedText[5];
      console.log("Experience Improvement:", experienceAreas);

      const mainSkills = extractedText[1].split(", ");

      console.log("Main Skills:", mainSkills);
      printC(extractedText, "3", "extractedText", "b");

      // ----------- CV to Summary -------------

      // interviewQuestionCreationUserFunc(positionID, userID, cvContent); // GPT3 Interview
      // sdf00

      interviewCreateCVNotesFunc(userData, cvContent); // GPT4 Interview

      // await wait(5000);

      //publish the userID of the saved cv
      pubsub.publish("USER_CV_SAVED", {
        userCVSavedToDB: { userID, cvContent },
      });
      return {
        success: true,
        // titleRole: titleRole,
        mainSkills: mainSkills,
        // cvSummary: cvSummary,
        matchPercentage: matchPercentage,
        strongFit: strongFit,
        improvementPoints: improvementPoints,
        growthAreas: growthAreas,
        experienceAreas: experienceAreas,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "saveCVtoUser",
        {
          component: "aiMutation > saveCVtoUser",
        }
      );
    }
  },
  autoUpdateUserInfoFromCV: async (parent, args, context, info) => {
    const { userIDs } = args.fields;
    console.log(
      "Mutation > autoUpdateUserInfoFromCV > args.fields = ",
      args.fields
    );

    try {
      if (userIDs)
        usersData = await Members.find({
          _id: userIDs,
          // "cvInfo.cvPreparationDone": { $ne: true },
          // "cvInfo.cvContent": { $ne: null },
        });
      else {
        usersData = await Members.find({
          "cvInfo.cvPreparationDone": { $ne: true },
          "cvInfo.cvContent": { $ne: null },
        });
      }

      for (let i = 0; i < usersData.length; i++) {
        // if (usersData.length > 0) {
        // SOS 🆘 delete - only test one user at a time
        let i = 0; // SOS 🆘 delete
        let userData = usersData[i];
        let cvContent = userData.cvInfo.cvContent;

        // ------- Calculate Summary -------
        // if (userData.cvInfo.cvPreparationBio != true) {

        // promptSum =
        //   `Act as social media expert at wring profile bios. I will give you a string extracted from a CV(resume) and your job is to write a short bio for that profile. Here is the structure of the bio:

        //   Pick the most impressive achievements(highest education and the most recent position in the CV) and list them in 2 bullet points(no more than 2).

        //   Follow this structure 2 parts. First part is 1 sentences. Sencond part is two bullet points with 18 words MAX each.

        //   Part 1(do not include Part 1 in the response):
        //   1 sentences (Opening line: Introduce yourself and your expertise)

        //   Part 2(do not include Part 2 in the response):
        //    - The present position that they work in and what they do there
        //    - Highest level of education(list only the highest education and only list that one)

        //    CV: <${cvContent}>

        //    Structured Profile:`

        promptSum =
          `I want you to act as social media expert at wring profile bios. I will give you a string extracted from a CV(resume) deliniated with tripple quotes(""" """) and your job is to write a short bio for that profile. Here is the structure of the bio: \n\n\nPick the most impressive achievements(highest education and the most recent position in the CV) and list them in 2 bullet points with MAX 15 words each (no more than 2).\n\n\nFollow this structure 2 parts. First part is 2 small sentences. Sencond part is two bullet points \n\nPart 1(do not include Part 1 in the response): \n2 small sentences (Opening line: Introduce yourself and your expertise)\n\nPart 2(do not include Part 2 in the response):\n •Highest level of education(list only the highest education and only list that one)\n •The present position that they work in and what they do there \n\n\n\n` +
          cvContent;

        summaryOfCV = await useGPTchatSimple(promptSum);

        summaryOfCV = summaryOfCV.replace("Part 1:", "");
        summaryOfCV = summaryOfCV.replace("Part 2:", "");
        summaryOfCV = summaryOfCV.replace("Part 1", "");
        summaryOfCV = summaryOfCV.replace("Part 2", "");

        printC(summaryOfCV, "0", "summaryOfCV", "b");

        oneLinerPrompt = `
        Your task is to create a 1 liner for a candidate that explain perfectly who he is in only 8 MAX words

        CV: <${cvContent}>

        1 liner in 8 MAX words:
        `;

        oneLiner = await useGPTchatSimple(oneLinerPrompt);

        printC(oneLiner, "0", "oneLinerGPT", "b");

        userData.bio = summaryOfCV;
        userData.oneLiner = oneLiner;

        userData.cvInfo.cvPreparationBio = true;
        // }
        // ------- Calculate Summary -------

        // -------Calculate Previous Jobs -------
        if (userData.cvInfo.cvPreparationPreviousProjects != true) {
          promptJobs = `
          Act as resume career expert. I will provide you a string extracted from a PDF which was a CV(resume).
    
          CV(resume), (delimiters <>: <${cvContent}>
    
    
          Your job is to find and list the latest 1-3 this person had. Give me those jobs in a array of objects format,do not include the name in the summary. 
          
          - Only give me up to 3 last jobs. The job that is current (some year - present) should appear first. After that list jobs that have the latest end date.
          - Give me a dates of when this person started and finished( or presently working). This concludes the first bullet point. 
          - Always use "•" for a bullet point, never this "-". 
    
          This is the format: 

          [
            {
              "title": "Job Title, Company Name",
              "description": "start date, end date(or present)   • short description  • short description • short description"
                            
            }
          ]
    
         `;

          responseFromGPT = await useGPTchatSimple(promptJobs, 0.05);
          console.log("responseFromGPT = ", responseFromGPT);

          let modifiedResult = await responseFromGPT.replace(/\\n|\n/g, "");

          printC("modifiedResult", modifiedResult);

          result = JSON.parse(modifiedResult);

          userData.previousProjects = result;

          userData.cvInfo.cvPreparationPreviousProjects = true;
        }
        // -------Calculate Previous Jobs -------

        // -------------- Map Nodes from CV--------------
        if (userData.cvInfo.cvPreparationNodes != true) {
          // if (true) {

          promptCVtoMap = `I give you a string extracted from a CV(resume) PDF. Your job is to extract as much information as possible from that CV and list all the skills that person has CV in a small paragraph. 
            Keep the paragrpah small and you dont need to have complete sentences. Make it as dense as possible with just listing the skills.
            Do not have any other words except for skills. 

            Exaple output (delimiters <>): Skills: <Skill_1, Skill_2, ...>
            
            CV Content (delimiters <>): <${cvContent.substring(0, 3500)}>

            Skills Result:
            `;

          printC(promptCVtoMap, "3", "promptCVtoMap", "b");

          textForMapping = await useGPTchatSimple(promptCVtoMap, 0);

          printC(textForMapping, "3", "textForMapping", "b");
          // sdf00

          let nodesN;
          try {
            nodesN = await MessageMapKG_V4APICallF(textForMapping);
          } catch (err) {
            console.log("Map Nodes err = ", err);
          }

          printC(nodesN, "3", "nodesN", "b");

          nodeSave = nodesN.map((obj) => {
            return {
              _id: obj.nodeID,
            };
          });

          nodeIDs = nodeSave.map((obj) => obj._id);

          await addNodesToMemberFunc(userData._id, nodeIDs);

          printC(nodeSave, "3", "nodeSave", "r");

          userData.cvInfo.cvPreparationNodes = true;
        }
        // -------------- Map Nodes from CV--------------

        userData.cvInfo.cvPreparationDone = true;

        await userData.save();
      }

      return {
        users: usersData,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "autoUpdateUserInfoFromCV",
        {
          component: "aiMutation > autoUpdateUserInfoFromCV",
        }
      );
    }
  },
  autoUpdateMemoryFromCV: async (parent, args, context, info) => {
    const { userIDs } = args.fields;
    console.log(
      "Mutation > autoUpdateMemoryFromCV > args.fields = ",
      args.fields
    );

    try {
      if (userIDs)
        usersData = await Members.find({
          _id: userIDs,
          // "cvInfo.cvPreparationMemory": { $ne: true },
          // "cvInfo.cvContent": { $ne: null },
        });
      else {
        usersData = await Members.find({
          "cvInfo.cvPreparationMemory": { $ne: true },
          "cvInfo.cvContent": { $ne: null },
        });
      }

      for (let i = 0; i < usersData.length; i++) {
        // let i = 0; // SOS 🆘 delete
        let userData = usersData[i];
        let cvContent = userData.cvInfo.cvContent;

        console.log("change = ");

        // ----------- Calculate and Save Memory ------------
        if (userData.cvInfo.cvPreparationMemory != true) {
          // ------------ Delete previous memory ------------
          // if (userData.cvInfo?.cvMemory?.length > 0) {
          //   deletePineIDs = userData.cvInfo.cvMemory.map(
          //     (obj) => obj.pineConeID
          //   );
          //   await deletePineCone(deletePineIDs);
          // }
          let filter = {
            userID: userData._id,
            label: "CV_user_memory",
          };
          res = await deleteMemoriesPineconeFunc(filter);
          // ------------ Delete previous memory ------------

          promptMemory = `I will provide you with a string extracted from a CV (resume), delimited with triple quotes """ """. Your job is to thoroughly scan the whole string and list facts that you find in the string. 
        These facts will be stored in Pinecone to later be retrieved and enhance the interview-like conversation with an AI. 
        I want you to find experiences in the CV and combine them with a description of what was done there + the skills that were associated with that experience. 
        
        Never have a bullet point for skills in the output, do not list skills as a separate category. 
        Do not list experiences, descriptions, or skills separately, only list them in relation to other things. 
        For categories, include job, education(make sure to include the highest level of education(Bachelors < Masters < Ph.D )), project, internship (take your time and make sure that this is not a job, make sure that it is actually an internship), and published article. 
        If an internship was not found, do not include it as an output, just skip it(DO NOT output: (• Internship: None found), just leave it blank), this would apply to any category that was not found in text. 
        Only list categories in the output if you find them in the text. If a category is not found in the text, do not have a output it as a bullet-point.
        
        Follow this strict format (each category should be limited to 200 characters, do not go beyond 200 character limit for each category):
        • Category: name: explanation: skills (limit 6 skills per category, do not go beyond 6 skills per category)
         Example (but do not include these examples in the output, also do not include the label category in the output) Delimiters<>:
          <• Job: Facebook: worked at this position for 1 year focusing on frontend and backend: C++, React, Node.js>
        
        Here is the string to extract the information from: """${cvContent}"""`;

          summaryBulletPoints = await useGPTchatSimple(
            promptMemory,
            0,
            "API 2"
          );

          jobsArr = summaryBulletPoints
            .replace(/\n/g, "")
            .split("•")
            .filter((item) => item.trim() !== "");

          //occasionally gpt outputs skills as a separate problem, the for loop gets rid of those skills in case they do appear
          for (let i = 0; i < jobsArr.length; i++) {
            if (jobsArr[i].includes("Skills:")) {
              jobsArr.splice(i, 1);
            }
          }

          printC(jobsArr, "1", "jobsArr", "g");
          // sks0

          sumBulletSplit = jobsArr;

          let cvMemory = [];

          let upsertSum, embeddings;

          for (let i = 0; i < sumBulletSplit.length; i++) {
            // -------------- Sent to PineCone --------------
            // let embeddings = await createEmbeddingsGPT(sumBulletSplit[i]);

            // upsertSum = await upsertEmbedingPineCone({
            //   text: sumBulletSplit[i],
            //   embedding: embeddings[0],
            //   _id: userData._id,
            //   label: "CV_user_memory",
            // });
            // let maxAttempts = 3;
            // let numAttempts = 0;
            // let success = false;

            // while (numAttempts < maxAttempts && !success) {
            //   try {
            //     embeddings = await createEmbeddingsGPT(sumBulletSplit[i]);

            //     upsertSum = await upsertEmbedingPineCone({
            //       text: sumBulletSplit[i],
            //       embedding: embeddings[0],
            //       _id: userData._id,
            //       label: "CV_user_memory",
            //     });

            //     success = true;
            //   } catch (error) {
            //     console.error(error);
            //     numAttempts++;
            //   }
            // }

            res = await addMemoryPineconeFunc({
              userID: userData._id,
              label: "CV_user_memory",
              memory: sumBulletSplit[i],
            });

            printC(res, "2", "res", "y");
            // -------------- Sent to PineCone --------------

            cvMemory.push({
              memoryContent: sumBulletSplit[i],
              pineConeID: res?.memoryData?.id_message,
            });

            printC(sumBulletSplit[i], "2", "sumBulletSplit[i]", "p");
          }

          userData.cvInfo.cvMemory = cvMemory;

          userData.cvInfo.cvPreparationMemory = true;
        }
        // ----------- Calculate and Save Memory ------------

        await userData.save();
      }

      return {
        users: usersData,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "autoUpdateMemoryFromCV",
        {
          component: "aiMutation > autoUpdateMemoryFromCV",
        }
      );
    }
  },
  talkToEdenGeneral_V1: async (parent, args, context, info) => {
    //--------- variables ---------
    const { message, infoConv } = args.fields;
    console.log(
      "Mutation > talkToEdenGeneral_V1 > args.fields = ",
      args.fields
    );

    let conversationID;
    if (infoConv) {
      ({ conversationID } = infoConv);
    } else {
      throw new ApolloError("infoConv and conversationID are required");
    }
    //--------- variables ---------

    try {
      // ------- find the conversation  ---------
      let convData = await findConversationFunc({ _id: conversationID });
      // ------- find the conversation  ---------

      // ------- Prepare conversation, Summarize if too long, and use the summary to shorten it. ------
      // ------- Prepare conversation, Summarize if too long, and use the summary to shorten it.------

      // -------- Based on the Type of convData decide what AI to use --------
      let resTalkToEden = await talkToEdenMain({
        message,
        convData,
      });
      // --------- Inside the AIs decide what version of this AI --------
      // ------- 1. check the state
      // ------- 2. check if there is any action
      // ------- 3. check the type of the conversation
      // ------- 4. based on that decide what functions will be used on the GPT
      // ------- 5. use the function response to decide what function to run
      // ------- 6. run the function (collect memories, collect users, collect data from database)
      // ------- 7. use response on the GPT, and collect the results of the function
      // ------- 8. return back the message of the GPT
      // ------- 9. return back the data and the choice of widget that happen during the GPT function phase
      // --------- Inside the AIs decide what version of this AI --------
      // -------- Based on the Type of convData decide what AI to use --------

      // --------- Return back the results to user ------
      // -- from 8. and 9.
      // --------- Return back the results to user ------
    } catch (err) {
      printC(err, "-1", "err", "r");
      throw new ApolloError(
        err.message,
        err.extensions?.code || "talkToEdenGeneral_V1",
        {
          component: "aiMutation > talkToEdenGeneral_V1",
        }
      );
    }
  },
  updatePrioritiesTradeOffs: async (parent, args, context, info) => {
    const { positionID, priorities, tradeOffs } = args.fields;
    console.log(
      "Mutation > updatePrioritiesTradeOffs > args.fields = ",
      args.fields
    );

    // find the positionID
    positionData = await Position.findOne({
      _id: positionID,
    }).select("_id name positionsRequirements");

    if (!positionData) {
      throw new ApolloError("Position not found", "POSITION_NOT_FOUND");
    }

    try {
      // // ---------------- Priorities ----------------
      // let prioritiesNow = positionData.positionsRequirements.priorities;
      // console.log("prioritiesNow = " , prioritiesNow)

      // if (prioritiesNow?.length > 0 && priorities?.length > 0){

      //   let prioritiesNowObj = {};
      //   for (let i = 0; i < prioritiesNow.length; i++) {
      //     prioritiesNowObj[prioritiesNow[i].priority] = prioritiesNow[i];
      //   }

      //   let prioritiesNew = []
      //   for (let i = 0; i < priorities.length; i++) {
      //     prioritiesNew.push(prioritiesNowObj[priorities[i].priority])
      //   }

      //   console.log("prioritiesNew = " , prioritiesNew)

      //   positionData.positionsRequirements.priorities = prioritiesNew;

      // } else {
      //   positionData.positionsRequirements.priorities = priorities;
      // }
      // // ---------------- Priorities ----------------

      // ---------------- Trade Offs ----------------
      let tradeOffsNow = positionData.positionsRequirements.tradeOffs;

      if (tradeOffsNow?.length > 0 && tradeOffs?.length > 0) {
        let tradeOffsObj = {};
        for (let i = 0; i < tradeOffs.length; i++) {
          key = tradeOffs[i].tradeOff1 + "_" + tradeOffs[i].tradeOff2;
          tradeOffsObj[key] = tradeOffs[i];
        }

        let tradeOffsNew = [];
        for (let i = 0; i < tradeOffsNow.length; i++) {
          key = tradeOffsNow[i].tradeOff1 + "_" + tradeOffsNow[i].tradeOff2;
          if (tradeOffsObj[key]) {
            // tradeOffsNew.push(tradeOffsObj[key])
            tradeOffsNew.push({
              tradeOff1: tradeOffsObj[key].tradeOff1,
              tradeOff2: tradeOffsObj[key].tradeOff2,
              reason: tradeOffsNow[i].reason,
              selected: tradeOffsObj[key].selected,
            });
            // tradeOffsNew.push(tradeOffsNow[i])
          } else {
            tradeOffsNew.push(tradeOffsNow[i]);
          }
        }

        positionData.positionsRequirements.tradeOffs = tradeOffsNew;
      }
      // ---------------- Trade Offs ----------------

      await positionData.save();

      return {
        priorities: positionData.positionsRequirements.priorities,
        tradeOffs: positionData.positionsRequirements.tradeOffs,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updatePrioritiesTradeOffs",
        {
          component: "aiMutation > updatePrioritiesTradeOffs",
        }
      );
    }
  },
  createCoreMemories: async (parent, args, context, info) => {
    const { positionID, userID, coreMemories } = args.fields;
    console.log("Mutation > createCoreMemories > args.fields = ", args.fields);

    let totalCoreMemory = "";

    try {
      if (positionID && userID) {
        throw new ApolloError("positionID OR userID are required, not both");
      }

      if (!positionID && !userID) {
        throw new ApolloError("positionID OR userID are required");
      }

      let userData, positionData, cardMemoriesData;

      if (positionID) {
        positionData = await Position.findOne({
          _id: positionID,
        }).select("_id name memory positionsRequirements");

        printC(positionData, "1", "positionData", "b");

        f1;

        // ------------- Get tradeOffs and priorities -------------
        const tradeOffs = positionData.positionsRequirements.tradeOffs;
        const priorities = positionData.positionsRequirements.priorities;

        let tradeOffsPrompt = "Tradeoffs for this Position delimited || : |";
        for (let i = 0; i < tradeOffs.length; i++) {
          const tradeOff = tradeOffs[i];
          if (tradeOff.selected == tradeOff.tradeOff1)
            tradeOffsPrompt =
              tradeOffsPrompt +
              "- Choose '" +
              tradeOff.tradeOff1 +
              "' Over '" +
              tradeOff.tradeOff2 +
              "'\n";
          else
            tradeOffsPrompt =
              tradeOffsPrompt +
              "- Choose '" +
              tradeOff.tradeOff2 +
              "' Over '" +
              tradeOff.tradeOff1 +
              "'\n";
        }

        tradeOffsPrompt = tradeOffsPrompt + "|";
        printC(tradeOffsPrompt, "2", "tradeOffsPrompt", "y");

        totalCoreMemory = totalCoreMemory + tradeOffsPrompt + "\n\n";

        let prioritiesPrompt = "Priorities for this Position delimited || : |";
        for (let i = 0; i < priorities.length; i++) {
          const priority = priorities[i];
          prioritiesPrompt =
            prioritiesPrompt + (i + 1) + ". " + priority.priority + "\n";
        }

        prioritiesPrompt = prioritiesPrompt + "|";
        printC(prioritiesPrompt, "2", "prioritiesPrompt", "y");

        totalCoreMemory = totalCoreMemory + prioritiesPrompt + "\n\n";
        // ------------- Get tradeOffs and priorities -------------

        if (coreMemories) {
          positionData.memory = {
            ...positionData.memory,
            core: coreMemories,
          };

          await positionData.save();

          return;
        } else {
          cardMemoriesData = await CardMemory.find({
            "authorCard.positionID": positionID,
          });
        }
      }

      if (userID) {
        userData = await Members.findOne({
          _id: userID,
        }).select("_id discordName memory");

        printC(userData, "1", "userData", "b");

        if (coreMemories) {
          userData.memory = {
            ...userData.memory,
            core: coreMemories,
          };

          await userData.save();

          return;
        } else {
          cardMemoriesData = await CardMemory.find({
            "authorCard.userID": userID,
          });
        }
      }

      // f1

      promptMemories = `All Memories delimited ||: |`;

      for (let i = 0; i < cardMemoriesData.length; i++) {
        let cardMemory = cardMemoriesData[i];

        promptMemories += `${cardMemory.content} \n\n`;
      }

      promptMemories += "|";

      const MAX_WORDS = 100;

      promptMemories += ` \n
      -  Based on this memories create a summary of the Bullet Point CORE Memories, 
      - It should only have the most important information of this memories
      - It should only have maximum ${MAX_WORDS} words
      - it should look like small parts of memory, with a small sentence then \n

      Example: 
      - .....
      - .....

      Bullet Point Core Memories: 
      `;

      printC(promptMemories, "1", "promptMemories", "b");

      summaryBulletPoints = await useGPTchatSimple(promptMemories, 0, "API 2");

      printC(summaryBulletPoints, "1", "summaryBulletPoints", "g");

      if (userData != null) {
        totalCoreMemory = totalCoreMemory + summaryBulletPoints;

        userData.memory = {
          ...userData.memory,
          core: summaryBulletPoints,
        };

        await userData.save();
      } else if (positionData != null) {
        totalCoreMemory =
          totalCoreMemory + `Memories delimited ||: |${summaryBulletPoints}|`;

        positionData.memory = {
          ...positionData.memory,
          core: totalCoreMemory,
        };

        await positionData.save();
      }

      return {
        output: totalCoreMemory,
      };
    } catch (err) {
      console.log("err = ", err);
      // throw new ApolloError(
      //   err.message,
      //   err.extensions?.code || "createCoreMemories",
      //   {
      //     component: "aiMutation > createCoreMemories",
      //   }
      // );
    }
  },
  autoUpdateMemoryFromPositionRequirments: async (
    parent,
    args,
    context,
    info
  ) => {
    const { positionIDs } = args.fields;
    console.log(
      "Mutation > autoUpdateMemoryFromPositionRequirments > args.fields = ",
      args.fields
    );

    try {
      if (positionIDs)
        positionsData = await Position.find({
          _id: positionIDs,
          // "cvInfo.cvPreparationMemory": { $ne: true },
          // "cvInfo.cvContent": { $ne: null },
        });
      else {
        positionsData = await Position.find({
          // "positionsRequirements.positionPreparationMemory": { $ne: true },
          "positionsRequirements.positionPreparationMemory": false,
          "positionsRequirements.originalContent": { $ne: null },
        });
      }

      // printC(positionsData, "1", "positionsData", "b");
      // printC(positionIDs, "1", "positionIDs", "b");
      // df0

      for (let i = 0; i < positionsData.length; i++) {
        // let i = 0; // SOS 🆘 delete
        let positionData = positionsData[i];
        let positionsRequirements =
          positionData.positionsRequirements.originalContent;

        printC(positionData._id, "1", "positionData._id", "b");
        // sdf9

        // ----------- Calculate and Save Memory ------------
        if (positionData?.positionsRequirements?.cvPreparationMemory != true) {
          let filter = {
            positionID: positionData._id,
            label: "requirements_position_memory",
          };
          res = await deleteMemoriesPineconeFunc(filter);
          // ------------ Delete previous memory ------------

          promptMemory = `I will provide you with a string extracted from a Requirements of Jib, delimited with triple quotes """ """. Your job is to thoroughly scan the whole string and list facts that you find in the string. 
          I want you to find experiences in the Requirements and combine them with a description of what is required + if you find the skills that were associated with that experience. 
          
          Never have a bullet point for skills in the output, do not list skills as a separate category.  

          Follow this strict format (each category should be limited to 200 characters, do not go beyond 200 character limit for each category):
          
          Here is the string to extract the information from: """${positionsRequirements}"""
          
          Facts found in the string:`;

          summaryBulletPoints = await useGPTchatSimple(
            promptMemory,
            0,
            "API 2"
          );

          // let summaryBulletPoints = `
          // - Antmicro's AI team builds advanced deep learning-capable data processing devices for customers from various business sectors.
          // - The team participates in the world's leading edge AI projects aimed at developing the edge AI tooling ecosystem.
          // - Antmicro collaborates closely with Google around the open source machine learning framework TensorFlow.
          // - Antmicro uses innovative development methodologies to stay at the forefront of the industry.
          // - The team members become early adopters of the latest processing platforms from vendors such as NVIDIA, NXP, or Xilinx.
          // - The team is responsible for designing AI system architectures for tasks such as video processing, object detection and tracking, speech recognition, and text analysis.
          // - The team implements, trains, and tests AI algorithms with 3D game engines and optimizes them for given hardware.`

          printC(summaryBulletPoints, "1", "summaryBulletPoints", "g");

          const jobsArr_ = summaryBulletPoints
            .split("\n")
            .filter((item) => item.trim().startsWith("-"));

          const jobsArr = jobsArr_.map(
            (item) => "- " + item.replace(/- /g, "").trim()
          );

          printC(jobsArr, "2", "jobsArr", "p");

          printC(jobsArr[2], "2", "jobsArr[2]", "p");

          sumBulletSplit = jobsArr;

          for (let i = 0; i < sumBulletSplit.length; i++) {
            res = await addMemoryPineconeFunc({
              positionID: positionData._id,
              label: "requirements_position_memory",
              memory: sumBulletSplit[i],
            });

            printC(res, "2", "res", "y");
            // -------------- Sent to PineCone --------------

            printC(sumBulletSplit[i], "2", "sumBulletSplit[i]", "p");
          }

          positionData.positionsRequirements.positionPreparationMemory = true;
        }
        // ----------- Calculate and Save Memory ------------

        // ---------------------- Map Nodes from Position text ---------------------
        let nodeIDs;
        promptReportToMapSkills = `I give you a string extracted from a Job Position. Your task is to extract as much information as possible from that Job Position and list all the skills that person need to have to get hired for this position in a small paragraph. 
              dont need to have complete sentences. Make it as dense as possible with just listing the skills, industries, technologies.
              Do not have any other words except for skills. 
  
              Example output (delimiters <>): Skills: <Skill_1, Skill_2, ...>
              
              Job Position (delimiters <>): <${positionsRequirements}>
  
              Skills Result:
              `;

        let mapSkillText = await useGPTchatSimple(promptReportToMapSkills, 0);
        // let mapSkillText = `Experience with databases and SQL, Cloud experience (preferably with AWS), Programming experience, TypeScript experience, Experience building and maintaining backend systems, Experience with infrastructure improvements and scaling, Experience troubleshooting production issues and conducting root cause analysis, Experience conducting systems tests for security, performance, and availability, Team player, Strong communication skills, Ability to work in a fast-paced environment, Detail-oriented, Problem solver, Self-motivated, Adaptable, Experience maintaining and improving infrastructure in AWS, Experience maintaining TypeScript SDKs and writing internal and public documentation, Experience with observability, monitoring, and alerting for services.`
        printC(mapSkillText, "1", "mapSkillText", "g");

        // sd9

        nodeIDs;
        try {
          let nodesN = await MessageMapKG_V4APICallF(mapSkillText);
          printC(nodesN, "3", "nodesN", "p");

          nodeSave = nodesN.map((obj) => {
            return {
              _id: obj.nodeID,
            };
          });
          nodeIDs = nodeSave.map((obj) => {
            return {
              nodeID: obj._id,
            };
          });

          printC(nodeSave, "4", "nodeSave", "r");
        } catch (err) {
          console.log("didn't create nodes = ");
        }

        if (nodeIDs) {
          positionData.nodes = nodeIDs;
        }
        // ---------------------- Map Nodes from Position text ---------------------

        await positionData.save();
      }

      return {
        positions: positionsData,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "autoUpdateMemoryFromPositionRequirments",
        {
          component: "aiMutation > autoUpdateMemoryFromPositionRequirments",
        }
      );
    }
  },
  transcribeAudioToText: async (parent, args, context, info) => {
    // const { audioFile } = args.fields;
    const { audioFile } = args.fields;
    console.log(
      "Mutation > autoUpdateMemoryFromPositionRequirments > args.fields = ",
      args.fields
    );

    console.log("audioFile ====== >>>>>>", await audioFile);

    const file = await audioFile;

    // if (!audioFile) throw new ApolloError("Audio file is required");
    if (!audioFile) throw new ApolloError("Audio file is required");

    const transcribedMessage = await useWhisperAPI(file);

    try {
      return { transcription: transcribedMessage };
    } catch (err) {
      throw new ApolloError(err.message);
    }
  },
  messageToGPT: combineResolvers(
    IsAuthenticated,
    async (parent, args, context, info) => {
      const { message, category, prompt } = args.fields;
      console.log("Mutation > messageToGPT > args.fields = ", args.fields);
      if (!message) throw new ApolloError("The message is required");
      let model = "text-davinci-003";
      const reason = {
        project:
          "You are a successful ceo of a position wih 10 years of experience. You talk elegant and descriptive language. Give a description of a project based on this information:  ",
        skill: "Give a description of a skill named: ",
        role: "Give a description of role with a name of: ",
      };
      const promptDescription = (descriptionOf) => {
        if (descriptionOf === "project") {
          return reason.project + message;
        } else if (descriptionOf === "skill") {
          return reason.skill + message;
        } else if (descriptionOf === "role") {
          return reason.role + message;
        } else {
          return descriptionOf + message;
        }
      };
      const response = await openai.createCompletion({
        model,
        prompt: promptDescription(prompt ? prompt : category),
        max_tokens: 200,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      let generatedText = response.data.choices[0].text;
      let result = generatedText.replace(/\n\n/g, "");
      try {
        return { message: result };
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateMessage",
          {
            component: "aiMutation > updateMessage",
          }
        );
      }
    }
  ),
  inputToGPT: async (parent, args, context, info) => {
    const { oneLinerProject, descriptionProject, titleRole, expertiseRole } =
      args.fields;
    console.log("Mutation > inputToGPT > args.fields = ", args.fields);
    if (!titleRole) throw new ApolloError("The titleRole is required");
    let model = "text-davinci-003";
    const prompt =
      'I give you four things: a one-liner for a project + a description of that project  + the title of a role for that project + [categories of specialization for that role within that same project ]\n\nYour job is to take all those 4 things and create a wholistic context from it, focus on "the title of a role for that project" and "[categories of specialization for that role within that same project ]" and to give me the following:\n1. A full description of that role(always label this output with "Role Description:")\n2. Four Expectations for that role (always label this output with "Expectations for Role:") + Return this list  as a Javascript Arra\n3. Four Benefits of this role (always label this output with "Benefits:") + Return this list  as a Javascript Array  \n\nHere we go: \n\n';

    console.log("hey 2");

    const input =
      prompt +
      " " +
      oneLinerProject +
      " + " +
      descriptionProject +
      " + " +
      titleRole +
      " + " +
      expertiseRole;

    console.log("hey 2");

    const response = await openai.createCompletion({
      model,
      prompt: input,

      max_tokens: 400,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    console.log("hey 3");

    // console.log(
    //   "prompt + oneLinerProject + descriptionProject + titleRole + expertiseRole",
    //   prompt +
    //     " " +
    //     oneLinerProject +
    //     " + " +
    //     descriptionProject +
    //     " + " +
    //     titleRole +
    //     " + " +
    //     expertiseRole
    // );

    let generatedText = response.data.choices[0].text;
    let result = generatedText.replace(/\n\n/g, "");

    console.log("hey 4");

    const descriptionRoleHandler = () => {
      const startIndex = result.indexOf("Role Description:");
      const endIndex = result.indexOf("Expectations for Role:");
      const descriptionRole = result
        .slice(startIndex + "Role Description:".length, endIndex)
        .trim();

      return descriptionRole;
    };

    console.log("hey 5");

    const expectationRoleHandler = () => {
      console.log("hey 10");
      const startIndex = result.indexOf("Expectations for Role:");
      console.log("hey 11");
      const endIndex = result.indexOf("Benefits:");
      const expectationRoleString = result
        .slice(startIndex + "Expectations for Role:".length, endIndex)
        .trim();
      console.log("hey 12", result);
      console.log("hey 12", expectationRoleString);

      const expectationRole = JSON.parse(expectationRoleString);
      console.log("hey 13", expectationRole);

      return expectationRole;
    };
    console.log("hey 6");

    const benefitRoleHandler = () => {
      const startIndex = result.indexOf("Benefits:");

      const benefitRoleString = result
        .slice(startIndex + "Benefits:".length)
        .trim();

      const benefitRole = JSON.parse(benefitRoleString);
      return benefitRole;
    };

    console.log("hey 7");

    descriptionRoleHandler();

    console.log("hey 8");

    expectationRoleHandler();

    console.log("hey 9");

    benefitRoleHandler();

    try {
      return {
        descriptionRole: descriptionRoleHandler,
        expectationsRole: expectationRoleHandler,
        benefitsRole: benefitRoleHandler,
      };
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "inputToGPT", {
        component: "aiMutation > inputToGPT",
      });
    }
  },
  CVtoSummary: async (parent, args, context, info) => {
    const { cvString } = args.fields;
    if (!cvString) throw new ApolloError("The cvString is required");

    const prompt = `
    I want you to act as social media expert at writing profile bios. I will give you a string extracted from a CV(resume) delineated with triple quotes(""" """) and your job is to write a short bio for that profile. Here is the structure of the bio:
    
    Pick the most impressive achievements(highest education and the most recent position in the CV) and list them in 2 bullet points(no more than 2).
    
    Follow this structure which has 2 parts. First part is 2 sentences. Second part is two bullet points
    (Example:
    My name is Bob and I am a tractor driver with 10 years of experience. I have worked in different conditions and I have a passion for mechanics.
    • I have a masters in Agriculture 
    • I worked at Cargill for the last 2 years)
    
    Part 1(do not include Part 1 in the response):
    2 short sentences (Opening line: Introduce yourself and do not list jobs, education, or skills in this section. Just do a general introduction)
    
    Part 2(do not include Part 2 in the response):
    • Highest level of education(bachelor's < Masters < Ph.D)(list only the highest education and only list that one)
    • The present position that they work in and what they do there
    
    """${cvString}"""`;

    summaryOfCV = await useGPTchatSimple(prompt, 0.2);

    try {
      return {
        result: summaryOfCV,
      };
    } catch (err) {
      throw new ApolloError(err.message);
    }
  },
  CVtoJobs: async (parent, args, context, info) => {
    const { cvString } = args.fields;

    if (!cvString) {
      new ApolloError("The cvString is required");
    }

    prompt = `
      Act as resume career expert. I will provide you a string extracted from a PDF which was a CV(resume).

      CV(resume), (delimiters <>) ${cvString}


      Your job is to find and list the latest 1-3 this person had. Give me those jobs in a bullet point format,do not include the name in the summary. 
      
      - Only give me up to 3 last jobs. The job that is current (some year - present) should appear first. After that list jobs that have the latest end date.
      - Give me a dates of when this person started and finished( or presently working)
      - Also take the name of each position and give 3 short(no more than 80 characters long) descriptions of that position.
      - Always use "•" for a bullet point, never this "-". 

      This is the format: 
      •Job Title, Company Name
      •(start date, end date(or present))
       - short description
       - short description
       - short description `;

    responseFromGPT = await useGPTchatSimple(prompt, 0.7);

    console.log("responseFromGPT", responseFromGPT);

    jobsArr = responseFromGPT
      .replace(/\n/g, "")
      .split("•")
      .filter((item) => item.trim() !== "");

    console.log("jobsArr", jobsArr);

    let result = [];

    previousJobs = () => {
      for (let i = 0; i < jobsArr.length; i += 2) {
        result.push({
          outside: jobsArr[i],
          inside: jobsArr[i + 1],
        });
      }
      return JSON.stringify(result);
    };

    try {
      return {
        result: previousJobs,
      };
    } catch (err) {
      throw new ApolloError(err.message);
    }
  },
  cvMapKG: async (parent, args, context, info) => {
    const { message } = args.fields;
    console.log("hey 1");
    const MessageMapKG_V2APICall = async (fields) => {
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
          message: await responseFromGPT,
          // message: message,
        },
      };

      res = await request(
        "https://soil-api-backend-kgfromai2.up.railway.app/graphql",
        query,
        variables
      );

      // console.log("res = " , res)
      console.log("res.messageMapKG_V2", res.messageMapKG_V2);
      return res.messageMapKG_V2.keywords;
    };
    // if (!cvString) throw new ApolloError("The cvString is required");

    prompt =
      "I give you a string extracted from a CV(resume) PDF. Your job is to extract as much information as possible from that CV and list all the skills that person has CV in a small paragraph. Keep the paragrpah small and you dont need to have complete sentenses. Make it as dese as possible with just listing the skills.\nDo not have any other words except for skills. \n\nExaple output: Skills: React, C++, C#, Communiaction, JavaScript....\n\nHere is the string:\n" +
      message;

    responseFromGPT = await useGPTchatSimple(prompt, 0.7);
    // console.log("responseFromGPT", responseFromGPT);
    console.log("MessageMapKG_V2APICall", MessageMapKG_V2APICall);

    try {
      return {
        // keywords: await MessageMapKG_V2APICall,
        keywords: await MessageMapKG_V2APICall,
      };
    } catch (err) {
      throw new ApolloError(err.message);
    }
  },

  useAI_OnMessage: async (parent, args, context, info) => {
    const { message, cash, numberKeywords } = args.fields;
    console.log("Mutation > updateMessage > args.fields = ", args.fields);

    if (numberKeywords == undefined) numberKeywords = 10;

    try {
      // question_ask =
      //   "Extract keywords from this text, and separate them with comma:\n\n" +
      //   message +
      //   "\n\n Result:";
      // question_ask =
      //   "Extract 10 different expertise that derives from the context, and show the expertise and the confidence level higher than 8/10:\n\n" +
      //   message +
      //   "\n\n separate the result with a comma, and don't show the confidence level:";
      question_ask =
        `Extract ${numberKeywords} different expertise that derives from the context, and show the expertise and the confidence level that you have from 0 to 10:` +
        "\n\n" +
        message +
        "\n\n" +
        "result  format like this: \n - expertise: confidence";

      let keywords_mes, keyword_embed;
      // if (fs.existsSync("keywords_mes.txt")) {
      if (fs.existsSync("keywords_mes.txt") && cash == true) {
        keywords_mes = await readData("keywords_mes.txt");
        confidence_mes = await readData("confidence_mes.txt");
        generatedText = await readData("generatedText.txt");
      } else {
        [keywords_mes, confidence_mes, generatedText] =
          await useGPT_withConfidence(question_ask, 0.1);
        cashData("keywords_mes.txt", keywords_mes);
        cashData("confidence_mes.txt", confidence_mes);
        cashData("generatedText.txt", generatedText);
      }

      console.log("keywords_mes = ", keywords_mes);
      console.log("confidence_mes = ", confidence_mes);
      console.log("generatedText = ", generatedText);
      console.log("  ");
      console.log("  ");

      // console.log("keywords_mes = ", keywords_mes);

      // keywords_mes = [message]; // SOS 🆘 -> Delete, it's just for test, it's not a good idea to use the message as a keyword

      // if (fs.existsSync("keyword_embed.txt")) {
      if (fs.existsSync("keyword_embed.txt") && cash == true) {
        keyword_embed = await readData("keyword_embed.txt");
      } else {
        keyword_embed = await createEmbeddingsGPT(keywords_mes);
        await cashData("keyword_embed.txt", keyword_embed);
      }

      // console.log("keyword_embed = " , keyword_embed)
      // asdf
      // console.log("keyword_embed = ", keyword_embed);

      // words_n_base = await addKnowledgeGraph_embedings();
      [words_n_base, words_n_base_embed] = await addKnowledgeGraph_embedings();

      // console.log("words_n_base_embed.length = ", words_n_base_embed.length);
      // console.log("words_n_base_embed.length = ", words_n_base_embed[0].length);
      // console.log(
      //   "words_n_base_embed.length = ",
      //   words_n_base_embed[0][0].length
      // );
      // console.log("keyword_embed.length = ", keyword_embed.length);
      // console.log("keyword_embed.length = ", keyword_embed[0].length);

      // console.log(
      //   "math.transpose(keyword_embed)[0] = ",
      //   math.transpose(keyword_embed).length
      // );
      // console.log(
      //   "math.transpose(keyword_embed)[0] = ",
      //   math.transpose(keyword_embed)[0].length
      // );

      // let testV = keyword_embed[0];

      // scores = [];
      // for (let i = 0; i < words_n_base_embed[0].length; i++) {
      //   let dot = numeric.dot(
      //     words_n_base_embed[i],
      //     math.transpose(keyword_embed)
      //   );
      //   // scores.push(
      //   //   )
      // }
      scores = []; // the score of every word in the message with the knowledgegraph
      maxima_array = []; // the maximum score of every word in the message with the knowledgegraph vertical (Design, frontEnd, etc.)
      max_graph_vertical = []; // the maximum score of every vertical (Design, frontEnd, etc.)

      maxi_graph_pos = -1; // the position of the maximum score of every vertical (Design, frontEnd, etc.)
      maxi_graph = -1; // the maximum score of every vertical (Design, frontEnd, etc.)
      for (let i = 0; i < words_n_base_embed.length; i++) {
        let dotProduct = numeric.dot(
          words_n_base_embed[i],
          math.transpose(keyword_embed)
        );

        // console.log("dotProduct = ", dotProduct[0]);

        for (let j = 0; j < dotProduct.length; j++) {
          // SOS 🆘 -> use the confidence of GPT to reduce the score
          dotProduct[j] = dotProduct[j].map(
            (element, idx) => element - confidence_mes[idx]
          );
        }

        scores.push(dotProduct);

        // console.log("dotProduct = ", dotProduct[0]);
        // asfd;

        // find maximum in 2D array, in every column
        let maxi_n_arr = dotProduct.map(function (col) {
          return Math.max.apply(Math, col);
        });
        maxima_array.push(maxi_n_arr);

        // find the average of the maxi_n array, with the fastest way
        let maxi_n = maxi_n_arr.reduce((a, b) => a + b, 0) / maxi_n_arr.length;

        console.log("maxi_n = ", words_n_base[i][0], " ->", maxi_n);

        max_graph_vertical.push(maxi_n);

        if (maxi_n > maxi_graph) {
          maxi_graph = maxi_n;
          maxi_graph_pos = i;
        }
      }

      // console.log("maxi_graph_pos = ", maxi_graph_pos);

      // maxi_graph_pos = 0; // SOS 🆘 -> Delete, this is for testing (makes it always FrontEnd result)

      if (maxi_graph < 0.81) {
        // if (maxi_graph < 0.79) {
        return {
          mainExpertise: "",
          expertiseIdentified: [],
          keywordsMessage: keywords_mes,
        };
      }
      let knowledgeGraphTopic = "";
      if (maxi_graph_pos == 0) {
        knowledgeGraphTopic = words_n_base[0][0];
      } else if (maxi_graph_pos == 1) {
        knowledgeGraphTopic = words_n_base[1][0];
      } else if (maxi_graph_pos == 2) {
        knowledgeGraphTopic = words_n_base[2][0];
      } else if (maxi_graph_pos == 3) {
        knowledgeGraphTopic = words_n_base[3][0];
      } else if (maxi_graph_pos == 4) {
        knowledgeGraphTopic = words_n_base[4][0];
      } else if (maxi_graph_pos == 5) {
        knowledgeGraphTopic = words_n_base[5][0];
      }

      console.log("The user is talking about ---> ", knowledgeGraphTopic);

      // console.log("scores[maxi_graph_pos] = ", scores[maxi_graph_pos]);

      console.log("");
      console.log("");
      console.log("");

      rolesIdentified = [];
      rolesIdentified_average_conf = [];
      min_average_conf = 1;
      max_average_conf = 0;

      // console.log("scores[maxi_graph_pos] = ", scores[maxi_graph_pos]);
      // console.log("keywords_mes = ", keywords_mes);

      for (let i = 0; i < scores[maxi_graph_pos].length; i++) {
        // console.log("scores[maxi_graph_pos][i] = ", scores[maxi_graph_pos][i]);
        // console.log(
        //   "words_n_base[maxi_graph_pos][i] = ",
        //   words_n_base[maxi_graph_pos][i]
        // );
        // find the maximum number from scores[maxi_graph_pos][i], and the position of it
        let max_n = Math.max.apply(Math, scores[maxi_graph_pos][i]);
        let max_n_pos = scores[maxi_graph_pos][i].indexOf(max_n);

        // sort the scores[maxi_graph_pos][i] but remember the position of the elements
        let sort_scores = scores[maxi_graph_pos][i].map(function (el, i) {
          return { index: i, value: math.round(el, 3) };
        });
        sort_scores.sort(function (a, b) {
          return b.value - a.value;
        });
        // console.log("sort_scores = ", sort_scores);

        // average the first 4 positions of sort_scores with the fastest way
        let average_sort_scores =
          sort_scores.slice(0, 4).reduce((a, b) => a + b.value, 0) / 4;
        // console.log("average = ", average_sort_scores);

        // asdf;

        // console.log("max_n_pos = ", max_n_pos);

        // console.log("scores[maxi_graph_pos][i] = ", scores[maxi_graph_pos][i]);

        if (average_sort_scores > 0.81) {
          rolesIdentified.push(words_n_base[maxi_graph_pos][i]);
          rolesIdentified_average_conf.push(average_sort_scores);

          if (average_sort_scores < min_average_conf) {
            min_average_conf = average_sort_scores;
          }
          if (average_sort_scores > max_average_conf) {
            max_average_conf = average_sort_scores;
          }

          console.log(
            "max_n = ---------------> ",
            words_n_base[maxi_graph_pos][i],
            average_sort_scores,
            keywords_mes[sort_scores[0].index],
            "\n",
            keywords_mes[sort_scores[1].index],
            "\n",
            keywords_mes[sort_scores[2].index],
            "\n",
            keywords_mes[sort_scores[3].index],
            "\n"
          );
          // console.log("ort_scores.slice(0, 4) = ", sort_scores.slice(0, 4));
          console.log("---------------> = ");
        }
      }
      // console.log("change = ", rolesIdentified);

      let rolesIdentified_final = [];
      for (let i = 0; i < rolesIdentified.length; i++) {
        rolesIdentified_average_conf[i] = mapRange(
          rolesIdentified_average_conf[i],
          min_average_conf,
          max_average_conf,
          0,
          100
        );

        if (rolesIdentified_average_conf[i] > 40) {
          rolesIdentified_final.push(rolesIdentified[i]);
        }
      }

      return {
        mainExpertise: knowledgeGraphTopic,
        expertiseIdentified: rolesIdentified_final,
        keywordsMessage: keywords_mes,
      };
      // return {
      //   res: res,
      // };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateMessage",
        {
          component: "aiMutation > updateMessage",
        }
      );
    }
  },
  //subscription here
  userCVSavedToDB: {
    subscribe: (parent, args, context, info) => {
      //make subscription here
      return pubsub.asyncIterator("USER_CV_SAVED");
    },
  },
};

async function useGPT_withConfidence(prompt, temperature) {
  // let model = "text-curie-001";
  let model = "text-davinci-003";
  const response = await openai.createCompletion({
    model,
    prompt,
    temperature,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  // // ----------- Clean up the Results ---------
  let generatedText = response.data.choices[0].text;

  // generatedText =
  // "generatedText =   level \n 1. Coding: 8\n 2. Javascript: 8\n 3. Neo4j: 6\n 4. Convolutional Neural Networks: 4\n 5. Figma: 4\n 6. Algorithm Design: 3\n 7. Data Structures: 3\n 8. Machine Learning: 3\n 9. Database Design: 2\n 10. UI/UX Design: 2";
  // generatedText =
  //   "- Database Design: 10\n - Database Optimization: 10\n - MySQL: 10\n - PostgreSQL: 10\n - MongoDB: 10\n - Problem Solving: 10\n - Project Management: 8\n - Troubleshooting: 9\n - Data Analysis: 8\n - Database Security: 9";

  console.log("generatedText = ", generatedText);

  // separate every new line of generatedText into an array
  let arr_genText = generatedText.split("\n");
  // console.log("arr_genText = ", arr_genText);
  // for every line of the array arr_genText take the words in the middle of the string

  let result = [];
  let keyword_mes = [];
  let confidence_mes = [];
  arr_genText.forEach((item) => {
    const parts = item.split(":");
    // console.log("parts = ", parts);
    // console.log("parts[0].split ", parts[0].split("-"));
    // console.log("parts[0].split ", parts[0].split("-")[1]);
    let prs;
    if (parts[0].indexOf(".") != -1) {
      prs = parts[0].split(".")[1];
    } else if (parts[0].indexOf("-") != -1) {
      prs = parts[0].split("-")[1];
    }

    if (prs && parts[1]) {
      const words = prs.trim();

      console.log("words = ", words);
      const confidence = Number(parts[1].trim());
      result.push({
        words: words,
        confidence: confidence,
      });
      keyword_mes.push(words);
      let confidence_new = mapRange(confidence, 0, 10, 0.1, 0);
      confidence_mes.push(confidence_new);
    }
  });
  // console.log("result = ", result);
  // console.log("keyword_mes = ", keyword_mes);
  // console.log("confidence_mes = ", confidence_mes);

  // asdf;
  // return keyword_mes;
  return [keyword_mes, confidence_mes, generatedText];
}

function mapRange(input, inputMin, inputMax, outputMin, outputMax) {
  return (
    ((input - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) +
    outputMin
  );
}

async function useGPT(prompt, temperature = 0.7, max_tokens = 256) {
  // let model = "text-curie-001";
  let model = "text-davinci-003";
  const response = await openai.createCompletion({
    model,
    prompt,
    temperature,
    max_tokens: max_tokens,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  // ----------- Clean up the Results ---------
  let generatedText = response.data.choices[0].text;

  // ----------- Clean up the Results ---------

  return generatedText;
}

async function createEmbeddingsGPT(words_n) {
  // words_n = ["node.js", "react", "angular"];
  let OPENAI_API_KEY = chooseAPIkey();
  response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: words_n,
      model: "text-embedding-ada-002",
      // model: "text-embedding-ada-002",
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

const convertEmbeddingToFloat = (keywordsArray) => {
  let buildArray = [...keywordsArray];
  for (let i = 0; i < keywordsArray.length; i++) {
    let embeddingArray = keywordsArray[i].embedding;
    let newEmbeddingArray = [];
    embeddingArray.forEach((embedding) => {
      newEmbeddingArray.push(parseFloat(embedding.toString()));
    });

    buildArray[i].embedding = newEmbeddingArray;
  }

  return buildArray;
};

async function readData(name) {
  const contents = fs.readFileSync(name);
  const res_array = JSON.parse(contents);

  return res_array;
}

async function cashData(name, array) {
  fs.writeFile(name, JSON.stringify(array), function (err) {
    if (err) throw err;
    console.log("Saved!");
  });
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

// async function upsertEmbedingPineCone(data) {
//   const pinecone = new PineconeClient();
//   await pinecone.init({
//     environment: "us-east1-gcp",
//     apiKey: "901d81d8-cc8d-4648-aeec-229ce61d476d",
//   });

//   const index = await pinecone.Index("profile-eden-information");

//   id_message = await generateRandomID(8);

//   const upsertRequest = {
//     vectors: [
//       {
//         id: id_message,
//         values: data.embedding,
//         metadata: {
//           text: data.text,
//           _id: data._id,
//           label: data.label,
//         },
//       },
//     ],
//   };

//   const upsertResponse = await index.upsert({ upsertRequest });

//   return {
//     upsertResponse,
//     id_message,
//   };
// }

function chooseAPIkey() {
  openAI_keys = [process.env.REACT_APP_OPENAI_1];

  // randomly choose one of the keys
  let randomIndex = Math.floor(Math.random() * openAI_keys.length);
  let key = openAI_keys[randomIndex];

  return key;
}

async function addKnowledgeGraph_embedings() {
  let words_n_base = [
    [
      "Design",
      "UX/UI",
      "Graphic Design",
      "Web Design",
      "Game Design",
      "Animation",
      "General Design support from A-Z",
      "NFT Design",
      "Brand Design",
      "Design user experiences",
      "Design interactions",
      "User flows",
      "Wireframing and prototyping",
      "Adobe Creative Suite ",
      "Illustratio",
      "Design user experiences",
      "Design user interfaces",
      "Prototyping",
      "Data visualization",
      "Create graphic designs",
      "Layout design",
    ],
    [
      "Frontend Developer",
      "UI Implementation",
      "Frontend Architecture",
      "General Frontend Support",
      "Web Development",
      "App Development",
      "JavaScript",
      "Front-end frameworks",
      "REST APIs",
      "Data management",
      "Security best pratices",
      "Scalability",
      "Optimize performance",
      "System design and architecture",
      "React ",
      "Angular ",
      "Vue.js ",
      "Bootstrap ",
    ],
    [
      "Product Manager",
      "User Research",
      "Market Research",
      "Technical Team Coordination",
      "Design Team Coordination",
      "Ideation",
      "Interviews",
    ],
    [
      "Backend Developer",
      "Provide General Backend Support",
      "Develop and implement a REST API",
      "Design and implement a database schema",
      "Handle user authentication and authorization",
      "Integrate third-party APIs",
      "Write scripts for data migration and processing",
      "Write unit and integration tests",
      "Debug and fix issues in the backend code",
      "Optimize for scalability and performance",
      "Implement security measures",
      "Write scripts for routine maintenance tasks",
      "Integrate the backend with the user interface",
      "Implement support for internationalization and localization",
      "Help team refine and prioritize features",
      "App Architecture",
    ],
    [
      "Blockchain Developer",
      "Smart Contract Development",
      "Smart Contract Auditing",
      "Blockchain Architecture & Design",
      "Lead a Technical Team",
      "General Blockchain Support",
    ],
    [
      "AI & Data Science",
      "Machine learning",
      "Natural language processing (NLP)",
      "Computer vision",
      "Robotics",
      "Deep learning",
    ],
  ];

  // - Design: confidence level
  // - UX/UI: confidence level
  // - Graphic Design: confidence level
  // - Web Design: confidence level
  // - Game Design: confidence level
  // - Animation: confidence level
  // - General Design support from A-Z: confidence level
  // - NFT Design: confidence level
  // - Brand Design: confidence level
  // - Design user experiences: confidence level
  // - Frontend Developer: confidence level
  // - UI Implementation: confidence level
  // - Frontend Architecture: confidence level
  // - General Frontend Support: confidence level
  // - Web Development: confidence level
  // - App Development: confidence level
  // - JavaScript: confidence level
  // - Front-end frameworks: confidence level
  // - Product Manager: confidence level
  // - User Research: confidence level
  // - Market Research: confidence level
  // - Technical Team Coordination: confidence level
  // - Design Team Coordination: confidence level
  // - Ideation: confidence level
  // - Interviews: confidence level

  let words_n_base_embed = [];
  if (fs.existsSync("knowledgeGranphEmb.txt")) {
    console.log("knowledgeGranphEmb.txt exists");

    const fs = require("fs");

    const contents = fs.readFileSync("knowledgeGranphEmb.txt");
    const words_n_base_embed = JSON.parse(contents);

    // return words_n_base_embed;
    return [words_n_base, words_n_base_embed];
  } else {
    console.log("knowledgeGranphEmb.txt does not exist");

    // loop words_n_base
    words_n_base_embed = [];
    for (let i = 0; i < words_n_base.length; i++) {
      let words_n = words_n_base[i];
      let res_embed = await createEmbeddingsGPT(words_n);
      // put them on an array
      words_n_base_embed.push(res_embed);
    }

    // console.log("words_n_base_embed = ", words_n_base_embed);

    const json = JSON.stringify(words_n_base_embed);

    fs.writeFileSync("knowledgeGranphEmb.txt", json);

    // console.log("json = ", json);

    console.log("words_n_base = ", words_n_base);

    // return words_n_base;
    return [words_n_base, words_n_base_embed];
  }
}
