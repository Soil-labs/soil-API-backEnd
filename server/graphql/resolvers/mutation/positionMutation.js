const { ApolloError } = require("apollo-server-express");

const { Position } = require("../../../models/positionModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Company } = require("../../../models/companyModel");


const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const {
  addMultipleQuestionsToEdenAIFunc,
  updateQuestionSmall,
} = require("../utils/questionsEdenAIModules");

const { checkAndAddPositionToMember } = require("../utils/positionModules");

const { printC } = require("../../../printModule");

const {
  useGPTchatSimple,
  deletePineCone,
  upsertEmbedingPineCone,
  findBestEmbedings,
  getMemory,
} = require("../utils/aiModules");

const { arrayToObj } = require("../utils/endorsementModules");

module.exports = {
  updatePosition: async (parent, args, context, info) => {
    const { _id, name, companyID } = args.fields;
    console.log("Mutation > updatePosition > args.fields = ", args.fields);

    try {
      let positionData;
      if (_id) {
        positionData = await Position.findOne({ _id });

        // update
        if (name) positionData.name = name;
        await positionData.save();
      } else {
        if (!companyID) {
          throw new ApolloError("Company ID is required", "updatePosition", {
            component: "positionMutation > updatePosition",
          });
        }
        positionData = await new Position({
          name,
          companyID: companyID,
        });

        await positionData.save();

        //@TODO missing add position to company
      }

      let companyData = await Company.findOne({ _id: companyID })


      // ------------------- Add position to company -------------------

      
      // ------------------- Add position to company -------------------



      return {
        _id: positionData._id,
        name: positionData.name,
        company: companyData,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updatePosition",
        { component: "positionMutation > updatePosition" }
      );
    }
  },
  interviewQuestionCreationUserPosition: async (
    parent,
    args,
    context,
    info
  ) => {
    const { positionID, userID } = args.fields;
    console.log(
      "Mutation > interviewQuestionCreationUser > args.fields = ",
      args.fields
    );

    if (!positionID)
      throw new ApolloError(
        "Position ID is required",
        "interviewQuestionCreationUser",
        { component: "positionMutation > interviewQuestionCreationUser" }
      );

    if (!userID)
      throw new ApolloError(
        "User ID is required",
        "interviewQuestionCreationUser",
        { component: "positionMutation > interviewQuestionCreationUser" }
      );

    try {
      positionData = await Position.findOne({ _id: positionID }).select(
        "_id name questionsToAsk convRecruiter"
      );
      if (!positionData)
        throw new ApolloError(
          "Position not found",
          "interviewQuestionCreationUser",
          { component: "positionMutation > interviewQuestionCreationUser" }
        );

      userData = await Members.findOne({ _id: userID }).select(
        "_id discordName"
      );
      if (!userData)
        throw new ApolloError(
          "User not found",
          "interviewQuestionCreationUser",
          { component: "positionMutation > interviewQuestionCreationUser" }
        );

      const questionsToAsk = positionData.questionsToAsk;

      const questionsToAskID = questionsToAsk.map(
        (question) => question.questionID
      );

      questionData = await QuestionsEdenAI.find({
        _id: questionsToAskID,
      }).select("_id content");

      printC(questionData, "1", "questionData", "b");

      questionsThatWereAsked = "";

      for (let i = 0; i < questionData.length; i++) {
        const questionNow = questionData[i];

        // printC(questionNow,"2","questionNow","g")

        let filter = {};

        // ------- Find best Open Job Role Memories ----------
        filter = {
          label: "Position_TrainEdenAI_memory",
          _id: positionID,
        };

        bestJobRoleMemories = await getMemory(
          questionNow.content,
          filter,
          (topK = 3),
          250
        );

        // printC(bestJobRoleMemories,"3","bestJobRoleMemories","p")
        // ------- Find best Open Job Role Memories ----------

        // ------- Find best Open Job Role Memories ----------
        filter = {
          label: "CV_user_memory",
          _id: userID,
        };

        bestUserCVMemories = await getMemory(
          questionNow.content,
          filter,
          (topK = 3),
          250
        );

        // printC(bestUserCVMemories,"3","bestUserCVMemories","r")
        // ------- Find best Open Job Role Memories ----------

        console.log("----------------------------");

        // -------- Create Prompt ---------
        let promptAll = `
            ORIGINAL QUESTION (delimiters <>): <${questionNow.content}>

            JOB ROLE INFORMATION (delimiters <>): <${bestJobRoleMemories}>

            USER CV INFORMATION (delimiters <>): <${bestUserCVMemories}>
            
          `;
        printC(promptAll, "3", "promptAll", "b");
        // -------- Create Prompt ---------

        // questionsThatWereAsked += "- " + questionCreated + "\n\n"
      }

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "interviewQuestionCreationUser",
        { component: "positionMutation > interviewQuestionCreationUser" }
      );
    }
  },
  updateUrl: async (parent, args, context, info) => {
    const { positionID } = args.fields;
    let { url } = args.fields;
    console.log("Mutation > updateUrl > args.fields = ", args.fields);

    if (!url)
      throw new ApolloError("Url is required", "updateUrl", {
        component: "positionMutation > updateUrl",
      });

    if (!positionID)
      throw new ApolloError("Position ID is required", "updateUrl", {
        component: "positionMutation > updateUrl",
      });

    positionData = await Position.findOne({ _id: positionID });

    if (!positionData)
      throw new ApolloError("Position not found", "updateUrl", {
        component: "positionMutation > updateUrl",
      });

    try {
      // find one and updates
      let positionDataN = await Position.findOneAndUpdate(
        { _id: positionID },
        { url: url },
        { new: true }
      );

      return positionDataN;
    } catch (err) {
      throw new ApolloError(err.message, err.extensions?.code || "updateUrl", {
        component: "positionMutation > updateUrl",
      });
    }
  },
  addQuestionsToAskPosition: async (parent, args, context, info) => {
    const { positionID } = args.fields;
    let { questionsToAsk } = args.fields;
    console.log(
      "Mutation > addQuestionsToAskPosition > args.fields = ",
      args.fields
    );

    if (!questionsToAsk)
      throw new ApolloError(
        "Questions is required",
        "addQuestionsToAskPosition",
        { component: "positionMutation > addQuestionsToAskPosition" }
      );

    if (!positionID)
      throw new ApolloError(
        "Position ID is required",
        "addQuestionsToAskPosition",
        { component: "positionMutation > addQuestionsToAskPosition" }
      );

    positionData = await Position.findOne({ _id: positionID });

    if (!positionData)
      throw new ApolloError("Position not found", "addQuestionsToAskPosition", {
        component: "positionMutation > addQuestionsToAskPosition",
      });

    try {
      questionsToAsk = await addMultipleQuestionsToEdenAIFunc(questionsToAsk);

      console.log("questionsToAsk = ", questionsToAsk);
      // asdf12

      let questionsToAskN = await updateArray(
        positionData.questionsToAsk,
        questionsToAsk,
        "questionID"
      );

      console.log("questionsToAskN = ", questionsToAskN);

      // find one and updates
      let positionDataN = await Position.findOneAndUpdate(
        { _id: positionID },
        { questionsToAsk: questionsToAskN },
        { new: true }
      );

      return positionDataN;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addQuestionsToAskPosition",
        { component: "positionMutation > addQuestionsToAskPosition" }
      );
    }
  },
  deleteQuestionsToAskPosition: async (parent, args, context, info) => {
    const { positionID, questionID } = args.fields;
    console.log(
      "Mutation > deleteQuestionsToAskPosition > args.fields = ",
      args.fields
    );

    if (!positionID)
      throw new ApolloError(
        "Position ID is required",
        "deleteQuestionsToAskPosition",
        { component: "positionMutation > deleteQuestionsToAskPosition" }
      );

    positionData = await Position.findOne({ _id: positionID });

    if (!positionData)
      throw new ApolloError(
        "Position not found",
        "deleteQuestionsToAskPosition",
        { component: "positionMutation > deleteQuestionsToAskPosition" }
      );

    try {
      questionsToAsk = positionData.questionsToAsk;

      console.log("questionsToAsk = ", questionsToAsk);

      // filter out the questionID
      questionsToAsk = questionsToAsk.filter(
        (question) => question.questionID.toString() != questionID.toString()
      );

      // save it to mongo
      let positionDataN = await Position.findOneAndUpdate(
        { _id: positionID },
        { questionsToAsk },
        { new: true }
      );

      return positionDataN;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "deleteQuestionsToAskPosition",
        { component: "positionMutation > deleteQuestionsToAskPosition" }
      );
    }
  },
  addCandidatesPosition: async (parent, args, context, info) => {
    const { positionID, candidates } = args.fields;
    console.log(
      "Mutation > addCandidatesPosition > args.fields = ",
      args.fields
    );

    if (!candidates)
      throw new ApolloError("Candidate is required", "addCandidatesPosition", {
        component: "positionMutation > addCandidatesPosition",
      });

    if (!positionID)
      throw new ApolloError(
        "Position ID is required",
        "addCandidatesPosition",
        { component: "positionMutation > addCandidatesPosition" }
      );

    positionData = await Position.findOne({ _id: positionID });

    if (!positionData)
      throw new ApolloError("Position not found", "addCandidatesPosition", {
        component: "positionMutation > addCandidatesPosition",
      });

    userIDs = candidates.map((candidate) => candidate.userID);

    usersData = await Members.find({ _id: { $in: userIDs } }).select(
      "_id discordName positionsApplied"
    );

    try {
      let candidatesN = await updateArray(
        positionData.candidates,
        candidates,
        "userID"
      );

      console.log("candidatesN = ", candidatesN);
      // sdf00

      await checkAndAddPositionToMember(usersData, positionID);

      // find one and updates
      let positionDataN = await Position.findOneAndUpdate(
        { _id: positionID },
        {
          candidates: candidatesN,
          candidatesReadyToDisplay: false,
        },
        { new: true }
      );

      return positionDataN;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addCandidatesPosition",
        { component: "positionMutation > addCandidatesPosition" }
      );
    }
  },
  addConvRecruiterToPosition: async (parent, args, context, info) => {
    const { positionID, userID, conversationID } = args.fields;
    console.log(
      "Mutation > addConvRecruiterToPosition > args.fields = ",
      args.fields
    );

    if (!userID)
      throw new ApolloError(
        "userID is required",
        "addConvRecruiterToPosition",
        { component: "positionMutation > addConvRecruiterToPosition" }
      );

    if (!positionID)
      throw new ApolloError(
        "Position ID is required",
        "addConvRecruiterToPosition",
        { component: "positionMutation > addConvRecruiterToPosition" }
      );
    positionData = await Position.findOne({ _id: positionID });
    if (!positionData)
      throw new ApolloError(
        "Position not found",
        "addConvRecruiterToPosition",
        { component: "positionMutation > addConvRecruiterToPosition" }
      );

    if (!conversationID)
      throw new ApolloError(
        "conversationID is required",
        "addConvRecruiterToPosition",
        { component: "positionMutation > addConvRecruiterToPosition" }
      );

    try {
      // check if inside positionData.convRecruiter already conversationID exists
      let convRecruiterData = positionData.convRecruiter.find(
        (convRecruiter) =>
          convRecruiter.conversationID.toString() == conversationID.toString()
      );

      if (!convRecruiterData) {
        positionData.convRecruiter.push({
          userID: userID,
          conversationID: conversationID,
          readyToDisplay: false,
        });
      } else {
        convRecruiterData.readyToDisplay = false;
      }

      // save it to mongo
      positionData.convRecruiterReadyToDisplay = false;
      positionData = await positionData.save();

      // // find one and updates
      // let positionDataN = await Position.findOneAndUpdate(
      //   { _id: positionID },
      //   {
      //     candidates: candidatesN,
      //     candidatesReadyToDisplay: false
      //   },
      //   { new: true }
      // );

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addConvRecruiterToPosition",
        { component: "positionMutation > addConvRecruiterToPosition" }
      );
    }
  },

  addNodesToPosition: async (parent, args, context, info) => {
    let { positionID, nodes } = args.fields;

    console.log("Mutation > addNodesToPosition > args.fields = ", args.fields);

    if (!positionID) throw new ApolloError("positionID is required");

    if (!nodes) throw new ApolloError("nodes is required");

    try {
      let positionData = await Position.findOne({ _id: positionID }).select(
        "_id name nodes"
      );

      printC(positionData, "0", "positionData", "b");

      nodesIDArray = nodes.map((node) => node.nodeID);

      printC(nodesIDArray, "1", "nodesIDArray", "g");

      let nodesData = await Node.find({ _id: nodesIDArray }).select(
        "_id name node "
      );

      printC(nodesData, "2", "nodesData", "g");

      let nodesDataOriginalArray = positionData.nodes.map(function (item) {
        return item.nodeID.toString();
      });

      printC(nodesDataOriginalArray, "1", "nodesDataOriginalArray", "b");

      // check if the nodes are already in the position if they don't then add it to the positionData.nodes and save it to mongo
      for (let i = 0; i < nodesData.length; i++) {
        let nodeData = nodesData[i];

        if (!nodesDataOriginalArray.includes(nodeData._id.toString())) {
          positionData.nodes.push({
            nodeID: nodeData._id,
          });
        }
      }

      printC(positionData, "1", "positionData", "b");

      // save it to mongo
      positionData = await positionData.save();

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addNodesToPosition",
        { component: "positionMutation > addNodesToPosition" }
      );
    }
  },

  createTalentListPosition: async (parent, args, context, info) => {
    const { positionID, name, talentListID } = args.fields;
    console.log(
      "Mutation > createTalentListPosition > args.fields = ",
      args.fields
    );

    try {
      positionData = await Position.findOne({ _id: positionID }).select(
        "_id name talentList"
      );

      console.log("positionData = ", positionData);

      if (talentListID) {
        // search inside positionData.talentList if talentListID is already there
        let talentListData = positionData.talentList.find(
          (talentList) => talentList._id.toString() == talentListID.toString()
        );

        if (!talentListData) {
          positionData.talentList.push({
            _id: talentListID,
            name: name,
          });
        } else {
          // update the name
          talentListData.name = name;
        }
      } else {
        positionData.talentList.push({
          name: name,
        });
      }

      // save it to mongo
      positionData = await positionData.save();

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "createTalentListPosition",
        { component: "positionMutation > createTalentListPosition" }
      );
    }
  },

  updateUsersTalentListPosition: async (parent, args, context, info) => {
    const { positionID, talentListID, usersTalentList } = args.fields;
    console.log(
      "Mutation > updateUsersTalentListPosition > args.fields = ",
      args.fields
    );

    try {
      positionData = await Position.findOne({ _id: positionID }).select(
        "_id name talentList"
      );

      if (!positionData)
        throw new ApolloError(
          "Position not found",
          "updateUsersTalentListPosition",
          { component: "positionMutation > updateUsersTalentListPosition" }
        );

      // change from usersTalentList which is an array, to talent an array of objects with userID
      let talent = usersTalentList.map((userTalentID) => {
        return {
          userID: userTalentID,
        };
      });

      console.log("talent = ", talent);

      // find the talentListID and update the talent

      let talentListData = positionData.talentList.find(
        (talentList) => talentList._id.toString() == talentListID.toString()
      );

      // update talent
      talentListData.talent = talent;

      // save it to mongo
      positionData = await positionData.save();

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateUsersTalentListPosition",
        { component: "positionMutation > updateUsersTalentListPosition" }
      );
    }
  },

  updatePositionUserAnswers: async (parent, args, context, info) => {
    const { positionIDs } = args.fields;
    console.log(
      "Mutation > updatePositionUserAnswers > args.fields = ",
      args.fields
    );

    if (positionIDs)
      positionData = await Position.find({
        _id: positionIDs,
        // candidatesReadyToDisplay: { $ne: true } // SOS 🆘 - uncomment!!!
      });
    else
      positionData = await Position.find({
        candidatesReadyToDisplay: { $ne: true },
      });

    try {
      let candidateResult = {};

      for (let i = 0; i < positionData.length; i++) {
        // Loop on positions
        const position = positionData[i];

        questionsToAsk = position.questionsToAsk;

        printC(questionsToAsk, "0", "questionsToAsk", "g");

        let questionsToAskObj = await arrayToObj(questionsToAsk, "questionID");

        printC(questionsToAskObj, "1", "questionsToAskObj", "b");

        candidates = position.candidates;

        for (let j = 0; j < candidates.length; j++) {
          // loop on candidates

          const candidate = candidates[j];

          if (candidate.readyToDisplay == true) continue;

          printC(candidate, "2", "candidate", "r");

          let convData = [];
          if (candidate.conversationID) {
            convData = await Conversation.find({
              _id: candidate.conversationID,
            }).select("_id userID questionsAnswered");
          } else {
            convData = await Conversation.find({
              userID: candidate.userID,
            }).select("_id userID questionsAnswered");
          }

          // from convData filter out the conversations that have questionsAnswered.length == 0

          convData = convData.filter(
            (conv) => conv.questionsAnswered.length > 0
          );

          printC(convData, "3", "convData", "p");

          for (let k = 0; k < convData.length; k++) {
            // loop on conversations
            const conversationN = convData[k];

            questionAnswered = conversationN.questionsAnswered;

            for (let pl = 0; pl < questionAnswered.length; pl++) {
              // loop on questionsAnswered
              const questionAnsweredN = questionAnswered[pl];

              questionID = questionAnsweredN.questionID;

              if (questionsToAskObj[questionID]) {
                printC(questionID, "3", "questionID", "y");
                if (questionsToAskObj[questionID].usersAnswers == undefined) {
                  questionsToAskObj[questionID] = {
                    ...questionsToAskObj[questionID]._doc,
                    usersAnswers: {},
                  };
                  // console.log("candidate.userID = " , candidate.userID)
                }

                if (
                  questionsToAskObj[questionID].usersAnswers[
                    candidate.userID
                  ] == undefined
                ) {
                  questionsToAskObj[questionID].usersAnswers[candidate.userID] =
                    [questionAnsweredN];
                } else {
                  questionsToAskObj[questionID].usersAnswers[
                    candidate.userID
                  ].push(questionAnsweredN);
                }

                // printC(questionsToAskObj[questionID],"3","questionsToAskObj[questionID]","y")
              }
            }
          }

          // sfd00
        }

        // console.log("questionsToAskObj = " , questionsToAskObj)

        printC(questionsToAskObj, "4", "questionsToAskObj", "b");

        // loop throw the oboject questionsToAskObj
        for (let questionID in questionsToAskObj) {
          let questionInfo = questionsToAskObj[questionID];

          questionContent = await QuestionsEdenAI.findOne({
            _id: questionInfo.questionID,
          }).select("_id content contentSmall");
          questionContent = await updateQuestionSmall(questionContent);

          // questionInfo.questionsToAskObj[questionID].questionContentSmall =  questionContent?.contentSmall

          if (!questionInfo._doc) {
            questionsToAskObj[questionID].questionContent =
              questionContent?.content;
            questionsToAskObj[questionID].questionContentSmall =
              questionContent?.contentSmall;

            // questionInfo.questionsToAskObj[questionID].questionContent =  questionContent?.content
            // questionInfo.questionsToAskObj[questionID].questionContentSmall =  questionContent?.contentSmall
          } else {
            questionsToAskObj[questionID] = {
              ...questionInfo._doc,
              questionContent: questionContent?.content,
              questionContentSmall: questionContent?.contentSmall,
            };
            // questionInfo.questionsToAskObj[questionID] = {
            //   ...questionInfo._doc,
            //   questionContent: questionContent?.content,
            //   questionContentSmall: questionContent?.contentSmall
            // }
          }

          questionInfo = questionsToAskObj[questionID];

          if (questionInfo.bestAnswer == undefined) {
            // If we don't have a best answer for this quesiton

            for (userID in questionInfo.usersAnswers) {
              qLen = questionInfo.usersAnswers[userID].length - 1;

              if (candidateResult[userID] == undefined) {
                // candidateResult[userID] // add on candidateResult[userID] the questionID questionID and the value questionInfo.usersAnswers[userID][0]

                candidateResult[userID] = {
                  [questionID]: questionInfo.usersAnswers[userID][qLen], // SOS 🆘 -> right now I only take the first answer, this need to cahnge!
                };
              } else {
                candidateResult[userID][questionID] =
                  questionInfo.usersAnswers[userID][qLen]; // SOS 🆘 -> right now I only take the first answer, this need to cahnge!
              }
            }
          } else {
            const questionN = questionContent?.content;
            const bestAnswerN = questionInfo.bestAnswer;

            for (userID in questionInfo.usersAnswers) {
              qLen = questionInfo.usersAnswers[userID].length - 1;

              const answerN = questionInfo.usersAnswers[userID][
                qLen
              ].summaryOfAnswer.replace(/[<>]/g, "");

              printC(questionN, "5", "questionN", "y");
              printC(bestAnswerN, "5", "bestAnswerN", "y");
              printC(answerN, "5", "answerN", "y");

              let promptEvaluate = `
                QUESTION: <${questionN}>

                BEST DESIRED answer: <${bestAnswerN}>

                USER answer: <${answerN}>

                How much you will rate the USER VS the BEST DESIRED answer,  1 to 10

                First, give only a number from 1 to 10, then give a really concise reason in 3 bullet points, every bullet point can have maximum 6 words:

                Example 
                EVALUATE: 6
                REASON: the reason...
                `;

              let evaluateResult = await useGPTchatSimple(promptEvaluate);

              // separate the result on EVALUATE and REASON on two different variables, using regex, it should work for all caps and all small letters

              printC(evaluateResult, "5.5", "evaluateResult", "g");

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

              printC(evaluate, "5", "evaluate", "y");
              printC(reason, "5", "reason", "y");
              printC(
                questionInfo.usersAnswers[userID][qLen],
                "5",
                "questionInfo.usersAnswers[userID][qLen]",
                "y"
              );

              qLen = questionInfo.usersAnswers[userID].length - 1;

              if (candidateResult[userID] == undefined) {
                // candidateResult[userID] // add on candidateResult[userID] the questionID questionID and the value questionInfo.usersAnswers[userID][0]

                candidateResult[userID] = {
                  [questionID]: {
                    ...questionInfo.usersAnswers[userID][qLen]._doc, // SOS 🆘 -> right now I only take the first answer, this need to cahnge!
                    score: evaluate,
                    reason: reason,
                  },
                };
              } else {
                candidateResult[userID][questionID] = {
                  ...questionInfo.usersAnswers[userID][qLen]._doc, // SOS 🆘 -> right now I only take the first answer, this need to cahnge!
                  score: evaluate,
                  reason: reason,
                };
              }
            }
          }
        }

        printC(questionsToAskObj, "5", "questionsToAskObj", "b");

        printC(candidateResult, "6", "candidateResult", "p");

        // --------------- Return results on positionData ---------------
        for (j = 0; j < positionData[i].candidates.length; j++) {
          userIDn = positionData[i].candidates[j].userID;

          positionData[i].candidates[j].readyToDisplay = true;
          positionData[i].candidatesReadyToDisplay = true;
          if (candidateResult[userIDn]) {
            console.log(
              "candidateResult[userIDn] = ",
              candidateResult[userIDn]
            );

            console.log(
              " questionsToAskObj[questionID] = ",
              questionsToAskObj[questionID]
            );

            let summaryQuestions = [];

            let overallScore = 0;
            let numberQ = 0;

            for (questionID in candidateResult[userIDn]) {
              summaryQuestions.push({
                questionID: questionID,
                questionContent:
                  candidateResult[userIDn][questionID].questionContent,
                questionContentSmall:
                  questionsToAskObj[questionID]?.questionContentSmall,
                answerContent: candidateResult[userIDn][
                  questionID
                ].summaryOfAnswer?.replace(/[<>]/g, ""),
                answerContentSmall: candidateResult[userIDn][
                  questionID
                ].summaryOfAnswerSmall?.replace(/[<>]/g, ""),
                reason: candidateResult[userIDn][questionID].reason,
                score: candidateResult[userIDn][questionID].score,
                subConversationAnswer:
                  candidateResult[userIDn][questionID].subConversationAnswer,
              });

              if (candidateResult[userIDn][questionID].score != undefined) {
                overallScore += parseInt(
                  candidateResult[userIDn][questionID].score
                );
                numberQ += 1;
              }
            }

            if (numberQ != 0) {
              const averageT = (overallScore / numberQ) * 10;
              positionData[i].candidates[j].overallScore = Math.floor(averageT);
            }

            positionData[i].candidates[j].summaryQuestions = summaryQuestions;
          }
        }
        // --------------- Return results on positionData ---------------

        // ------------------ Update Position ----------------
        positionNowD = await Position.findOneAndUpdate(
          { _id: positionData[i]._id },
          {
            $set: {
              candidates: positionData[i].candidates,
              candidatesReadyToDisplay:
                positionData[i].candidatesReadyToDisplay,
            },
          },
          { new: true }
        );
        if (position.candidates.length == 0) {
          positionNowD = await Position.findOneAndUpdate(
            { _id: positionData[i]._id },
            {
              $set: {
                candidatesReadyToDisplay: true,
              },
            },
            { new: true }
          );
        }
        // ------------------ Update Position ----------------
      }

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updatePositionUserAnswers",
        { component: "positionMutation > updatePositionUserAnswers" }
      );
    }
  },
  updatePositionConvRecruiter: async (parent, args, context, info) => {
    const { positionIDs } = args.fields;
    console.log(
      "Mutation > updatePositionConvRecruiter > args.fields = ",
      args.fields
    );

    if (positionIDs)
      positionData = await Position.find({
        _id: positionIDs,
        // convRecruiterReadyToDisplay: { $ne: true } // SOS 🆘 - uncomment!!!
      });
    else {
      positionData = await Position.find({
        convRecruiterReadyToDisplay: { $ne: true },
      }).select("_id name convRecruiter");
    }

    try {
      for (let i = 0; i < positionData.length; i++) {
        // Loop on positions
        let position = positionData[i];

        const convRecruiter = position.convRecruiter;

        printC(convRecruiter, "0", "convRecruiter", "r");

        let conversationID = undefined;
        if (convRecruiter.length == 0) {
          position.convRecruiterReadyToDisplay = true;
          position = await position.save();

          continue;
        } else {
          conversationID =
            convRecruiter[convRecruiter.length - 1].conversationID;
        }

        printC(conversationID, "0", "conversationID", "b");

        convData = await Conversation.findOne({ _id: conversationID }).select(
          "_id userID conversation"
        );

        printC(convData, "1", "convData", "b");

        let promptConv = "";
        for (let i = 0; i < convData.conversation.length; i++) {
          let convDataNow = convData.conversation[i];
          if (convDataNow.role == "assistant")
            promptConv =
              promptConv + "Recruiter: " + convDataNow.content + " \n\n";
          else
            promptConv =
              promptConv + "Employ" + ": " + convDataNow.content + " \n\n";
        }

        printC(promptConv, "2", "promptConv", "b");

        const noteCategories = [
          {
            content: "General info of Position",
            enum: "position",
          },
          {
            content: "Values of Position",
            enum: "position",
          },
          {
            content: "Industry of position",
            enum: "position",
          },
          {
            content: "Skills of the Candidate",
            enum: "role",
          },
          {
            content: "Responsibilities of the Candidate",
            enum: "role",
          },
        ];

        // make noteCategories into a string prompt
        let promptNoteCategory = "";
        for (let i = 0; i < noteCategories.length; i++) {
          promptNoteCategory =
            promptNoteCategory + "- " + noteCategories[i].content + " \n\n";
        }

        printC(promptNoteCategory, "3", "promptNoteCategory", "b");

        printC(promptNoteCategory, "4", "promptNoteCategory", "b");

        const promptNoteCategoryUser = `
          You have as input a conversation between an Recruiter and a Employ
    
          Conversation is inside <>: <${promptConv}>
    
          The Recruiter is trying to create some Notes for the position and the new Role that is Employ is looking for to put them in Categories
    
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
          `;

        // console.log("noteCategories = " , noteCategories)

        printC(promptNoteCategoryUser, "0", "promptNoteCategoryUser", "g");

        // sdf0

        evaluateNoteCategories = await useGPTchatSimple(promptNoteCategoryUser);

        // evaluateNoteCategories = `
        // <Category: General info of Position>
        // - Candidate was not very responsive during the conversation
        // - Candidate was not very responsive during the conversation

        // <Category: Values of Position>
        // - No information gathered

        // <Category: Industry of position>
        // - Candidate has 11 years of experience in Computer Vision, Machine Learning, and Robotics

        // <Category: Skills of the Candidate>
        // - Candidate has expertise in Computer Vision, Machine Learning, and Robotics

        // <Category: Responsibilities of the Candidate>
        // - No information gathered about specific responsibilities in past projects
        // `

        printC(evaluateNoteCategories, "1", "evaluateNoteCategories", "g");

        // -------------- Split String -------------

        const regex = /<Category:\s*([^>]+)>([\s\S]*?)(?=<|$)/gs;
        const categoriesT = [];
        const newMemoryT = [];
        let result;
        while ((result = regex.exec(evaluateNoteCategories)) !== null) {
          const categoryName = result[1].trim();
          const category = {
            categoryName: categoryName,
            // reason: result[2].trim().split('\n').map(detail => detail.trim()),
            reason: result[2].trim(),
          };
          categoriesT.push(category);

          // separate the result[2] on \n and put it on newMemoryT
          const mem = result[2]
            .trim()
            .split("\n")
            .map((detail) => detail.trim());

          mem.forEach((memNow) => {
            newMemoryT.push({
              memoryContent: categoryName + ": " + memNow,
              pineConeID: "",
            });
          });
        }

        printC(categoriesT, "2", "categoriesT", "g");

        printC(newMemoryT, "2", "newMemoryT", "g");

        // asdf0
        // -------------- Split String -------------

        position.convRecruiter[
          position.convRecruiter.length - 1
        ].positionQuestions = [];
        position.convRecruiter[
          position.convRecruiter.length - 1
        ].roleQuestions = [];

        position.convRecruiter[
          position.convRecruiter.length - 1
        ].readyToDisplay = true;

        for (let i = 0; i < categoriesT.length; i++) {
          if (noteCategories[i].enum == "position") {
            printC(categoriesT[i], "3", "categoriesT[i]", "y");
            position.convRecruiter[
              position.convRecruiter.length - 1
            ].positionQuestions.push({
              question: categoriesT[i].categoryName,
              content: categoriesT[i].reason,
            });
          } else {
            position.convRecruiter[
              position.convRecruiter.length - 1
            ].roleQuestions.push({
              question: categoriesT[i].categoryName,
              content: categoriesT[i].reason,
            });
          }
        }

        // ------------ Delete previous memory ------------
        const convMemory =
          position.convRecruiter[position.convRecruiter.length - 1]?.convMemory;
        if (convMemory.length > 0) {
          deletePineIDs = convMemory.map((obj) => obj.pineConeID);
          await deletePineCone(deletePineIDs);
        }
        // ------------ Delete previous memory ------------

        // -------------- Sent to PineCone --------------
        printC(newMemoryT, "2", "newMemoryT", "y");
        // newMemoryT.forEach(memorySaveN => {
        for (let i = 0; i < newMemoryT.length; i++) {
          const memorySaveN = newMemoryT[i].memoryContent;
          upsertSum = await upsertEmbedingPineCone({
            text: memorySaveN,
            _id: position._id,
            label: "Position_TrainEdenAI_memory",
          });
          printC(upsertSum, "2", "upsertSum", "y");

          newMemoryT[i].pineConeID = upsertSum.pineConeID;
        }
        // -------------- Sent to PineCone --------------

        position.convRecruiter[position.convRecruiter.length - 1].convMemory =
          newMemoryT;

        position.convRecruiterReadyToDisplay = true;

        printC(position.convRecruiter, "3", "position.convRecruiter", "r");

        position = await position.save();
      }

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updatePositionConvRecruiter",
        { component: "positionMutation > updatePositionConvRecruiter" }
      );
    }
  },
};

async function updateArray(arr1, arr2, compareKey) {
  // arr1New = [...arr1]
  arr2.forEach((item2) => {
    const index = arr1.findIndex((item1) => {
      if (item1[compareKey] && item2[compareKey])
        return item1[compareKey].toString() == item2[compareKey].toString();
      else return -1;
    });
    if (index !== -1) {
      arr1[index] = {
        ...item2,
        readyToDisplay: false,
      };
      if (item2.conversationID) {
        arr1[index].conversationID = item2.conversationID;
      }
    } else {
      arr1.push({
        ...item2,
        readyToDisplay: false,
      });

      if (item2.conversationID) {
        arr1[arr1.length - 1].conversationID = item2.conversationID;
      }
    }
  });

  return arr1;
}