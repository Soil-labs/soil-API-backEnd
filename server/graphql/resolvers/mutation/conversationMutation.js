const { Conversation } = require("../../../models/conversationModel");
const { QuestionsEdenAI } = require("../../../models/questionsEdenAIModel");

const { ApolloError } = require("apollo-server-express");

const { concatenateFirstTwoMessages,updateQuestionAskedConvoID,findSummaryOfAnswers,findAndUpdateConversationFunc,updateAnsweredQuestionFunc } = require("../utils/conversationModules");

const { useGPTchat,useGPTchatSimple,upsertEmbedingPineCone,deletePineCone } = require("../utils/aiModules");


module.exports = {
  updateConversation: async (parent, args, context, info) => {
      const { userID,conversation,questionAskingNow,questionAskingID,timesAsked } = args.fields;
      console.log("Mutation > updateConversation > args.fields = ", args.fields);

      if (!conversation || conversation.length <2) {
        throw new ApolloError(
          "Conversation must be at least 2 messages long",
          "updateConversation",
          { component: "conversationMutation > updateConversation" }
        );
      }

      if (!userID) {
        throw new ApolloError(
          "userID is required",
          "updateConversation",
          { component: "conversationMutation > updateConversation" }
        );
      }

      try {

        // convKey = await concatenateFirstTwoMessages(conversation);

        // // check if already exist using userID and convKey

        // const existingConversation = await Conversation.findOne({
        //   userID,
        //   convKey,
        // });

        // let resultConv;

        // if (existingConversation) {
        //   // update the conversation
        //   existingConversation.conversation = conversation;
        //   existingConversation.updatedAt = Date.now();
        //   existingConversation.summaryReady = false;

        //   resultConv = await existingConversation.save();


        // } else {

        //   const newConversation = await new Conversation({
        //     convKey,
        //     userID,
        //     conversation,
        //     summaryReady: false,
        //     summary: [],
        //     updatedAt: Date.now(),
        //   });
  
        //   resultConv = await newConversation.save();
  
          
        // }

        // console.log("resultConv = " , resultConv)

        resultConv = await findAndUpdateConversationFunc(userID,conversation)

        //  ------------- Update the Answered Question ----------------
        resultConv = await updateAnsweredQuestionFunc(resultConv,conversation,questionAskingNow,questionAskingID,timesAsked)
        //  ------------- Update the Answered Question ----------------

        
        return resultConv
        
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "updateConversation",
          { component: "conversationMutation > updateConversation" }
        );
      }
    },
    updateConvSummaries: async (parent, args, context, info) => {
      const { _id, convKey} = args.fields;
      console.log("Query > updateConvSummaries > args.fields = ", args.fields);
  
  
      let searchQuery_and = [];
      let searchQuery = {};

      
  
  
      if (_id) {
        searchQuery_and.push({ _id: _id });
      } else if (convKey) {
        searchQuery_and.push({ convKey: convKey });
      } else {
        searchQuery_and.push({ summaryReady: false }) // SOS 🆘 change always to false
      }
      if (searchQuery_and.length > 0) {
        searchQuery = {
          $and: searchQuery_and,
        };
      } else {
        searchQuery = {};
      }

      // console.log("searchQuery = " , searchQuery)
  
      try {
  
        let convData = await Conversation.find(searchQuery);

        // console.log("convData = " , convData)

        for (let i = 0; i < convData.length; i++) {
          convDataNow = convData[i];

          console.log("convDataNow. = " , convDataNow.updatedAt)

          // how many minutes pass from last update
          const minutesSinceLastUpdate = (Date.now() - convDataNow.updatedAt) / 60000;

          console.log("minutesSinceLastUpdate = " , minutesSinceLastUpdate)

          if (minutesSinceLastUpdate > 5) {
            // if (true) { 

            // ------------------ Delete old summaries from pinecone ------------------
            deletePineIDs = convDataNow.summary.map(obj => obj.pineConeID)
            await deletePineCone(deletePineIDs)
            // ------------------ Delete old summaries from pinecone ------------------
 

            let paragraphSummary = await useGPTchat(
              // "Please summarize the conversation using bullet points. Feel free to use as many bullet points as necessary, but be sure to prioritize precision and conciseness. Try to incorporate the keywords that were used during the conversation. reasult:",
              // "Please summarize the conversation using bullet points. Focuse on creating consise bullet points. Try to incorporate the keywords that were used during the conversation. reasult:",
              "Create a summary of the important parts of the conversation \n\n Summary:",
              convDataNow.conversation.map(({ role, content }) => ({ role, content })), // clean up from any _id etc
              ""
            )


            const promptForBulletS = paragraphSummary + "\n - Focus on Creating the smallest possible number of bullet points \n - Bullet point should exist only if it adds new important information \n\n Create Bullet point Summary:"

            const bulletSummary = await useGPTchatSimple(promptForBulletS)



            // console.log("bulletSummary = " , bulletSummary) 

            let splitSummary = bulletSummary.split("- ");

            

            splitSummary.shift();

            console.log("splitSummary = " , splitSummary)
            // ---------------- GPT find new Summary ------------


            let summaryArr = [];

            for (let j = 0; j < splitSummary.length; j++) {
              splitSumNow = splitSummary[j];



              upsertDoc = await upsertEmbedingPineCone({
                text: splitSumNow,
                _id: convDataNow.userID,
                label: "conv_with_user_memory",
                convKey: convDataNow.convKey,
              });

              console.log("upsertDoc = " , upsertDoc)


              summaryArr.push({
                pineConeID: upsertDoc.pineConeID,
                content: splitSumNow,
              })

            }

            convDataNow.summary = summaryArr;
            convDataNow.summaryReady = true;



            convDataNow = await findSummaryOfAnswers(convDataNow)

            // asdf9


            await convDataNow.save();



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
}
