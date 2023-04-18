const { Conversation } = require("../../../models/conversationModel");
const { ApolloError } = require("apollo-server-express");

const { concatenateFirstTwoMessages } = require("../utils/conversationModules");

const { useGPTchat,upsertEmbedingPineCone,deletePineCone } = require("../utils/aiModules");


module.exports = {
  updateConversation: async (parent, args, context, info) => {
      const { userID,conversation } = args.fields;
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

        convKey = await concatenateFirstTwoMessages(conversation);

        // check if already exist using userID and convKey

        const existingConversation = await Conversation.findOne({
          userID,
          convKey,
        });

        let resultConv;

        if (existingConversation) {
          // update the conversation
          existingConversation.conversation = conversation;
          existingConversation.updatedAt = Date.now();
          existingConversation.summaryReady = false;

          resultConv = await existingConversation.save();


        } else {

          const newConversation = new Conversation({
            convKey,
            userID,
            conversation,
            summaryReady: false,
            summary: [],
            updatedAt: Date.now(),
          });
  
          resultConv = await newConversation.save();
  
          
        }
        
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
      }
      if (convKey) {
        searchQuery_and.push({ convKey: convKey });
      } else {
        searchQuery_and.push({ summaryReady: false })
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

        for (let i = 0; i < convData.length; i++) {
          convDataNow = convData[i];

          console.log("convDataNow. = " , convDataNow.updatedAt)

          // how many minutes pass from last update
          const minutesSinceLastUpdate = (Date.now() - convDataNow.updatedAt) / 60000;

          console.log("minutesSinceLastUpdate = " , minutesSinceLastUpdate)

          if (minutesSinceLastUpdate > 0.5) { // SOS 🆘 change back to 10

            
            // ------------ Delete old summaries from pinecone ---------
            deletePineIDs = convDataNow.summary.map(obj => obj.pineConeID)

            await deletePineCone(deletePineIDs)
            // ------------ Delete old summaries from pinecone ---------


            // ----------- GPT find new Summary ----------
            const summaryGPT = await useGPTchat(
              "Please summarize the conversation using bullet points. Feel free to use as many bullet points as necessary, but be sure to prioritize precision and conciseness. Try to incorporate the keywords that were used during the conversation.",
              convDataNow.conversation.map(({ role, content }) => ({ role, content })),
              ""
            )

            console.log("summaryGPT = " , summaryGPT) 

            let splitSummary = summaryGPT.split("- ");

            splitSummary.shift();

            console.log("splitSummary = " , splitSummary)

            let summaryArr = []
            // ----------- GPT find new Summary ----------


            for (let j = 0; j < splitSummary.length; j++) {
              splitSumNow = splitSummary[j];


              upsertDoc = await upsertEmbedingPineCone({
                text: splitSumNow,
                _id: convDataNow.userID,
                label: "conv_with_user_memory",
                convKey: convDataNow.convKey,
              });

              // console.log("upsertDoc = " , upsertDoc)


              // sdf0

              summaryArr.push({
                pineConeID: upsertDoc.pineConeID,
                content: upsertDoc.text,
              })

            }

            console.log("summaryArr = " , summaryArr)
            // sdf99

            convDataNow.summary = summaryArr;
            convDataNow.summaryReady = true;

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
