
const { ApolloError } = require("apollo-server-express");

const { Company } = require("../../../models/companyModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");


const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");



const { addMultipleQuestionsToEdenAIFunc ,updateQuestionSmall} = require("../utils/questionsEdenAIModules");

const {checkAndAddCompanyToMember  } = require("../utils/companyModules");

const { printC } = require("../../../printModule");

const { useGPTchatSimple,deletePineCone,upsertEmbedingPineCone,findBestEmbedings,getMemory} = require("../utils/aiModules");




const {
  arrayToObj,
} = require("../utils/endorsementModules");

module.exports = {
  updateCompany: async (parent, args, context, info) => {
      const { _id,name } = args.fields;
      console.log("Mutation > updateCompany > args.fields = ", args.fields);


      try {

        let companyData
        if (_id) {
          companyData = await Company.findOne({ _id });

          // update
          if (name) companyData.name = name;
          await companyData.save();
        } else {
          companyData = await new Company({
            name,
          });

          await companyData.save();
        }



        return {
          _id: companyData._id,
          name: companyData.name,
        }
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateCompany",
          { component: "companyMutation > updateCompany" }
        );
      }
    },
    interviewQuestionCreationUser: async (parent, args, context, info) => {
      const { companyID,userID,cvContent } = args.fields;
      console.log("Mutation > interviewQuestionCreationUser > args.fields = ", args.fields);


      if (!companyID) throw new ApolloError("Company ID is required", "interviewQuestionCreationUser", { component: "companyMutation > interviewQuestionCreationUser" });

      if (!userID) throw new ApolloError("User ID is required", "interviewQuestionCreationUser", { component: "companyMutation > interviewQuestionCreationUser" });

      try {

        companyData = await Company.findOne({ _id: companyID}).select('_id name candidates questionsToAsk');
        if (!companyData) throw new ApolloError("Company not found", "interviewQuestionCreationUser", { component: "companyMutation > interviewQuestionCreationUser" });


        userData = await Members.findOne({ _id: userID}).select('_id discordName');
        if (!userData) throw new ApolloError("User not found", "interviewQuestionCreationUser", { component: "companyMutation > interviewQuestionCreationUser" });


        const questionsToAsk = companyData.questionsToAsk

        const questionsToAskID = questionsToAsk.map((question) => question.questionID)

        questionData = await QuestionsEdenAI.find({ _id: questionsToAskID }).select('_id content');

        printC(questionData,"1","questionData","b")

        questionsThatWereAsked = ''



        const questionNow = questionData[0];

        // ------- Find best Open Job Role Memories ----------
        filter = {
          label: "Company_TrainEdenAI_memory",
          _id: companyID,
        };

        bestJobRoleMemories = await getMemory(
          questionNow.content,
          filter,
          (topK = 6),
          250
        );

        // printC(bestJobRoleMemories,"3","bestJobRoleMemories","p")
        // ------- Find best Open Job Role Memories ----------


        // // ------- Find best Open CV Memories ----------
        // filter = {
        //   label: "CV_user_memory",
        //   _id: userID,
        // };

        // bestUserCVMemories = await getMemory(
        //   questionNow.content,
        //   filter,
        //   (topK = 5),
        //   350
        // );

        // // printC(bestUserCVMemories,"3","bestUserCVMemories","r")
        // // ------- Find best Open CV Memories ----------

        // ----------- CV to Summary -------------
        let cvContentPrompt = `
          CV CONTENT (delimiters <>): <${cvContent}>

          - You are a recruiter with task to understand a candidate's CV.
          - Your goal is to create a Summary of the CV CONTENT

          Summary: 
        `
        printC(cvContentPrompt,"3","cvContentPrompt","b")

        cvSummary = await useGPTchatSimple(cvContentPrompt,0)

        printC(cvSummary,"2","cvSummary","r")
        // sdf0
        // ----------- CV to Summary -------------

        // cvSummary = `Lolita Mileta is an experienced Lead Scrum Master and Product Owner with a background in IT and international relations. She has successfully managed teams of up to 42 people, developed hiring processes, and established strong relationships with key stakeholders. Lolita is skilled in Scrum and Agile frameworks, leadership, communication, facilitation, planning, metrics, data analysis, continuous improvement, and has a sub-major in International Tourism, business, and marketing. She is also fluent in English, Ukrainian, Russian, and proficient in Polish. Lolita has volunteered over 200 hours across various communities in the USA and is an alumni of the Future Leaders Exchange Program.`

        console.log("----------------------------" )


        // -------- Create Prompt ---------
        
        let promptJOB_CV = `
          JOB_ROLE (delimiters <>): <${bestJobRoleMemories}>

          USER_CV (delimiters <>) <${cvSummary}>

          - Your goal is to collect information from the candidate for the JOB_ROLE.
          - Analyse for each point of the JOB_ROLE if a Candidate has the right CV info or he is missing something, be creative on the ways that the candidate background can be applied on the role

        smallest number of Bullet points with small summary analyzing the JOB_ROLE for this USER CV:
        `
        printC(promptJOB_CV,"3","promptJOB_CV","b")

        infoCandidateForJob = await useGPTchatSimple(promptJOB_CV,0)

//         infoCandidateForJob = `
//         - Responsibilities of the Candidate: The candidate must understand user needs and be able to solve their problems.
//     - Analysis: Lolita's experience in product ownership and stakeholder management shows that she has a strong understanding of user needs and can effectively solve their problems.
// - Skills of the Candidate: Must have knowledge of front-end development, including GraphQL, Next.js, React, and TailwindCSS.
//     - Analysis: Lolita's CV does not mention any experience or knowledge in front-end development, so she may not be the best fit for this specific skill requirement.
// - Responsibilities of the Candidate: The candidate will work independently to innovate and create code.
//     - Analysis: Lolita's experience in leadership and continuous improvement suggests that she can work independently and innovate, but her lack of experience in front-end development may limit her ability to create code.
// - General info of Company: Soil is creating a marketplace for companies and talent using AI and blockchain.
//     - Analysis: No specific relevance to Lolita's CV, but her background in IT and international relations may give her a unique perspective on the use of AI and blockchain in the marketplace.
// - Values of Company: Soil values innovation and user discovery.
//     - Analysis: Lolita's experience in product ownership and stakeholder management aligns well with Soil's values of innovation and user discovery.
// - Values of Company: The company culture is fun and collaborative.
//     - Analysis: No specific relevance to Lolita's CV, but her experience in leadership and community volunteering may suggest that she can contribute to a fun and collaborative company culture.
//         `

        printC(infoCandidateForJob,"3","infoCandidateForJob","r")

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
        // - General info of Company: Soil is creating a marketplace for companies and talent using AI and blockchain.
        // - Analysis: There is no specific mention of Miltiadis' experience in AI and blockchain technologies. However, his expertise in computer vision and deep learning can be applied to create innovative solutions for Soil's marketplace.
        // - Values of Company: Soil values innovation and user discovery.
        // - Analysis: Miltiadis has a passion for optimized software development and research, and has worked on various projects related to sequence models, robotics, and autonomous OCR dictating systems for blind people. Therefore, he has the necessary experience to contribute to Soil's value of innovation and user discovery.
        // - Values of Company: The company culture is fun and collaborative.
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

        improvedQuestions = await useGPTchatSimple(promptNewQuestions,0)

        printC(improvedQuestions,"4","improvedQuestions","r")

//         improvedQuestions = `1. Can you tell us about your experience working with Machine Learning and Computer Vision, and how it could be useful for understanding user needs and solving their problems in this role?
// 2. What specific experience do you have leading teams and innovating with cutting-edge technologies, and how do you think it could be valuable for working independently to create code in this role?
// 3. Do you have experience with GraphQL, Next.js, React, and TailwindCSS, which are required for this role?
// 4. What other technical skills do you have that could be helpful in this position?
// 5. How comfortable are you with UI implementation, and what experience do you have in this area?
// 6. Would you be willing to join Soil 🌱 as a contributor, given that the company is not yet financially secure?
// 7. Do you share Eden's vision of using AI and blockchain to create context and trust and connect the right person to the right opportunity?
// 8. What specifically interests you about joining Soil 🌱, and how do you think you could contribute to the company's mission?
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

        // find the idx what candidate you will update from the companyData

        printC(userID,"5","userID","y")
        printC(companyID,"5","companyID","y")

        companyData2 = await Company.findOne({ _id: companyID}).select('_id name candidates');
        printC(companyData2?.candidates?.length,"5","companyData2.candidates.length","y")

        // sf0
        let candidateIdx = companyData2?.candidates?.findIndex((candidate) => candidate.userID.toString() == userID.toString());

        printC(candidateIdx,"3","candidateIdx","r")

        if (candidateIdx!=-1 && candidateIdx!=undefined) {
          companyData2.candidates[candidateIdx].interviewQuestionsForCandidate = interviewQuestionsForCandidate

        } else {
          companyData2?.candidates?.push({
            userID: userID,
            interviewQuestionsForCandidate: interviewQuestionsForCandidate,
          })

        }

        if (companyData2){
          companyData2 = await companyData2.save();
        }


        return companyData2

        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "interviewQuestionCreationUser",
          { component: "companyMutation > interviewQuestionCreationUser" }
        );
      }
    },
    addEmployeesCompany: async (parent, args, context, info) => {
      const { companyID,employees } = args.fields;
      console.log("Mutation > addEmployeesCompany > args.fields = ", args.fields);

      if (!employees) throw new ApolloError("Employees is required", "addEmployeesCompany", { component: "companyMutation > addEmployeesCompany" });

      if (!companyID) throw new ApolloError("Company ID is required", "addEmployeesCompany", { component: "companyMutation > addEmployeesCompany" });

      companyData = await Company.findOne({ _id: companyID });

      if (!companyData) throw new ApolloError("Company not found", "addEmployeesCompany", { component: "companyMutation > addEmployeesCompany" });

 

      try {


        let compEmployees = await updateEmployees(companyData.employees, employees);

        console.log("compEmployees = " , compEmployees)




        // find one and updates
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { employees: compEmployees },
          { new: true }
        );

        return companyDataN
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addEmployeesCompany",
          { component: "companyMutation > addEmployeesCompany" }
        );
      }
    },
    addQuestionsToAskCompany: async (parent, args, context, info) => {
      const { companyID } = args.fields;
      let {questionsToAsk} = args.fields;
      console.log("Mutation > addQuestionsToAskCompany > args.fields = ", args.fields);

      if (!questionsToAsk) throw new ApolloError("Employees is required", "addQuestionsToAskCompany", { component: "companyMutation > addQuestionsToAskCompany" });

      if (!companyID) throw new ApolloError("Company ID is required", "addQuestionsToAskCompany", { component: "companyMutation > addQuestionsToAskCompany" });

      companyData = await Company.findOne({ _id: companyID });

      if (!companyData) throw new ApolloError("Company not found", "addQuestionsToAskCompany", { component: "companyMutation > addQuestionsToAskCompany" });

 

      try {

        questionsToAsk = await addMultipleQuestionsToEdenAIFunc(questionsToAsk)

        console.log("questionsToAsk = " , questionsToAsk)
        // asdf12


        let questionsToAskN = await updateEmployees(companyData.questionsToAsk, questionsToAsk,"questionID");

        console.log("questionsToAskN = " , questionsToAskN)


        // find one and updates
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { questionsToAsk: questionsToAskN },
          { new: true }
        );
        
        return companyDataN
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addQuestionsToAskCompany",
          { component: "companyMutation > addQuestionsToAskCompany" }
        );
      }
    },
    deleteQuestionsToAskCompany: async (parent, args, context, info) => {
      const { companyID,questionID } = args.fields;
      console.log("Mutation > deleteQuestionsToAskCompany > args.fields = ", args.fields);

      if (!companyID) throw new ApolloError("Company ID is required", "deleteQuestionsToAskCompany", { component: "companyMutation > deleteQuestionsToAskCompany" });

      companyData = await Company.findOne({ _id: companyID });

      if (!companyData) throw new ApolloError("Company not found", "deleteQuestionsToAskCompany", { component: "companyMutation > deleteQuestionsToAskCompany" });

 

      try {

        questionsToAsk = companyData.questionsToAsk

        console.log("questionsToAsk = " , questionsToAsk)

        // filter out the questionID
        questionsToAsk = questionsToAsk.filter((question) => question.questionID.toString() != questionID.toString());

        // save it to mongo
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { questionsToAsk },
          { new: true }
        );

        
        
        return companyDataN
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "deleteQuestionsToAskCompany",
          { component: "companyMutation > deleteQuestionsToAskCompany" }
        );
      }
    },
    addCandidatesCompany: async (parent, args, context, info) => {
      const { companyID,candidates } = args.fields;
      console.log("Mutation > addCandidatesCompany > args.fields = ", args.fields);

      if (!candidates) throw new ApolloError("Employees is required", "addCandidatesCompany", { component: "companyMutation > addCandidatesCompany" });

      if (!companyID) throw new ApolloError("Company ID is required", "addCandidatesCompany", { component: "companyMutation > addCandidatesCompany" });

      companyData = await Company.findOne({ _id: companyID });

      if (!companyData) throw new ApolloError("Company not found", "addCandidatesCompany", { component: "companyMutation > addCandidatesCompany" });

 
      userIDs = candidates.map((candidate) => candidate.userID)
      
      usersData = await Members.find({ _id: { $in: userIDs } }).select("_id discordName companiesApplied");

      
 
      try {


        let candidatesN = await updateEmployees(companyData.candidates, candidates,"userID");

        console.log("candidatesN = " , candidatesN)
        // sdf00


        await checkAndAddCompanyToMember(usersData,companyID)
        


        // find one and updates
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { 
            candidates: companyData.candidates,
            candidatesReadyToDisplay: false 
          },
          { new: true }
        );
        
        return companyDataN
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addCandidatesCompany",
          { component: "companyMutation > addCandidatesCompany" }
        );
      }
    },
    addConvRecruiterToCompany: async (parent, args, context, info) => {
      const { companyID,userID,conversationID } = args.fields;
      console.log("Mutation > addConvRecruiterToCompany > args.fields = ", args.fields);

      if (!userID) throw new ApolloError("userID is required", "addConvRecruiterToCompany", { component: "companyMutation > addConvRecruiterToCompany" });


      if (!companyID) throw new ApolloError("Company ID is required", "addConvRecruiterToCompany", { component: "companyMutation > addConvRecruiterToCompany" });
      companyData = await Company.findOne({ _id: companyID });
      if (!companyData) throw new ApolloError("Company not found", "addConvRecruiterToCompany", { component: "companyMutation > addConvRecruiterToCompany" });


      if (!conversationID) throw new ApolloError("conversationID is required", "addConvRecruiterToCompany", { component: "companyMutation > addConvRecruiterToCompany" });
      
 


      try {

        // check if inside companyData.convRecruiter already conversationID exists
        let convRecruiterData = companyData.convRecruiter.find((convRecruiter) => convRecruiter.conversationID.toString() == conversationID.toString());

        if (!convRecruiterData) {
          companyData.convRecruiter.push({
            userID: userID,
            conversationID: conversationID,
            readyToDisplay: false,
          });
        } else {
          convRecruiterData.readyToDisplay = false;
        }

        // save it to mongo
        companyData.convRecruiterReadyToDisplay = false;
        companyData = await companyData.save();


        // // find one and updates
        // let companyDataN = await Company.findOneAndUpdate(
        //   { _id: companyID },
        //   { 
        //     candidates: candidatesN,
        //     candidatesReadyToDisplay: false 
        //   },
        //   { new: true }
        // );
        
        return companyData
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addConvRecruiterToCompany",
          { component: "companyMutation > addConvRecruiterToCompany" }
        );
      }
    },

    addNodesToCompany: async (parent, args, context, info) => {
      let { companyID, nodes } = args.fields;

      console.log("Mutation > addNodesToCompany > args.fields = ", args.fields);

      


      if (!companyID) throw new ApolloError("companyID is required");

      if (!nodes) throw new ApolloError("nodes is required");


      try {
        let companyData = await Company.findOne({ _id: companyID }).select('_id name nodes');

        printC(companyData,"0","companyData","b")
        

        nodesIDArray = nodes.map((node) => node.nodeID);

        printC(nodesIDArray,"1","nodesIDArray","g")


        let nodesData = await Node.find({ _id: nodesIDArray }).select(
          "_id name node "
        );

        printC(nodesData,"2","nodesData","g")


        
        let nodesDataOriginalArray = companyData.nodes.map(function (item) {
          return item.nodeID.toString();
        });

        printC(nodesDataOriginalArray,"1","nodesDataOriginalArray","b")


        // check if the nodes are already in the company if they don't then add it to the companyData.nodes and save it to mongo
        for (let i=0;i<nodesData.length;i++) {
          let nodeData = nodesData[i];

          if (!nodesDataOriginalArray.includes(nodeData._id.toString())) {
            companyData.nodes.push({
              nodeID: nodeData._id,
            })
          }

        }

        printC(companyData,"1","companyData","b")

        // save it to mongo
        companyData = await companyData.save();





        return companyData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "addNodesToCompany",
          { component: "companyMutation > addNodesToCompany" }
        );
      }
    },

    createTalentListCompany: async (parent, args, context, info) => {
      const { companyID, name,talentListID } = args.fields;
      console.log("Mutation > createTalentListCompany > args.fields = ", args.fields);

      try {

        companyData = await Company.findOne({ _id: companyID}).select('_id name talentList');

        console.log("companyData = " , companyData)

        if (talentListID){

          // search inside companyData.talentList if talentListID is already there
          let talentListData = companyData.talentList.find((talentList) => talentList._id.toString() == talentListID.toString());

          if (!talentListData) {
            companyData.talentList.push({
              _id: talentListID,
              name: name,
            });
          } else {
            // update the name
            talentListData.name = name;
          }

        } else {
          companyData.talentList.push({
            name: name,
          });

        }

        // save it to mongo
        companyData = await companyData.save();


        return companyData
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "createTalentListCompany",
          { component: "companyMutation > createTalentListCompany" }
        );
      }
    },

    updateUsersTalentListCompany: async (parent, args, context, info) => {
      const { companyID, talentListID, usersTalentList } = args.fields;
      console.log("Mutation > updateUsersTalentListCompany > args.fields = ", args.fields);

      try {

        companyData = await Company.findOne({ _id: companyID}).select('_id name talentList');

        if (!companyData) throw new ApolloError("Company not found", "updateUsersTalentListCompany", { component: "companyMutation > updateUsersTalentListCompany" });


        // change from usersTalentList which is an array, to talent an array of objects with userID
        let talent = usersTalentList.map((userTalentID) => {
          return {
            userID: userTalentID,
          }
        })

        console.log("talent = " , talent)

        // find the talentListID and update the talent

        let talentListData = companyData.talentList.find((talentList) => talentList._id.toString() == talentListID.toString());

        // update talent
        talentListData.talent = talent;

        // save it to mongo
        companyData = await companyData.save();


        return companyData
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateUsersTalentListCompany",
          { component: "companyMutation > updateUsersTalentListCompany" }
        );
      }
    },

    
    updateCompanyUserAnswers: async (parent, args, context, info) => {
      const { companyIDs} = args.fields;
      console.log("Mutation > updateCompanyUserAnswers > args.fields = ", args.fields);


      if (companyIDs)
        companyData = await Company.find({ 
          _id: companyIDs,
          // candidatesReadyToDisplay: { $ne: true } // SOS 🆘 - uncomment!!!
        });
      else 
        companyData = await Company.find({ candidatesReadyToDisplay: { $ne: true } });

      try {

        let candidateResult = {}

        for (let i = 0; i < companyData.length; i++) { // Loop on companies
          const company = companyData[i];

          questionsToAsk = company.questionsToAsk

          printC(questionsToAsk,"0","questionsToAsk","g")

          let questionsToAskObj = await arrayToObj(questionsToAsk,"questionID")


          printC(questionsToAskObj,"1","questionsToAskObj","b")


          candidates = company.candidates

          for (let j = 0; j < candidates.length; j++) { // loop on candidates

            const candidate = candidates[j];

            if (candidate.readyToDisplay == true) continue

            printC(candidate,"2","candidate","r")

            let convData = []
            if (candidate.conversationID) {

              convData = await Conversation.find({ _id: candidate.conversationID }).select('_id userID questionsAnswered');

            } else {

              convData = await Conversation.find({ userID: candidate.userID }).select('_id userID questionsAnswered');
            }

            
            
            // from convData filter out the conversations that have questionsAnswered.length == 0

            convData = convData.filter(conv => conv.questionsAnswered.length > 0)

            printC(convData,"3","convData","p")

            for (let k=0;k<convData.length;k++){ // loop on conversations
              const conversationN = convData[k];

              questionAnswered = conversationN.questionsAnswered
              

              for (let pl = 0; pl< questionAnswered.length;pl++){ // loop on questionsAnswered
                const questionAnsweredN = questionAnswered[pl];

                questionID = questionAnsweredN.questionID

                if (questionsToAskObj[questionID]) {
                  printC(questionID,"3","questionID","y")
                  if (questionsToAskObj[questionID].usersAnswers == undefined) {
                    questionsToAskObj[questionID] = {
                      ...questionsToAskObj[questionID]._doc,
                      usersAnswers: {}
                    }
                    // console.log("candidate.userID = " , candidate.userID)

                  }
                  

                  if (questionsToAskObj[questionID].usersAnswers[candidate.userID] == undefined) {
                    questionsToAskObj[questionID].usersAnswers[candidate.userID] = [questionAnsweredN]
                  } else {
                    questionsToAskObj[questionID].usersAnswers[candidate.userID].push(questionAnsweredN)
                  }

                  // printC(questionsToAskObj[questionID],"3","questionsToAskObj[questionID]","y")
                   
                  
                }

              }
            }

            // sfd00

          }


          // console.log("questionsToAskObj = " , questionsToAskObj)

          printC(questionsToAskObj,"4","questionsToAskObj","b")

          // loop throw the oboject questionsToAskObj
          for (let questionID in questionsToAskObj) {
            let questionInfo = questionsToAskObj[questionID];

            questionContent = await QuestionsEdenAI.findOne({ _id: questionInfo.questionID }).select('_id content contentSmall');
            questionContent = await updateQuestionSmall(questionContent)

            // questionInfo.questionsToAskObj[questionID].questionContentSmall =  questionContent?.contentSmall


            if (!questionInfo._doc) {
              questionsToAskObj[questionID].questionContent =  questionContent?.content
              questionsToAskObj[questionID].questionContentSmall =  questionContent?.contentSmall

              // questionInfo.questionsToAskObj[questionID].questionContent =  questionContent?.content
              // questionInfo.questionsToAskObj[questionID].questionContentSmall =  questionContent?.contentSmall
            } else {
              questionsToAskObj[questionID] = {
                ...questionInfo._doc,
                questionContent: questionContent?.content,
                questionContentSmall: questionContent?.contentSmall
              }
              // questionInfo.questionsToAskObj[questionID] = {
              //   ...questionInfo._doc,
              //   questionContent: questionContent?.content,
              //   questionContentSmall: questionContent?.contentSmall
              // }
            }

            questionInfo = questionsToAskObj[questionID];

            if (questionInfo.bestAnswer == undefined) { // If we don't have a best answer for this quesiton

              for (userID in questionInfo.usersAnswers) {
                qLen = questionInfo.usersAnswers[userID].length -1

                if (candidateResult[userID] == undefined) {
                  // candidateResult[userID] // add on candidateResult[userID] the questionID questionID and the value questionInfo.usersAnswers[userID][0]

                  candidateResult[userID] = {
                    [questionID]: questionInfo.usersAnswers[userID][qLen] // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
                  }
                } else {
                  candidateResult[userID][questionID] = questionInfo.usersAnswers[userID][qLen] // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
                }
              }

            }else {

              const questionN = questionContent?.content
              const bestAnswerN = questionInfo.bestAnswer

              for (userID in questionInfo.usersAnswers) {

                qLen = questionInfo.usersAnswers[userID].length -1

                const answerN = questionInfo.usersAnswers[userID][qLen].summaryOfAnswer.replace(/[<>]/g, "")

                printC(questionN,"5","questionN","y")
                printC(bestAnswerN,"5","bestAnswerN","y")
                printC(answerN,"5","answerN","y")


                let promptEvaluate = `
                QUESTION: <${questionN}>

                BEST DESIRED answer: <${bestAnswerN}>

                USER answer: <${answerN}>

                How much you will rate the USER VS the BEST DESIRED answer,  1 to 10

                First, give only a number from 1 to 10, then give a really concise reason in 3 bullet points, every bullet point can have maximum 6 words:

                Example 
                EVALUATE: 6
                REASON: the reason...
                `


                let evaluateResult = await useGPTchatSimple(promptEvaluate)

                // separate the result on EVALUATE and REASON on two different variables, using regex, it should work for all caps and all small letters

     
                printC(evaluateResult,"5.5","evaluateResult","g")

                // const evaluateRegex = /<evaluate:\s*(\d+)\s*/i;
                // const reasonRegex = /reason:\s*(.*)>/i;

                // const evaluateMatch = evaluateResult.toLowerCase().match(evaluateRegex);
                // const reasonMatch = evaluateResult.toLowerCase().match(reasonRegex);

                // const evaluate = evaluateMatch ? evaluateMatch[1] : null;
                // const reason = reasonMatch ? reasonMatch[1] : null;

                const regex = /evaluate\s*:\s*(\d+)\s*.*?reason\s*:\s*(.*)/is;
                const result = regex.exec(evaluateResult);

                const evaluate = result[1]; // "3"
                const reason = result[2].trim();

                printC(evaluate,"5","evaluate","y")
                printC(reason,"5","reason","y")
                printC(questionInfo.usersAnswers[userID][qLen],"5","questionInfo.usersAnswers[userID][qLen]","y")


                qLen = questionInfo.usersAnswers[userID].length -1

                if (candidateResult[userID] == undefined) {
                  // candidateResult[userID] // add on candidateResult[userID] the questionID questionID and the value questionInfo.usersAnswers[userID][0]

                  candidateResult[userID] = {
                    [questionID]: {
                      ...questionInfo.usersAnswers[userID][qLen]._doc, // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
                      score: evaluate,
                      reason: reason
                    }
                  }
                } else {
                  candidateResult[userID][questionID] = {
                    ...questionInfo.usersAnswers[userID][qLen]._doc, // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
                    score: evaluate,
                    reason: reason
                  }
                }





              }

            }
            

          }

          printC(questionsToAskObj,"5","questionsToAskObj","b")

          printC(candidateResult,"6","candidateResult","p")


          // --------------- Return results on companyData ---------------
          for (j=0;j<companyData[i].candidates.length;j++){
            userIDn = companyData[i].candidates[j].userID

            companyData[i].candidates[j].readyToDisplay = true
            companyData[i].candidatesReadyToDisplay = true
            if (candidateResult[userIDn]) {
              console.log("candidateResult[userIDn] = " , candidateResult[userIDn])


              console.log(" questionsToAskObj[questionID] = " ,  questionsToAskObj[questionID])

              let summaryQuestions = []

              let overallScore = 0
              let numberQ = 0

              for (questionID in candidateResult[userIDn]) {
                summaryQuestions.push({
                  questionID: questionID,
                  questionContent: candidateResult[userIDn][questionID].questionContent,
                  questionContentSmall: questionsToAskObj[questionID]?.questionContentSmall,
                  answerContent: candidateResult[userIDn][questionID].summaryOfAnswer?.replace(/[<>]/g, ""),
                  answerContentSmall: candidateResult[userIDn][questionID].summaryOfAnswerSmall?.replace(/[<>]/g, ""),
                  reason: candidateResult[userIDn][questionID].reason,
                  score: candidateResult[userIDn][questionID].score,
                  subConversationAnswer: candidateResult[userIDn][questionID].subConversationAnswer,
                })

                if (candidateResult[userIDn][questionID].score != undefined){
                  overallScore += parseInt(candidateResult[userIDn][questionID].score)
                  numberQ += 1
                }
              }

              if (numberQ != 0) {
                const averageT = (overallScore/numberQ)*10
                companyData[i].candidates[j].overallScore = Math.floor(averageT);
              }

              companyData[i].candidates[j].summaryQuestions = summaryQuestions

              
              
            }
          }
          // --------------- Return results on companyData ---------------



          // ------------------ Update Company ----------------
          companyNowD = await Company.findOneAndUpdate(
            { _id: companyData[i]._id },
            {
              $set: {
                candidates: companyData[i].candidates,
                candidatesReadyToDisplay: companyData[i].candidatesReadyToDisplay
              }
            },
            { new: true }
          )
          if (company.candidates.length == 0){
            companyNowD = await Company.findOneAndUpdate(
              { _id: companyData[i]._id },
              {
                $set: {
                  candidatesReadyToDisplay: true
                }
              },
              { new: true }
            )
          }
          // ------------------ Update Company ----------------




        }

        


        return companyData
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateCompanyUserAnswers",
          { component: "companyMutation > updateCompanyUserAnswers" }
        );
      }
    },
    updateCompanyConvRecruiter: async (parent, args, context, info) => {
      const { companyIDs} = args.fields;
      console.log("Mutation > updateCompanyConvRecruiter > args.fields = ", args.fields);


      if (companyIDs)
        companyData = await Company.find({ 
          _id: companyIDs,
          // convRecruiterReadyToDisplay: { $ne: true } // SOS 🆘 - uncomment!!!
        });
      else {
        companyData = await Company.find({ convRecruiterReadyToDisplay: { $ne: true } }).select('_id name convRecruiter');
      }

      try {

        for (let i = 0; i < companyData.length; i++) { // Loop on companies
          let company = companyData[i];


          const convRecruiter = company.convRecruiter

          printC(convRecruiter,"0","convRecruiter","r")

          let conversationID = undefined
          if (convRecruiter.length == 0) {

            company.convRecruiterReadyToDisplay = true
            company = await company.save();

            continue

          } else {

            conversationID = convRecruiter[convRecruiter.length -1 ].conversationID
          }

          printC(conversationID,"0","conversationID","b")

          convData = await Conversation.findOne({ _id: conversationID }).select('_id userID conversation');

          printC(convData,"1","convData","b")

          let promptConv = "";
          for (let i = 0; i < convData.conversation.length; i++) {
            let convDataNow = convData.conversation[i];
            if (convDataNow.role == "assistant")
              promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
            else
              promptConv = promptConv + "Employ" + ": " + convDataNow.content + " \n\n";
          }

          printC(promptConv,"2","promptConv","b")


          const noteCategories = [{
              "content": "General info of Company",
              "enum": "company",
            },
            {
              "content": "Values of Company",
              "enum": "company"
            },
            {
              "content": "Industry of company",
              "enum": "company"
            },
            {

              "content": "Skills of the Candidate",
              "enum": "role"
            },
            {

              "content": "Responsibilities of the Candidate",
              "enum": "role"
           }];

          

    
          // make noteCategories into a string prompt
          let promptNoteCategory = "";
          for (let i = 0; i < noteCategories.length; i++) {
            promptNoteCategory = promptNoteCategory + "- " + noteCategories[i].content + " \n\n";
          }

      
          printC(promptNoteCategory,"3","promptNoteCategory","b")
    
          
        printC(promptNoteCategory,"4","promptNoteCategory","b")

          
    
          const promptNoteCategoryUser = `
          You have as input a conversation between an Recruiter and a Employ
    
          Conversation is inside <>: <${promptConv}>
    
          The Recruiter is trying to create some Notes for the company and the new Role that is Employ is looking for to put them in Categories
    
          Categories are inside <>: <${promptNoteCategory}>
    
          - You need make really small bullet points of information about the Candidate for every Category
          - Based on the conversation you can make from 0 to 4 bullet points for every Category
    
          For example: 
            <Category: title>
              - content
              - content
            <Category: title>
              - content
    
          Answer:
          `
        



        // console.log("noteCategories = " , noteCategories)




        printC(promptNoteCategoryUser,"0","promptNoteCategoryUser","g")

        // sdf0

        evaluateNoteCategories = await useGPTchatSimple(promptNoteCategoryUser)

        // evaluateNoteCategories = `
        // <Category: General info of Company>
        // - Candidate was not very responsive during the conversation
        // - Candidate was not very responsive during the conversation

        // <Category: Values of Company>
        // - No information gathered

        // <Category: Industry of company>
        // - Candidate has 11 years of experience in Computer Vision, Machine Learning, and Robotics

        // <Category: Skills of the Candidate>
        // - Candidate has expertise in Computer Vision, Machine Learning, and Robotics

        // <Category: Responsibilities of the Candidate>
        // - No information gathered about specific responsibilities in past projects
        // `


        printC(evaluateNoteCategories,"1","evaluateNoteCategories","g")

        // -------------- Split String -------------

        const regex = /<Category:\s*([^>]+)>([\s\S]*?)(?=<|$)/gs;
        const categoriesT = [];
        const newMemoryT = [];
        let result;
        while ((result = regex.exec(evaluateNoteCategories)) !== null) {
          const categoryName = result[1].trim()
          const category = {
            categoryName: categoryName,
            // reason: result[2].trim().split('\n').map(detail => detail.trim()),
            reason: result[2].trim(),
          };
          categoriesT.push(category);

          // separate the result[2] on \n and put it on newMemoryT
          const mem = result[2].trim().split('\n').map(detail => detail.trim())

          mem.forEach((memNow) => {
            newMemoryT.push({
              memoryContent: categoryName + ": " + memNow,
              pineConeID: "",
            })
          })
            

        }
        

        printC(categoriesT,"2","categoriesT","g")

        printC(newMemoryT,"2","newMemoryT","g")

        // asdf0
        // -------------- Split String -------------


        company.convRecruiter[company.convRecruiter.length - 1].companyQuestions = []
        company.convRecruiter[company.convRecruiter.length - 1].roleQuestions = []

        company.convRecruiter[company.convRecruiter.length - 1].readyToDisplay = true


        for (let i=0;i<categoriesT.length;i++){
          if (noteCategories[i].enum == "company") {
            printC(categoriesT[i],"3","categoriesT[i]","y")
            company.convRecruiter[company.convRecruiter.length - 1].companyQuestions.push({
              question: categoriesT[i].categoryName,
              content: categoriesT[i].reason,
            })
          } else {
            company.convRecruiter[company.convRecruiter.length - 1].roleQuestions.push({
              question: categoriesT[i].categoryName,
              content: categoriesT[i].reason,
            })
          }
        }


        // ------------ Delete previous memory ------------
        const convMemory = company.convRecruiter[company.convRecruiter.length - 1]?.convMemory
        if (convMemory.length >0) {
          deletePineIDs = convMemory.map(obj => obj.pineConeID)
          await deletePineCone(deletePineIDs)
        }
        // ------------ Delete previous memory ------------
        
        // -------------- Sent to PineCone --------------
        printC(newMemoryT,"2","newMemoryT","y")
        // newMemoryT.forEach(memorySaveN => {
        for (let i=0;i<newMemoryT.length;i++){
          const memorySaveN = newMemoryT[i].memoryContent;
          upsertSum = await upsertEmbedingPineCone({
            text: memorySaveN,
            _id: company._id,
            label: "Company_TrainEdenAI_memory",
          });
          printC(upsertSum,"2","upsertSum","y")

          newMemoryT[i].pineConeID = upsertSum.pineConeID
        }
        // -------------- Sent to PineCone --------------


        company.convRecruiter[company.convRecruiter.length - 1].convMemory = newMemoryT
        
        company.convRecruiterReadyToDisplay = true

        printC(company.convRecruiter, "3", "company.convRecruiter", "r")

        company = await company.save();

      }



        return companyData
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateCompanyConvRecruiter",
          { component: "companyMutation > updateCompanyConvRecruiter" }
        );
      }
    },
}



async function updateEmployees(arr1, arr2,compareKey = "userID") {

  // arr1New = [...arr1]
  arr2.forEach(employee2 => {
    const index = arr1.findIndex(employee1 => {

      
      if (employee1[compareKey] && employee2[compareKey]) return (employee1[compareKey].toString() == employee2[compareKey].toString())
      else return -1
      
    });
    if (index != -1) {
      // arr1[index] = {
      //   ...employee2,
      //   ...arr1[index],
      //   readyToDisplay: false,
      // }
      arr1[index].readyToDisplay = false
      if (employee2.conversationID){
        arr1[index].conversationID = employee2.conversationID
      }
    } else {
      arr1.push({
        ...employee2,
        readyToDisplay: false,
      });

      if (employee2.conversationID){
        arr1[arr1.length - 1].conversationID = employee2.conversationID
      }

    }
  });


  return arr1;
}