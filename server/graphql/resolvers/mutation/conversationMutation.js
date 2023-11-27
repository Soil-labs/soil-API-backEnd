const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const { ApolloError } = require("apollo-server-express");

const {
  concatenateFirstTwoMessages,
  updateQuestionAskedConvoID,
  updatePositionInterviewedOfUser,
  findSummaryOfAnswers,
  findQuestionsAsked,
  updateNotesRequirmentsConversation,
  findAndUpdateConversationFunc,
  updateAnsweredQuestionFunc,
} = require("../utils/conversationModules");

const {
  findKeyAttributeAndPotentialPositionFunc,
  findKeyAttributeAndPotentialCandidateWrapper,
} = require("../utils/positionModules");

const {
  useGPTchat,
  useGPTchatSimple,
  // upsertEmbedingPineCone,
  // deletePineCone,
  conversationCVPositionToReportFunc,
  reportPassFailCVPositionConversationFunc,
} = require("../utils/aiModules");

const {
  CandidateNotesEdenAIAPICallF,
} = require("../utils/aiExtraModules");


const {
  addMemoryPineconeFunc,
  deleteMemoriesPineconeFunc,
} = require("../utils/memoryPineconeModules");

const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const { printC } = require("../../../printModule");


module.exports = {
  updateConversation: async (parent, args, context, info) => {
    const {
      conversationID,
      userID,
      positionID,
      conversation,
      questionAskingNow,
      questionAskingID,
      timesAsked,
    } = args.fields;
    console.log("Mutation > updateConversation > args.fields = ", args.fields);

    if (!conversation || conversation.length < 2) {
      throw new ApolloError(
        "Conversation must be at least 2 messages long",
        "updateConversation",
        { component: "conversationMutation > updateConversation" }
      );
    }

    if (!userID) {
      throw new ApolloError("userID is required", "updateConversation", {
        component: "conversationMutation > updateConversation",
      });
    }

    try {

      if (conversationID){
        resultConv = await Conversation.findOne({ _id: conversationID });

        if (resultConv){

          resultConv.conversation = conversation;
          resultConv.lastMsgSummed = conversation.length
          resultConv.updatedAt = Date.now();
          resultConv.summaryReady = false;

          if (userID) resultConv.userID = userID; 
          if (positionID) resultConv.positionID = positionID;


          resultConv.save()
        }

      } else {
        resultConv = await findAndUpdateConversationFunc(userID, conversation);
      }

      //  ------------- Update the Answered Question ----------------
      resultConv = await updateAnsweredQuestionFunc(
        resultConv,
        conversation,
        questionAskingNow,
        questionAskingID,
        timesAsked
      );
      //  ------------- Update the Answered Question ----------------

      return resultConv;
    } catch (err) {
      console.log("err = ", err);
      // throw new ApolloError(
      //   err.message,
      //   err.extensions?.code || "updateConversation",
      //   { component: "conversationMutation > updateConversation" }
      // );
    }
  },
  updateConvSummaries: async (parent, args, context, info) => {
    const { _id, convKey } = args.fields;
    // console.log("Query > updateConvSummaries > args.fields = ", args.fields);

    let searchQuery_and = [];
    let searchQuery = {};

    if (_id) {
      searchQuery_and.push({ _id: _id });
    } else if (convKey) {
      searchQuery_and.push({ convKey: convKey });
    } else {
      searchQuery_and.push({ summaryReady: false }); // SOS 🆘 change always to false
    }
    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }

    

    

    try {
      
      let convData = await Conversation.find(searchQuery);


      // printC(convData,"1","convData","b")
      // dd9

      for (let i = 0; i < convData.length; i++) {
        let userID = ""
        let positionTrainEdenAI
        let positionID = "232"

        let filter = {}

        convDataNow = convData[i];


        // --------------- Calculate candidateNotesEdenAI ---------------

        userID = convDataNow.userID;
        positionID = convDataNow.positionID;
        positionTrainEdenAI = convDataNow.positionTrainEdenAI;

        if (positionTrainEdenAI == true) { // For Delete the right memories

          filter = {
            positionID: positionID,
            label:"conv_for_position_memory"
          }

        } else {
          filter = {
            userID: userID,
            label:"conv_for_user_memory"
          }

        }

        printC(userID,"1","userID","y")
        printC(positionID,"2","positionID","y")

        if (userID != undefined && positionID != undefined)
          CandidateNotesEdenAIAPICallF(userID, positionID);
        // --------------- Calculate candidateNotesEdenAI ---------------



        if (positionTrainEdenAI == true) { 
        } else {
          await updatePositionInterviewedOfUser(convDataNow.userID,positionID);
        }


        printC( convDataNow.updatedAt,"0"," convDataNow.updatedAt","b")
        printC(positionID,"2","positionID","y")


        // how many minutes pass from last update
        const minutesSinceLastUpdate =
          (Date.now() - convDataNow.updatedAt) / 60000;

        // console.log("minutesSinceLastUpdate = ", minutesSinceLastUpdate);
        printC(minutesSinceLastUpdate,"1","minutesSinceLastUpdate","b")

        printC(positionID,"2","positionID","y")


        if (minutesSinceLastUpdate > 2.3) {
          // ------------------ Delete old summaries from pinecone ------------------
          resTK = await deleteMemoriesPineconeFunc(filter)
          // ------------------ Delete old summaries from pinecone ------------------

          // as1
          let discussionOld = convDataNow.conversation.map(({ role, content }) => ({
            role,
            content,
          }))

          console.log("discussionOld = ", discussionOld);
          

 
          let paragraphSummary = await useGPTchat(
            "Create a summary of the important parts of the conversation \n\n Summary:",
            discussionOld, 
            ""
          );
          // as2


          const promptForBulletS =
            paragraphSummary +
            "\n - Focus on Creating the smallest possible number of bullet points \n - Bullet point should exist only if it adds new important information \n\n Create Bullet point Summary:";

          const bulletSummary = await useGPTchatSimple(promptForBulletS);

          // console.log("bulletSummary = " , bulletSummary)

          let splitSummary = bulletSummary.split("- ");

          splitSummary.shift();

          // console.log("splitSummary = ", splitSummary);
          // ---------------- GPT find new Summary ------------


          let summaryArr = [];

          for (let j = 0; j < splitSummary.length; j++) {
            splitSumNow = splitSummary[j];


            if (positionTrainEdenAI == true) { 
              resTK = await addMemoryPineconeFunc({
                positionID: convDataNow.positionID,
                label: "conv_for_position_memory",
                memory: splitSumNow,
                convKey: convDataNow.convKey,
              })
            } else {
              resTK = await addMemoryPineconeFunc({
                userID: convDataNow.userID,
                label: "conv_with_user_memory",
                memory: splitSumNow,
                convKey: convDataNow.convKey,
              })
            }
           

            summaryArr.push({
              // pineConeID: upsertDoc.pineConeID,
              pineConeID: resTK?.memoryData?.pineConeID,
              content: splitSumNow,
            });
          }

          convDataNow.summary = summaryArr;
          convDataNow.summaryReady = true;

          printC(convDataNow,"0","convDataNow","b")

          // // sdf9

          if (convDataNow.positionTrainEdenAI == true) { // this is an alignment conversation
            await updateNotesRequirmentsConversation(convDataNow); 

            await findKeyAttributeAndPotentialPositionFunc(convDataNow.positionID,convDataNow)
          } else {
            await findKeyAttributeAndPotentialCandidateWrapper(convDataNow.positionID,convDataNow.userID,convDataNow)
          }

          // ss0

          if (convDataNow.questionsAnswered.length == 0) {
            convDataNow = await findQuestionsAsked(convDataNow,convDataNow.positionID);
          }

          convDataNow = await findSummaryOfAnswers(convDataNow);




          await convDataNow.save();




          const positionID = convDataNow.positionID;
          const userID = convDataNow.userID;

          // printC(positionID,"2","positionID","y")
          // printC(userID,"3","userID","y")

          
          const res = await reportPassFailCVPositionConversationFunc(userID, positionID)

          // report = res.report
          // categoriesT = res.categoriesT
          // scoreAll = res.scoreAll
    

          // printC(report,"4","report","g")
          



          // asdf9

        }
      }

      return convData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateConvSummaries",
        { component: "converstaionQuery > updateConvSummaries" }
      );
    }
  },
};
