const { ApolloError } = require("apollo-server-express");
const { Company } = require("../../../models/companyModel");
const { QueryResponse } = require("../../../models/queryResponseModel");

const { Position } = require("../../../models/positionModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const { useGPTFunc } = require("../utils/aiExtraModules");

const { wait } = require("../utils/aiExtraModules");

const {
  addMultipleQuestionsToEdenAIFunc,
  updateQuestionSmall,
} = require("../utils/questionsEdenAIModules");

const {
  checkAndAddPositionToMember,
  candidateEdenAnalysisPositionFunc,
  findKeyAttributeAndPotentialPositionFunc,
  findKeyAttributeAndPotentialCandidateFunc,
} = require("../utils/positionModules");

const { printC } = require("../../../printModule");

const {
  // deletePineCone,
  getMemory,
  interviewQuestionCreationUserFunc,
  reportPassFailCVPositionConversationFunc,
} = require("../utils/aiModules");

const { useGPTchatSimple } = require("../utils/aiExtraModules");

const {
  addMemoryPineconeFunc,
  deleteMemoriesPineconeFunc,
} = require("../utils/memoryPineconeModules");

const {
  createCardsCandidateForPositionFunc,
  calculateScoreCardCandidateToPositionFunc,
} = require("../utils/cardMemoryModules");

const { arrayToObj } = require("../utils/endorsementModules");

module.exports = {
  updatePosition: async (parent, args, context, info) => {
    const {
      _id,
      name,
      icon,
      conduct,
      mainUserID,
      status,
      whoYouAre,
      whatsToLove,
      whatTheJobInvolves,
    } = args.fields;
    let { companyID } = args.fields;
    console.log("Mutation > updatePosition > args.fields = ", args.fields);

    try {
      let positionData;

      let companyData;

      if (!_id && !companyID) {
        throw new ApolloError(
          "Position ID or Company ID is required",
          "updatePosition",
          { component: "positionMutation > updatePosition" }
        );
      }

      if (companyID) {
        companyData = await Company.findOne({ _id: companyID });
      }

      console.log("change = 1");

      if (_id) {
        positionData = await Position.findOne({ _id });

        if (name) positionData.name = name;
        if (companyID) positionData.companyID = companyID;
        if (icon) positionData.icon = icon;
        if (status) positionData.status = status;
        if (whatsToLove) positionData.whatsToLove = whatsToLove;
        if (whoYouAre) positionData.whoYouAre = whoYouAre;
        if (whatTheJobInvolves)
          positionData.whatTheJobInvolves = whatTheJobInvolves;

        // ----------------- conduct ----------------
        if (conduct) {
          if (conduct.number) {
            positionData.conduct.number = conduct.number;
          }

          if (conduct.whatsappNumber) {
            positionData.conduct.whatsappNumber = conduct.whatsappNumber;
          }

          if (conduct.email) {
            positionData.conduct.email = conduct.email;
          }

          if (conduct.telegram) {
            positionData.conduct.telegram = conduct.telegram;
          }
        }
        // ----------------- conduct ----------------
      } else {
        positionData = await new Position({
          name,
          icon,
          companyID,
          mainUserID,
          conduct,
          whatsToLove,
          whoYouAre,
          whatTheJobInvolves,
          talentList: [
            {
              name: "Accepted",
            },
            {
              name: "Rejected",
            },
          ],
        });
      }

      if (!companyID) {
        companyID = positionData.companyID;

        companyData = await Company.findOne({ _id: companyID });
      }

      if (!companyData) {
        throw new ApolloError("Could not find Company", "updatePosition", {
          component: "positionMutation > updatePosition",
        });
      }

      await positionData.save();

      console.log("positionData = ", positionData);
      // sdf0

      if (
        !companyData.positions.some(
          (_pos) =>
            _pos.positionID?.toString() === positionData.companyID?.toString()
        )
      ) {
        const _positions = [
          ...companyData.positions,
          { positionID: positionData._id },
        ];

        companyData = await Company.findOneAndUpdate(
          { _id: companyID },
          { positions: _positions }
        );
      }

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updatePosition",
        { component: "positionMutation > updatePosition" }
      );
    }
  },
  updatePositionGeneralDetails: async (parent, args, context, info) => {
    const {
      _id,
      startDate,
      visaRequired,
      officePolicy,
      officeLocation,
      contractType,
      contractDuration,
      socials,
      yearlySalary,
      status,
    } = args.fields;
    console.log(
      "Mutation > updatePositionGeneralDetails > args.fields = ",
      args.fields
    );

    try {
      if (!_id)
        throw new ApolloError("Position ID is required", "updateUrl", {
          component: "positionMutation > updateUrl",
        });

      positionData = await Position.findOne({ _id: _id });

      if (!positionData)
        throw new ApolloError("Position not found", "updateUrl", {
          component: "positionMutation > updateUrl",
        });

      if (status) positionData.status = status;
      if (startDate) positionData.generalDetails.startDate = startDate;
      if (visaRequired) positionData.generalDetails.visaRequired = visaRequired;
      if (officePolicy) positionData.generalDetails.officePolicy = officePolicy;
      if (officeLocation)
        positionData.generalDetails.officeLocation = officeLocation;
      if (contractType) positionData.generalDetails.contractType = contractType;
      if (contractDuration)
        positionData.generalDetails.contractDuration = contractDuration;
      if (yearlySalary) positionData.generalDetails.yearlySalary = yearlySalary;

      if (socials) {
        if (socials.portfolio)
          positionData.generalDetails.socials.portfolio = socials.portfolio;
        if (socials.linkedin)
          positionData.generalDetails.socials.linkedin = socials.linkedin;
        if (socials.twitter)
          positionData.generalDetails.socials.twitter = socials.twitter;
        if (socials.telegram)
          positionData.generalDetails.socials.telegram = socials.telegram;
        if (socials.github)
          positionData.generalDetails.socials.github = socials.github;
        if (socials.lens)
          positionData.generalDetails.socials.lens = socials.lens;
        if (socials.custom)
          positionData.generalDetails.socials.custom = socials.custom;
      }

      await positionData.save();

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updatePositionGeneralDetails",
        { component: "positionMutation > updatePositionGeneralDetails" }
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

  autoUpdatePositionCompInformation: async (parent, args, context, info) => {
    const { positionID, mustUpdate } = args.fields;
    let { url } = args.fields;
    try {
      positionData = await Position.findOne({ _id: positionID }).select(
        "-candidates"
      );
      if (!positionData) throw new ApolloError("Position not found");

      let positionsRequirements =
        positionData.positionsRequirements?.originalContent;

      if (!positionsRequirements)
        throw new ApolloError(
          "positionsRequirements/job_description not found"
        );

      companyData = await Company.findOne({ _id: positionData.companyID });
      if (!companyData) throw new ApolloError("Company not found");

      let variablesUsed = [];
      if (mustUpdate && mustUpdate.length != 0) {
        variablesUsed = [...mustUpdate];
      }

      // printC(variablesUsed, "1", "variablesUsed", "b")
      // f3

      // --------------- Check what the Company already have ----------------
      if (!companyData.mission && !variablesUsed.includes("mission"))
        variablesUsed.push("mission");
      if (!companyData.description && !variablesUsed.includes("description"))
        variablesUsed.push("description");
      if (!companyData.benefits && !variablesUsed.includes("benefits"))
        variablesUsed.push("benefits");
      if (!companyData.values && !variablesUsed.includes("values"))
        variablesUsed.push("values");
      if (!companyData.founders && !variablesUsed.includes("founders"))
        variablesUsed.push("founders");
      if (!companyData.whatsToLove && !variablesUsed.includes("whatsToLove"))
        variablesUsed.push("whatsToLove");

      // --------------- Check what the Company already have ----------------

      // --------------- Check what the Position already have ----------------
      if (
        !positionData.whatTheJobInvolves &&
        !variablesUsed.includes("whatTheJobInvolves")
      )
        variablesUsed.push("whatTheJobInvolves");
      if (!positionData.whoYouAre && !variablesUsed.includes("whoYouAre"))
        variablesUsed.push("whoYouAre");
      if (!positionData.whatsToLove && !variablesUsed.includes("whatsToLove"))
        variablesUsed.push("whatsToLove");

      // --------------- Check what the Position already have ----------------

      if (variablesUsed.length == 0)
        throw new ApolloError("No variables to update");

      // ----------------- Prepare variables -----------------
      const variablesData = {
        mission: {
          description:
            "What is the mission of the company, if you can't find it return back N/A",
          mongo: "Company",
        },
        description: {
          description:
            "What is the description of the company, if you can't find it return back N/A",
          mongo: "Company",
        },
        whoYouAre: {
          description:
            "What is the Skills and requirement that candidate need to have for this Job, if you can't find it return back N/A",
          mongo: "Position",
        },
        whatTheJobInvolves: {
          description:
            "What are the tasks and responsibilities involved in this job, if you can't find it return back N/A",
          mongo: "Position",
        },
        benefits: {
          description:
            "What are the benefits offered by the company or position, if you can't find it return back N/A",
          mongo: "Company",
        },
        values: {
          description:
            "What are the values of the company, if you can't find it return back N/A",
          mongo: "Company",
        },
        founders: {
          description:
            "Who are the founders of the company, if you can't find it return back N/A",
          mongo: "Company",
        },
        whatsToLove: {
          description:
            "What are the things to love about this Company, be creative ",
          mongo: "Company",
        },
      };

      // const variablesUsed = ["mission","whoYouAre"]
      // const variablesUsed = ["mission","description"]

      let propertiesUsed = {};
      for (let i = 0; i < variablesUsed.length; i++) {
        const variableUsed = variablesUsed[i];

        if (!variablesData[variableUsed]) continue;

        propertiesUsed[variableUsed] = {
          type: "string",
          description: variablesData[variableUsed].description,
        };
      }
      printC(propertiesUsed, "1", "propertiesUsed", "b");
      // ----------------- Prepare variables -----------------

      // ----------------- use GPT to find position -----------------
      // functionsUseGPT = ["findCompanyInformation"]
      functionsUseGPT = [];
      functionUseVariables = [
        {
          name: "findCompanyInformation",
          description:
            "Having the job Description, find the company information",
          parameters: {
            type: "object",
            properties: {
              ...propertiesUsed,
            },
            required: variablesUsed,
          },
        },
      ];

      const systemPrompt = `You are a recruiter, you try to find and fill all the information about the company and the position

      Job Description (delimited <>): <${positionsRequirements}>
      `;

      // printC(systemPrompt, "1", "systemPrompt", "b");
      // f2

      discussionT = [
        {
          role: "user",
          content: systemPrompt,
        },
      ];

      modelK = "gpt-4-0613";

      let resGPTFunc = await useGPTFunc(
        discussionT,
        systemPrompt,
        functionsUseGPT,
        {},
        0,
        "API 1",
        functionUseVariables,
        modelK
      );

      printC(resGPTFunc, "2", "resGPTFunc", "p");
      // ----------------- use GPT to find position -----------------

      // ---------------- Extract the variables and add to Mongo ----------------
      let objectVar = resGPTFunc.function_call;

      for (const [variable, content] of Object.entries(objectVar)) {
        variableData = variablesData[variable];

        if (!variableData) continue;

        if (variableData.mongo == "Company") {
          companyData[variable] = content;
        } else if (variableData.mongo == "Position") {
          positionData[variable] = content;
        }
      }

      await companyData.save();

      await positionData.save();
      // ---------------- Extract the variables and add to Mongo ----------------

      return positionData;
    } catch (err) {
      printC(err, "-1", "err", "r");
      throw new ApolloError(
        err.message,
        err.extensions?.code || "autoUpdatePositionCompInformation",
        {
          component: "positionMutation > autoUpdatePositionCompInformation",
        }
      );
    }
  },

  interviewQuestionCreationUser: async (parent, args, context, info) => {
    const { positionID, userID, cvContent } = args.fields;
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
      positionData2 = await interviewQuestionCreationUserFunc(
        positionID,
        userID,
        cvContent
      );

      return positionData2;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "interviewQuestionCreationUser",
        { component: "positionMutation > interviewQuestionCreationUser" }
      );
    }
  },
  moveCandidateToPosition: async (parent, args, context, info) => {
    const { userID, positionOldID, positionNewID } = args.fields;
    console.log(
      "Mutation > moveCandidateToPosition > args.fields = ",
      args.fields
    );

    if (!positionOldID) throw new ApolloError("positionOldID is required");
    let positionOldData = await Position.findOne({ _id: positionOldID });
    if (!positionOldData) throw new ApolloError("positionOld not found");

    if (!positionNewID) throw new ApolloError("positionNewID is required");
    let positionNewData = await Position.findOne({ _id: positionNewID });
    if (!positionNewData) throw new ApolloError("positionNew not found");

    if (!userID) throw new ApolloError("userID is required");
    let memberData = await Members.findOne({ _id: userID });
    if (!memberData) throw new ApolloError("user not found");

    try {
      // ----------------- add candidate to New position -----------------
      let index_candNewPos = positionNewData.candidates.findIndex(
        (x) => x.userID.toString() == userID.toString()
      );

      if (index_candNewPos == -1) {
        positionNewData.allCandidateScoreCardCalculated = false;
        positionNewData.candidatesFlagAnalysisCreated = false;

        positionNewData.candidates.push({
          userID: userID,
          analysisCandidateEdenAI: {
            flagAnalysisCreated: false,
          },
          candidateScoreCardCalculated: false,
        });

        index_candNewPos = positionNewData.candidates.length - 1;

        // await positionNewData.save();
      } else {
        positionNewData.allCandidateScoreCardCalculated = false;
        positionNewData.candidatesFlagAnalysisCreated = false;

        positionNewData.candidates[index_candNewPos].analysisCandidateEdenAI = {
          flagAnalysisCreated: false,
        };

        positionNewData.candidates[
          index_candNewPos
        ].candidateScoreCardCalculated = false;

        // await positionNewData.save();
      }
      // ----------------- add candidate to New position -----------------

      // ----------------- Calculate Score Job Report Candidate --------------
      const res = await reportPassFailCVPositionConversationFunc(
        userID,
        positionNewID
      );
      positionNewData = res.positionData;
      // ----------------- Calculate Score Job Report Candidate --------------

      wait(5000);

      // ----------------- find the conversation and add the positionNewID -----------------
      let conversationData = await Conversation.find({
        $and: [{ userID: userID }, { positionID: positionOldID }],
      });

      // take only the last conv
      conversationData = conversationData[conversationData.length - 1];

      // add the positionNewID to the conversation
      extraPositionsIDArr = conversationData.extraPositionsID;

      if (!extraPositionsIDArr) extraPositionsIDArr = [];

      // if the positionNewID is not already in the array
      if (!extraPositionsIDArr.includes(positionNewID))
        extraPositionsIDArr.push(positionNewID);

      conversationData.extraPositionsID = extraPositionsIDArr;

      await conversationData.save();
      // ----------------- find the conversation and add the positionNewID -----------------

      // ------------- Candidate Eden Analysis for Position -------------
      positionNewData = await candidateEdenAnalysisPositionFunc(
        positionNewData
      );
      // ------------- Candidate Eden Analysis for Position -------------

      wait(5000);

      // ------------- Move the summaryQuestions from old to new position -------------
      // find the candidate on old position
      let index_candOldPos = positionOldData.candidates.findIndex(
        (x) => x.userID.toString() == userID.toString()
      );

      let summaryQuestions = undefined;

      if (index_candOldPos != -1)
        summaryQuestions =
          positionOldData.candidates[index_candOldPos]?.summaryQuestions;

      if (summaryQuestions) {
        positionNewData.candidates[index_candNewPos].summaryQuestions =
          summaryQuestions;
      }
      // ------------- Move the summaryQuestions from old to new position -------------

      // ------------- Move the Candidate Notes Interview from old to new position -------------

      if (index_candOldPos != -1)
        notesInterview =
          positionOldData.candidates[index_candOldPos]?.notesInterview;

      if (notesInterview) {
        positionNewData.candidates[index_candNewPos].notesInterview =
          notesInterview;
      }
      // ------------- Move the Candidate Notes Interview from old to new position -------------

      await positionNewData.save();

      return positionNewData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "moveCandidateToPosition",
        { component: "positionMutation > moveCandidateToPosition" }
      );
    }
  },
  moveCandidateToPosition_V2: async (parent, args, context, info) => {
    const { userID, positionOldID, positionNewID } = args.fields;
    console.log(
      "Mutation > moveCandidateToPosition_V2 > args.fields = ",
      args.fields
    );

    if (!positionOldID) throw new ApolloError("positionOldID is required");
    let positionOldData = await Position.findOne({ _id: positionOldID });
    if (!positionOldData) throw new ApolloError("positionOld not found");

    if (!positionNewID) throw new ApolloError("positionNewID is required");
    let positionNewData = await Position.findOne({ _id: positionNewID });
    if (!positionNewData) throw new ApolloError("positionNew not found");

    if (!userID) throw new ApolloError("userID is required");
    let memberData = await Members.findOne({ _id: userID });
    if (!memberData) throw new ApolloError("user not found");

    try {
      // ----------------- add candidate to New position -----------------
      let index_candNewPos = positionNewData.candidates.findIndex(
        (x) => x.userID.toString() == userID.toString()
      );

      if (index_candNewPos == -1) {
        positionNewData.candidates.push({
          userID: userID,
          analysisCandidateEdenAI: {
            flagAnalysisCreated: false,
          },
        });

        index_candNewPos = positionNewData.candidates.length - 1;

        await positionNewData.save();
      }
      // ----------------- add candidate to New position -----------------

      // // ----------------- Calculate Score Job Report Candidate --------------
      // const res = await reportPassFailCVPositionConversationFunc(
      //   userID,
      //   positionNewID
      // );
      // positionNewData = res.positionData;
      // // ----------------- Calculate Score Job Report Candidate --------------

      // wait(5000);

      // ----------------- find the conversation and add the positionNewID -----------------
      let conversationData = await Conversation.find({
        $and: [{ userID: userID }, { positionID: positionOldID }],
      });

      // take only the last conv
      conversationData = conversationData[conversationData.length - 1];

      // add the positionNewID to the conversation
      extraPositionsIDArr = conversationData.extraPositionsID;

      if (!extraPositionsIDArr) extraPositionsIDArr = [];

      // if the positionNewID is not already in the array
      if (!extraPositionsIDArr.includes(positionNewID))
        extraPositionsIDArr.push(positionNewID);

      conversationData.extraPositionsID = extraPositionsIDArr;

      await conversationData.save();
      // ----------------- find the conversation and add the positionNewID -----------------

      // ---------------- create cards candidate and connect to position --------
      res = await createCardsCandidateForPositionFunc(positionNewID, userID);

      await wait(5000);
      // ---------------- create cards candidate and connect to position --------

      // ---------------- Calculate score card to position --------
      res = await calculateScoreCardCandidateToPositionFunc(
        userID,
        positionNewID
      );

      await wait(2000);
      // ---------------- Calculate score card to position --------

      // ------------- Candidate Eden Analysis for Position -------------
      positionNewData = await candidateEdenAnalysisPositionFunc(
        positionNewData
      );
      // ------------- Candidate Eden Analysis for Position -------------

      // wait(5000);

      // // ------------- Move the summaryQuestions from old to new position -------------
      // // find the candidate on old position
      // let index_candOldPos = positionOldData.candidates.findIndex(
      //   (x) => x.userID.toString() == userID.toString()
      // );

      // let summaryQuestions = undefined;

      // if (index_candOldPos != -1)
      //   summaryQuestions =
      //     positionOldData.candidates[index_candOldPos]?.summaryQuestions;

      // if (summaryQuestions) {
      //   positionNewData.candidates[index_candNewPos].summaryQuestions =
      //     summaryQuestions;
      // }
      // // ------------- Move the summaryQuestions from old to new position -------------

      // // ------------- Move the Candidate Notes Interview from old to new position -------------

      // if (index_candOldPos != -1)
      //   notesInterview =
      //     positionOldData.candidates[index_candOldPos]?.notesInterview;

      // if (notesInterview) {
      //   positionNewData.candidates[index_candNewPos].notesInterview =
      //     notesInterview;
      // }
      // // ------------- Move the Candidate Notes Interview from old to new position -------------

      // await positionNewData.save();

      return positionNewData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "moveCandidateToPosition_V2",
        { component: "positionMutation > moveCandidateToPosition_V2" }
      );
    }
  },
  moveCandidateToPosition_V3: async (parent, args, context, info) => {
    const { userID, positionOldID, positionNewID, sendMessageCandidateTG } =
      args.fields;
    console.log(
      "Mutation > moveCandidateToPosition_V3 > args.fields = ",
      args.fields
    );

    if (!positionOldID) throw new ApolloError("positionOldID is required");
    let positionOldData = await Position.findOne({ _id: positionOldID });
    if (!positionOldData) throw new ApolloError("positionOld not found");

    if (!positionNewID) throw new ApolloError("positionNewID is required");
    let positionNewData = await Position.findOne({ _id: positionNewID });
    if (!positionNewData) throw new ApolloError("positionNew not found");

    if (!userID) throw new ApolloError("userID is required");
    let memberData = await Members.findOne({ _id: userID });
    if (!memberData) throw new ApolloError("user not found");

    try {
      // ----------------- add candidate to New position -----------------
      let index_candNewPos = positionNewData.candidates.findIndex(
        (x) => x.userID.toString() == userID.toString()
      );

      if (index_candNewPos == -1) {
        positionNewData.allCandidateScoreCardCalculated = false;
        positionNewData.candidatesFlagAnalysisCreated = false;

        positionNewData.candidates.push({
          userID: userID,
          analysisCandidateEdenAI: {
            flagAnalysisCreated: false,
          },
          candidateScoreCardCalculated: false,
        });

        index_candNewPos = positionNewData.candidates.length - 1;

        // await positionNewData.save();
      } else {
        positionNewData.allCandidateScoreCardCalculated = false;
        positionNewData.candidatesFlagAnalysisCreated = false;

        positionNewData.candidates[index_candNewPos].analysisCandidateEdenAI = {
          flagAnalysisCreated: false,
        };

        positionNewData.candidates[
          index_candNewPos
        ].candidateScoreCardCalculated = false;

        // await positionNewData.save();
      }
      // ----------------- add candidate to New position -----------------

      // ----------------- find the conversation and add the positionNewID -----------------
      let conversationData = await Conversation.find({
        $and: [{ userID: userID }, { positionID: positionOldID }],
      });

      // take only the last conv
      conversationData = conversationData[conversationData.length - 1];

      // add the positionNewID to the conversation
      extraPositionsIDArr = conversationData.extraPositionsID;

      if (!extraPositionsIDArr) extraPositionsIDArr = [];

      // if the positionNewID is not already in the array
      if (!extraPositionsIDArr.includes(positionNewID))
        extraPositionsIDArr.push(positionNewID);

      conversationData.extraPositionsID = extraPositionsIDArr;

      await conversationData.save();
      // ----------------- find the conversation and add the positionNewID -----------------

      // ------------- Sent message with telegram to candidate -------------
      if (sendMessageCandidateTG) {
        filter = {
          phase: "QUERY",
          sender: {
            positionID: positionNewID,
          },
          senderType: "POSITION",
          responder: {
            userID: userID,
          },
          responderType: "USER",
          question: {
            content: sendMessageCandidateTG,
          },
          category: "PITCH_POSITION_CANDIDATE",
        };

        queryResponseData = await new QueryResponse(filter);

        console.log("queryResponseData = ", queryResponseData);

        await queryResponseData.save();

        // --------- Change the state Eden Candidate-------------
        memberData.stateEdenChat = {
          positionIDs: [positionNewID],
          categoryChat: "PITCH_POSITION_CANDIDATE",
        };

        await memberData.save();
        // --------- Change the state Eden Candidate-------------
      }
      // ------------- Sent message with telegram to candidate -------------

      await positionNewData.save();

      return positionNewData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "moveCandidateToPosition_V3",
        { component: "positionMutation > moveCandidateToPosition_V3" }
      );
    }
  },
  addEmployeesPosition: async (parent, args, context, info) => {
    const { positionID, employees } = args.fields;
    console.log(
      "Mutation > addEmployeesPosition > args.fields = ",
      args.fields
    );

    if (!employees)
      throw new ApolloError("Employees is required", "addEmployeesPosition", {
        component: "positionMutation > addEmployeesPosition",
      });

    if (!positionID)
      throw new ApolloError("Position ID is required", "addEmployeesPosition", {
        component: "positionMutation > addEmployeesPosition",
      });

    positionData = await Position.findOne({ _id: positionID });

    if (!positionData)
      throw new ApolloError("Position not found", "addEmployeesPosition", {
        component: "positionMutation > addEmployeesPosition",
      });

    try {
      let compEmployees = await updateEmployees(
        positionData.employees,
        employees
      );

      console.log("compEmployees = ", compEmployees);

      // find one and updates
      let positionDataN = await Position.findOneAndUpdate(
        { _id: positionID },
        { employees: compEmployees },
        { new: true }
      );

      return positionDataN;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addEmployeesPosition",
        { component: "positionMutation > addEmployeesPosition" }
      );
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
        "Employees is required",
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

    // try {

    // console.log("questionsToAsk = " , questionsToAsk)
    // s9

    questionsToAsk = await addMultipleQuestionsToEdenAIFunc(questionsToAsk);

    console.log("questionsToAsk = ", questionsToAsk);
    // asdf12

    // let questionsToAskN = await updateEmployees(
    //   positionData.questionsToAsk,
    //   questionsToAsk,
    //   "questionID"
    // );

    // console.log("questionsToAskN = ", questionsToAskN);

    // sd9

    // positionData.questionsToAsk = questionsToAskN;
    positionData.questionsToAsk = questionsToAsk;

    await positionData.save();

    // // find one and updates
    // let positionDataN = await Position.findOneAndUpdate(
    //   { _id: positionID },
    //   { questionsToAsk: questionsToAskN },
    //   { new: true }
    // );
    // return positionDataN;

    return positionData;

    //   } catch (err) {
    //     throw new ApolloError(
    //       err.message,
    //       err.extensions?.code || "addQuestionsToAskPosition",
    //       { component: "positionMutation > addQuestionsToAskPosition" }
    //     );
    //   }
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
  pitchPositionToCandidate: async (parent, args, context, info) => {
    const { positionID, userID } = args.fields;
    console.log(
      "Mutation > pitchPositionToCandidate > args.fields = ",
      args.fields
    );

    if (!positionID) throw new ApolloError("Position ID is required");
    positionData = await Position.findOne({ _id: positionID }).select(
      "_id name positionsRequirements"
    );
    if (!positionData) throw new ApolloError("Position not found");

    if (!userID) throw new ApolloError("User ID is required");
    userData = await Members.findOne({ _id: userID }).select(
      "_id discordName cvInfo "
    );
    if (!userData) throw new ApolloError("User not found");

    try {
      cvNotes = userData.cvInfo.cvNotes;

      notesRequirConv = positionData.positionsRequirements.notesRequirConv;

      printC(cvNotes, "1", "cvNotes", "g");

      printC(notesRequirConv, "1", "notesRequirConv", "b");

      messagePitchPositionCandidatePrompt = `
      You are a personal career coach,

      Candidate Notes (delimited <>): <${cvNotes}>
      Position Requirements Notes (delimited <>): <${notesRequirConv}>

      - Your task is to Pitch the position that you found for your client. Be friendly and fun.
      - Its not your position so you need to talk about it as someone else position that you found for your client.
      - It should be relevant to the candidate and the position.
      - It should be only 1-3 sentences.
      - At the end ask your client if they are interested to personally recommend you to this position 

      Result: 
    `;

      messagePitchPositionCandidate = await useGPTchatSimple(
        messagePitchPositionCandidatePrompt,
        0.7,
        "API 1"
      );

      // messagePitchPositionCandidate = `Hey Reza! I came across a fantastic opportunity that I think would be a perfect fit for you
      // I found a backend developer position at a company pioneering the transformation of buildings through spatial data
      // With your extensive experience in web development using JavaScript frameworks, proficiency in TypeScript, and strong understanding of clients' requirements, I believe you would excel in building the backend for user-facing features and maintaining infrastructure
      // Are you interested in pursuing this opportunity? Can I personally recommend you for this position?`

      printC(
        messagePitchPositionCandidate,
        "4",
        "messagePitchPositionCandidate",
        "y"
      );

      // // ------------- Sent message with telegram to candidate -------------
      // filter = {
      //   phase: "QUERY",
      //   sender: {
      //     positionID: positionID,
      //   },
      //   senderType: "POSITION",
      //   responder: {
      //     userID: userID,
      //   },
      //   responderType: "USER",
      //   question: {
      //     content: messagePitchPositionCandidate,
      //   },
      //   category: "PITCH_POSITION_CANDIDATE",
      // };

      // queryResponseData = await new QueryResponse(filter);

      // console.log("queryResponseData = ", queryResponseData);

      // await queryResponseData.save();

      // // --------- Change the state Eden Candidate-------------
      // userData.stateEdenChat = {
      //   positionIDs: [positionID],
      //   categoryChat: "PITCH_POSITION_CANDIDATE",
      // };

      // await userData.save();
      // // --------- Change the state Eden Candidate-------------
      // // ------------- Sent message with telegram to candidate -------------

      return {
        message: messagePitchPositionCandidate,
        // queryResponse: queryResponseData,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "pitchPositionToCandidate",
        { component: "positionMutation > pitchPositionToCandidate" }
      );
    }
  },
  findKeyAttributeAndPotentialPosition: async (parent, args, context, info) => {
    const { positionID } = args.fields;
    console.log(
      "Mutation > findKeyAttributeAndPotentialPosition > args.fields = ",
      args.fields
    );

    if (!positionID) throw new ApolloError("Position ID is required");

    try {
      positionData = await findKeyAttributeAndPotentialPositionFunc(positionID);

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findKeyAttributeAndPotentialPosition",
        { component: "positionMutation > findKeyAttributeAndPotentialPosition" }
      );
    }
  },
  findKeyAttributeAndPotentialCandidate: async (
    parent,
    args,
    context,
    info
  ) => {
    const { positionID, membersID } = args.fields;
    console.log(
      "Mutation > findKeyAttributeAndPotentialCandidate > args.fields = ",
      args.fields
    );

    if (!positionID) throw new ApolloError("Position ID is required");

    positionData = await Position.findOne({ _id: positionID }).select(
      "_id name positionsRequirements candidates"
    );

    // -------------- Decide and collect Candidates to process --------------
    membersToProcess = [];
    idxMemberToPosition = [];

    if (membersID) {
      membersData = await Members.find({ _id: { $in: membersID } }).select(
        "_id discordName cvInfo "
      );

      // find the IDX on the positionData candidates
      for (let i = 0; i < membersData.length; i++) {
        let memberData = membersData[i];
        idxPosition = positionData.candidates.findIndex(
          (candidate) =>
            candidate.userID.toString() == memberData._id.toString()
        );
        if (idxPosition != -1) {
          membersToProcess.push(memberData);
          idxMemberToPosition.push(idxPosition);
        }
      }
    } else {
      // find data for all candidates
      membersToProcess = await Members.find({
        _id: {
          $in: positionData.candidates.map((candidate) => candidate.userID),
        },
      }).select("_id discordName cvInfo ");

      // find the IDX on the positionData candidates
      for (let i = 0; i < membersToProcess.length; i++) {
        let memberData = membersToProcess[i];
        idxPosition = positionData.candidates.findIndex(
          (candidate) =>
            candidate.userID.toString() == memberData._id.toString()
        );
        idxMemberToPosition.push(idxPosition);
      }
    }

    printC(membersToProcess, "1", "membersToProcess", "g");

    printC(idxMemberToPosition, "1", "idxMemberToPosition", "g");
    // -------------- Decide and collect Candidates to process --------------

    try {
      positionData = await findKeyAttributeAndPotentialCandidateFunc(
        positionData,
        membersToProcess,
        idxMemberToPosition
      );

      return positionData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findKeyAttributeAndPotentialCandidate",
        {
          component: "positionMutation > findKeyAttributeAndPotentialCandidate",
        }
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
      throw new ApolloError("Employees is required", "addCandidatesPosition", {
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
      let candidatesN = await updateEmployees(
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
          candidates: positionData.candidates,
          candidatesReadyToDisplay: false,
          candidatesFlagAnalysisCreated: false,
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
  deletePositionCandidate: async (parent, args, context, info) => {
    const { positionID, userID, onlyScoreCard } = args.fields;
    console.log(
      "Query > deletePositionCandidate > args.fields = ",
      args.fields
    );

    if (!positionID) throw new ApolloError("positionID is required");

    try {
      let positionData = await Position.findOne({ _id: positionID }).select(
        "_id candidates"
      );

      if (!positionData) throw new ApolloError("Position not found");

      console.log("positionData = ", positionData);

      // find the positionData.candidates userID and return it

      if (userID) {
        const index = positionData.candidates.findIndex(
          (candidate) => candidate.userID.toString() == userID.toString()
        );

        if (onlyScoreCard) {
          positionData.candidates[index].scoreCardCategoryMemories = [];
          positionData.candidates[index].scoreCardTotal = {};
        } else {
          positionData.candidates[index].interviewQuestionsForCandidate = [];
        }
        positionData = await positionData.save();

        return [positionData.candidates[index]];
      } else {
        for (let i = 0; i < positionData.candidates.length; i++) {
          if (onlyScoreCard) {
            positionData.candidates[i].scoreCardCategoryMemories = [];
            positionData.candidates[i].scoreCardTotal = {};
          } else {
            positionData.candidates[i].interviewQuestionsForCandidate = [];
          }
        }
        positionData = await positionData.save();

        return positionData.candidates;
      }

      // console.log("candidate = " , candidate)
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "deletePositionCandidate",
        { component: "positionQuery > deletePositionCandidate" }
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

  updateAnalysisEdenAICandidates: async (parent, args, context, info) => {
    const { positionIDs, userID } = args.fields;
    console.log(
      "Mutation > updateAnalysisEdenAICandidates > args.fields = ",
      args.fields
    );

    if (positionIDs)
      positionsData = await Position.find({
        _id: positionIDs,
        // candidatesFlagAnalysisCreated: { $ne: true } // SOS 🆘 - uncomment!!!
      });
    else
      positionsData = await Position.find({
        $and: [
          { allCandidateScoreCardCalculated: true  },
          {
            $or: [
              {
                "candidates.analysisCandidateEdenAI.flagAnalysisCreated": null,
              },
              {
                "candidates.analysisCandidateEdenAI.flagAnalysisCreated": false,
              },
            ],
          },
        ],
      });

    // printC(positionsData.length, "0", "positionsData.length", "g")
    // f1

    try {
      for (let i = 0; i < positionsData.length; i++) {
        positionsData[i] = await candidateEdenAnalysisPositionFunc(
          positionsData[i],
          userID
        );
      }

      return positionsData;
    } catch (err) {
      printC(err, "-1", "err", "r");
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateAnalysisEdenAICandidates",
        { component: "positionMutation > updateAnalysisEdenAICandidates" }
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

            // --------- Find User Questions -------------
            // console.log("position = " , position)
            // console.log("position.candidates = " , position.candidates)
            let index_ = position.candidates.findIndex(
              (x) => x.userID.toString() == candidate.userID.toString()
            );

            if (index_ != -1) {
              for (
                let i = 0;
                i <
                position.candidates[index_]?.interviewQuestionsForCandidate
                  .length;
                i++
              ) {
                if (i < questionAnswered.length) {
                  printC(i, "0", "i", "y");
                  printC(
                    position.candidates[index_]?.interviewQuestionsForCandidate[
                      i
                    ],
                    "0",
                    "position.candidates[index_]?.interviewQuestionsForCandidate[i]",
                    "y"
                  );
                  questionAnswered[i].questionContent =
                    position.candidates[index_]?.interviewQuestionsForCandidate[
                      i
                    ]?.personalizedContent;
                }
              }
            }

            printC(questionAnswered, "0", "questionAnswered", "g");
            // kj0
            // --------- Find User Questions -------------

            for (let pl = 0; pl < questionAnswered.length; pl++) {
              // loop on questionsAnswered
              const questionAnsweredN = questionAnswered[pl];

              questionID = questionAnsweredN.questionID;

              if (questionsToAskObj[questionID]) {
                printC(questionAnsweredN, "3", "questionAnsweredN", "y");
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

            printC(questionsToAskObj, "4", "questionsToAskObj", "b");
          }
        }

        printC(questionsToAskObj, "4", "questionsToAskObj", "b");

        // loop throw the oboject questionsToAskObj
        for (let questionID in questionsToAskObj) {
          let questionInfo = questionsToAskObj[questionID];

          questionContent = await QuestionsEdenAI.findOne({
            _id: questionInfo.questionID,
          }).select("_id content contentSmall");
          questionContent = await updateQuestionSmall(questionContent);

          // questionInfo.questionsToAskObj[questionID].questionContentSmall =  questionContent?.contentSmall

          printC(questionInfo, "5", "questionInfo", "y");
          // sd00

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

            printC(questionInfo, "5", "questionInfo", "y");

            // s0

            for (userID in questionInfo.usersAnswers) {
              qLen = questionInfo.usersAnswers[userID].length - 1;

              const answerN = questionInfo.usersAnswers[userID][
                qLen
              ].summaryOfAnswer.replace(/[<>]/g, "");

              printC(questionN, "5", "questionN", "y");
              printC(bestAnswerN, "5", "bestAnswerN", "y");
              printC(answerN, "5", "answerN", "y");

              // let promptEvaluate = `
              // QUESTION: <${questionN}>

              // BEST DESIRED answer: <${bestAnswerN}>

              // USER answer: <${answerN}>

              // How much you will rate the USER VS the BEST DESIRED answer,  1 to 10

              // First, give only a number from 1 to 10, then give a really concise reason in 3 bullet points, every bullet point can have maximum 6 words:

              // Example
              // EVALUATE: 6
              // REASON: the reason...
              // `
              let promptEvaluate = `
                QUESTION: <${questionN}>

                USER analysis Summary : <${answerN}>

                - How much you will rate the QUESTION based on the the USER analysis,  1 to 10
                - First, give only a number from 1 to 10, then give a really concise reason in 3 bullet points, every bullet point can have maximum 7 words
                - You can only give Evaluation and Reason, exactly like the Example below

                Example 
                EVALUATE: 6
                REASON: the reason...

                result: 
                `;

              let evaluateResult = await useGPTchatSimple(promptEvaluate);

              printC(evaluateResult, "5", "evaluateResult", "g");

              // sdf

              // separate the result on EVALUATE and REASON on two different variables, using regex, it should work for all caps and all small letters

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
                originalQuestionContent:
                  questionsToAskObj[questionID]?.questionContent,
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
          // await deletePineCone(deletePineIDs)
          let filter = {
            pineconeID: deletePineIDs,
          };
          resTK = await deleteMemoriesPineconeFunc(filter);
        }
        // ------------ Delete previous memory ------------

        // -------------- Sent to PineCone --------------
        printC(newMemoryT, "2", "newMemoryT", "y");
        // newMemoryT.forEach(memorySaveN => {
        for (let i = 0; i < newMemoryT.length; i++) {
          const memorySaveN = newMemoryT[i].memoryContent;
          // upsertSum = await upsertEmbedingPineCone({
          //   text: memorySaveN,
          //   _id: position._id,
          //   label: "Company_TrainEdenAI_memory",
          // });
          // printC(upsertSum,"2","upsertSum","y")

          resTK = await addMemoryPineconeFunc({
            memory: memorySaveN,
            positionID: position._id,
            label: "Company_TrainEdenAI_memory",
          });

          newMemoryT[i].pineConeID = resTK?.memoryData?.pineConeID;
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

async function updateEmployees(arr1, arr2, compareKey = "userID") {
  // arr1New = [...arr1]
  arr2.forEach((employee2) => {
    const index = arr1.findIndex((employee1) => {
      if (employee1[compareKey] && employee2[compareKey])
        return (
          employee1[compareKey].toString() == employee2[compareKey].toString()
        );
      else return -1;
    });
    if (index != -1) {
      // arr1[index] = {
      //   ...employee2,
      //   ...arr1[index],
      //   readyToDisplay: false,
      // }
      arr1[index].readyToDisplay = false;
      if (employee2.conversationID) {
        arr1[index].conversationID = employee2.conversationID;
      }
      if (employee2.bestAnswer) {
        arr1[index].bestAnswer = employee2.bestAnswer;
      }
    } else {
      arr1.push({
        ...employee2,
        readyToDisplay: false,
      });

      if (employee2.conversationID) {
        arr1[arr1.length - 1].conversationID = employee2.conversationID;
      }
      if (employee2.bestAnswer) {
        arr1[arr1.length - 1].bestAnswer = employee2.bestAnswer;
      }
    }
  });

  return arr1;
}
