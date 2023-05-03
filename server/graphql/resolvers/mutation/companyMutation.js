
const { ApolloError } = require("apollo-server-express");

const { Company } = require("../../../models/companyModel");
const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");



// const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const { addMultipleQuestionsToEdenAIFunc } = require("../utils/questionsEdenAIModules");

const {  } = require("../utils/companyModules");

const { printC } = require("../../../printModule");

const { useGPTchatSimple } = require("../utils/aiModules");


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

 
      try {


        let candidatesN = await updateEmployees(companyData.candidates, candidates,"userID");




        console.log("candidatesN = " , candidatesN)


        // find one and updates
        let companyDataN = await Company.findOneAndUpdate(
          { _id: companyID },
          { 
            candidates: candidatesN,
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
    
    updateCompanyUserAnswers: async (parent, args, context, info) => {
      const { companyIDs} = args.fields;
      console.log("Mutation > updateCompanyUserAnswers > args.fields = ", args.fields);


      // const input = "EVALUATE: 3 sdfjf9 . \n REASON: The USER answer did not provide specific details about the team projects they worked on and their role was limited to administrative tasks. The BEST DESIRED answer";
      // const regex = /evaluate\s*:\s*(\d+)\s*.*?reason\s*:\s*(.*)/is;
      // const result = regex.exec(input);

      // const evaluate = result[1]; // "3"
      // const reason = result[2].trim(); // "The USER answer did not provide specific details about the team projects they worked on and their role was limited to administrative tasks. The BEST DESIRED answer"

      // printC(evaluate,"0","evaluate","g")
      // printC(reason,"0","reason","g")
      // sdf


      if (companyIDs)
        companyData = await Company.find({ 
          _id: companyIDs,
          candidatesReadyToDisplay: { $ne: true }
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

            let convData = await Conversation.find({ userID: candidate.userID }).select('_id userID questionsAnswered');

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
            const questionInfo = questionsToAskObj[questionID];

            if (questionInfo.bestAnswer == undefined) { // If we don't have a best answer for this quesiton

              for (userID in questionInfo.usersAnswers) {
                if (candidateResult[userID] == undefined) {
                  // candidateResult[userID] // add on candidateResult[userID] the questionID questionID and the value questionInfo.usersAnswers[userID][0]

                  candidateResult[userID] = {
                    [questionID]: questionInfo.usersAnswers[userID][0] // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
                  }
                } else {
                  candidateResult[userID][questionID] = questionInfo.usersAnswers[userID][0] // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
                }
              }

            }else {
              questionContent = await QuestionsEdenAI.findOne({ _id: questionInfo.questionID }).select('_id content');

              
              if (!questionInfo._doc) {
                questionsToAskObj[questionID].questionContent =  questionContent.content
              } else {
                questionsToAskObj[questionID] = {
                  ...questionInfo._doc,
                  questionContent: questionContent.content
                }
              }

              const questionN = questionContent.content
              const bestAnswerN = questionInfo.bestAnswer

              for (userID in questionInfo.usersAnswers) {


                const answerN = questionInfo.usersAnswers[userID][0].summaryOfAnswer.replace(/[<>]/g, "")

                printC(questionN,"5","questionN","y")
                printC(bestAnswerN,"5","bestAnswerN","y")
                printC(answerN,"5","answerN","y")


                let promptEvaluate = `
                QUESTION: <${questionN}>

                BEST DESIRED answer: <${bestAnswerN}>

                USER answer: <${answerN}>

                How much you will rate the USER VS the BEST DESIRED answer,  1 to 10

                First, give only a number from 1 to 10, then give the reason:

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


                if (candidateResult[userID] == undefined) {
                  // candidateResult[userID] // add on candidateResult[userID] the questionID questionID and the value questionInfo.usersAnswers[userID][0]

                  candidateResult[userID] = {
                    [questionID]: {
                      ...questionInfo.usersAnswers[userID][0]._doc, // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
                      score: evaluate,
                      reason: reason
                    }
                  }
                } else {
                  candidateResult[userID][questionID] = {
                    ...questionInfo.usersAnswers[userID][0]._doc, // SOS 🆘 -> right now I only take the first answer, this need to cahnge! 
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


              let summaryQuestions = []

              let overallScore = 0
              let numberQ = 0

              for (questionID in candidateResult[userIDn]) {
                summaryQuestions.push({
                  questionID: questionID,
                  questionContent: candidateResult[userIDn][questionID].questionContent,
                  answerContent: candidateResult[userIDn][questionID].summaryOfAnswer.replace(/[<>]/g, ""),
                  reason: candidateResult[userIDn][questionID].reason,
                  score: candidateResult[userIDn][questionID].score,
                })

                if (candidateResult[userIDn][questionID].score != undefined){
                  overallScore += parseInt(candidateResult[userIDn][questionID].score)
                  numberQ += 1
                }
              }

              if (numberQ != 0) {
                companyData[i].candidates[j].overallScore = (overallScore/numberQ)*10
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
}

async function updateEmployees(arr1, arr2,compareKey = "userID") {

  // arr1New = [...arr1]
  arr2.forEach(employee2 => {
    const index = arr1.findIndex(employee1 => {

      
      if (employee1[compareKey] && employee2[compareKey]) return (employee1[compareKey].toString() == employee2[compareKey].toString())
      else return -1
      
    });
    if (index !== -1) {
      arr1[index] = {
        ...employee2,
        readyToDisplay: false,
      }
    } else {
      arr1.push({
        ...employee2,
        readyToDisplay: false,
      });

    }
  });


  return arr1;
}