const { ApolloError } = require("apollo-server-express");

const { printC } = require("../../../printModule");

const { Position } = require("../../../models/positionModel");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { Conversation } = require("../../../models/conversationModel");
const { Members } = require("../../../models/membersModel");

const {upsertEmbedingPineCone,deletePineCone} = require("../utils/aiExtraModules");

const {addCardMemoryFunc,
  createCardsScoresCandidate_3,
  connectCardsPositionToCandidateAndScore,
  createCardsCandidateForPositionFunc,
  calculateScoreCardCandidateToPositionFunc,} = require("../utils/cardMemoryModules");

require("dotenv").config();



const {
  useGPTchatSimple,
} = require("../utils/aiModules");


module.exports = {
  addCardMemory: async (parent, args, context, info) => {
    const { _id,content, priority, tradeOffBoost,type,connectedCards,authorCard,score} = args.fields;
    console.log("Mutation > addCardMemory > args.fields = ", args.fields);


    try {

      filter = {}
      if (_id) filter._id = _id
      if (content) filter.content = content
      if (priority) filter.priority = priority
      if (tradeOffBoost) filter.tradeOffBoost = tradeOffBoost
      if (type) filter.type = type
      if (connectedCards) filter.connectedCards = connectedCards
      if (authorCard) filter.authorCard = authorCard
      if (score) filter.score = score


      let cardMemoryData = addCardMemoryFunc(filter)

      return cardMemoryData


      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addCardMemory",
        { component: "cardMemoryMutation > addCardMemory" }
      );
    }
  },
  deleteCardMemory: async (parent, args, context, info) => {
    const { _id,companyID,userID,positionID} = args.fields;
    console.log("Mutation > deleteCardMemory > args.fields = ", args.fields);

    if (!_id && !companyID && !userID && !positionID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > deleteCardMemory" });

    try {

      let cardMemoriesData = [];

      if (_id) { 

        cardMemoriesData = await CardMemory.find({ _id });

        printC(cardMemoriesData, "1", "cardMemoriesData", "b")

        if (!cardMemoriesData || cardMemoriesData.length == 0) throw new ApolloError("CardMemory not found", { component: "cardMemoryMutation > deleteCardMemory" });

        

      } else {


        if (positionID && userID){ // this means that we will delete only the userID cards of this position

          let cardMemoriesDataPrep = await CardMemory.find({ 
            "authorCard.positionID": positionID  
          });


          printC(cardMemoriesDataPrep, "2", "cardMemoriesDataPrep", "b")


          // only take the ID of the connectedCards 
          let connectedCardsID = []
          for (let i = 0; i < cardMemoriesDataPrep.length; i++) {
            const cardMemory = cardMemoriesDataPrep[i];
            for (let j = 0; j < cardMemory.connectedCards.length; j++) {
              const connectedCard = cardMemory.connectedCards[j];

              if (connectedCard.cardID) connectedCardsID.push(connectedCard.cardID)
            }
          }

          printC(connectedCardsID, "3", "connectedCardsID", "g")

          connectedCardsData = await CardMemory.find({
            _id: { $in: connectedCardsID }
          });

          printC(connectedCardsData, "4", "connectedCardsData", "g")

          for (let i = 0; i < connectedCardsData.length; i++) {
            const connectedCard = connectedCardsData[i];

            if (connectedCard?.authorCard?.userID?.toString() == userID?.toString()){
              cardMemoriesData.push(connectedCard)
            }
          }

          // sdf10


        } else if (positionID){
            
            cardMemoriesData = await CardMemory.find({ 
              "authorCard.positionID": positionID  
            });

            // only take the ID of the connectedCards 
            let connectedCardsID = []
            for (let i = 0; i < cardMemoriesData.length; i++) {
              const cardMemory = cardMemoriesData[i];
              for (let j = 0; j < cardMemory.connectedCards.length; j++) {
                const connectedCard = cardMemory.connectedCards[j];

                if (connectedCard.cardID) connectedCardsID.push(connectedCard.cardID)
              }
            }

            connectedCardsData = await CardMemory.find({
              _id: { $in: connectedCardsID }
            });
  
            printC(connectedCardsData, "4", "connectedCardsData", "g")
  
            for (let i = 0; i < connectedCardsData.length; i++) {
              const connectedCard = connectedCardsData[i];
  
              if (connectedCard?.authorCard?.positionID?.toString() == positionID?.toString()){
                cardMemoriesData.push(connectedCard)
              }
            }




        } else if (userID){
            
            cardMemoriesData = await CardMemory.find({ 
              "authorCard.userID": userID  
            });

             // only take the ID of the connectedCards 
             let connectedCardsID = []
             for (let i = 0; i < cardMemoriesData.length; i++) {
               const cardMemory = cardMemoriesData[i];
               for (let j = 0; j < cardMemory.connectedCards.length; j++) {
                 const connectedCard = cardMemory.connectedCards[j];
 
                 if (connectedCard.cardID) connectedCardsID.push(connectedCard.cardID)
               }
             }
 
             connectedCardsData = await CardMemory.find({
               _id: { $in: connectedCardsID }
             });
   
             printC(connectedCardsData, "4", "connectedCardsData", "g")
   
             for (let i = 0; i < connectedCardsData.length; i++) {
               const connectedCard = connectedCardsData[i];
   
               if (connectedCard?.authorCard?.userID?.toString() == userID?.toString()){
                 cardMemoriesData.push(connectedCard)
               }
             }

        } else if (companyID){
              
            cardMemoriesData = await CardMemory.find({ 
              "authorCard.companyID": companyID  
            });
  

        }


      }

      printC(cardMemoriesData, "1", "cardMemoriesData", "b")

      // sd9

      deleteCardIDs = []
      deletePineconeIDs = []
      for (let i = 0; i < cardMemoriesData.length; i++) {
        const cardMemory = cardMemoriesData[i];

        deleteCardIDs.push(cardMemory._id)
        deletePineconeIDs.push(cardMemory.pineconeDB.pineconeID)

        // ------------ Delete from PineCone -------------
        // ------------ Delete from PineCone -------------


        // --------------- Delete from the connectedCards the cardID ---------------
        for (let j = 0; j < cardMemory.connectedCards.length; j++) {
          const connectedCard = cardMemory.connectedCards[j];

          const connectedCardData = await CardMemory.findOne({ _id: connectedCard.cardID }).select('_id connectedCards');

          if (connectedCardData) {

            for (let k = 0; k < connectedCardData.connectedCards.length; k++) {
              const connectedCardDataNow = connectedCardData.connectedCards[k];

              if (connectedCardDataNow?.cardID?.toString() == cardMemory?._id?.toString()){

                connectedCardData.connectedCards.splice(k, 1);

                await connectedCardData.save();
              }
            }
          }
        }
        // --------------- Delete from the connectedCards the cardID ---------------

      }

      await deletePineCone(deletePineconeIDs)

      await CardMemory.deleteMany({ _id: deleteCardIDs});

      printC(deleteCardIDs, "1", "deleteCardIDs", "y")

      return cardMemoriesData

     

      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "deleteCardMemory",
        { component: "cardMemoryMutation > deleteCardMemory" }
      );
    }
  },
  createCardsForPosition: async (parent, args, context, info) => {
    const { positionID} = args.fields;
    console.log("Mutation > createCardsForPosition > args.fields = ", args.fields);


    if (!positionID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > createCardsForPosition" });

    positionData = await Position.findOne({ _id: positionID }).select('_id name positionsRequirements');

    if (!positionData) throw new ApolloError("Position not found", { component: "cardMemoryMutation > createCardsForPosition" });

    try {

      let cardMemoriesData = null

      cardMemoriesData = await CardMemory.find({ "authorCard.positionID": positionID  });

      if (cardMemoriesData.length > 0){

        // ----------------- Check if the memories are on pinecone and add it ------------------
        const reactAppMongoDatabase = process.env.REACT_APP_MONGO_DATABASE
        for (let i = 0; i < cardMemoriesData.length; i++) {
          if (cardMemoriesData[i].pineconeDB.pineconeID) continue

          let textPinecone = cardMemoriesData[i].content + "\n Category: " + cardMemoriesData[i].type

          let filterUpsert = {
            text: textPinecone,
            database: reactAppMongoDatabase,
            label: "scoreCardMemory",
            category: cardMemoriesData[i].type,
            positionID: positionID,
            mongoID: cardMemoriesData[i]._id,
          }

          let resPineCone  = await upsertEmbedingPineCone(filterUpsert)

          cardMemoriesData[i].pineconeDB = {
            pineconeID: resPineCone.pineConeID,
            text: textPinecone,
            metadata: {
              label: "scoreCardMemory",
              database: reactAppMongoDatabase,
              positionID: positionID,
            }
          }
        }
        // ----------------- Check if the memories are on pinecone and add it ------------------

        return cardMemoriesData
      }


      // -------------- Job Requirements --------------
      const positionsRequirements = positionData.positionsRequirements.originalContent

     
      const tradeOffs = positionData.positionsRequirements.tradeOffs

    
      const priorities = positionData.positionsRequirements.priorities

      printC(positionsRequirements, "1", "positionsRequirements", "b")


      let tradeOffsPrompt = ""
      for (let i = 0; i < tradeOffs.length; i++) {
        const tradeOff = tradeOffs[i];
        if (tradeOff.selected == tradeOff.tradeOff1)
          tradeOffsPrompt = tradeOffsPrompt + "- Choose '" + tradeOff.tradeOff1 + "' Over '" + tradeOff.tradeOff2 + "'\n\n";
        else
          tradeOffsPrompt = tradeOffsPrompt + "- Choose '" + tradeOff.tradeOff2 + "' Over '" + tradeOff.tradeOff1 + "'\n\n";
      }
      printC(tradeOffsPrompt, "2", "tradeOffsPrompt", "y")

      let prioritiesPrompt = ""
      for (let i = 0; i < priorities.length; i++) {
        const priority = priorities[i];
        prioritiesPrompt = prioritiesPrompt + (i+1) + ". " + priority.priority + "\n\n";
      }

      printC(prioritiesPrompt, "2", "prioritiesPrompt", "y")
      // -------------- Job Requirements --------------


      //  --------- Find conversation of position ---------
      convData = await Conversation.findOne({
        $and: [{ positionID: positionID }, { positionTrainEdenAI: "true" }],
      }).select("_id conversation");



      let promptConv = "";
      if (convData){
        for (let i = 0; i < convData.conversation.length; i++) {
          let convDataNow = convData.conversation[i];
          if (convDataNow.role == "assistant")
            promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
          else
            promptConv = promptConv + "User" + ": " + convDataNow.content + " \n\n";
        }
      }
      printC(promptConv, "2", "promptConv", "y")

      //  --------- Find conversation of position ---------


      // --------- Prompt for finding Cards -----------
      promptFindCards = `
      Job Description (delimited <>): <${positionsRequirements}>
      Job Position Description (delimited <>): <${promptConv}>
      Hiring manager conversations

            Job Trade Offs (delimited <>): <${tradeOffsPrompt}>

            Job Priorities (delimited <>): <${prioritiesPrompt}>
      

      - Your task is to extract detailed score topics that seem to be important to the hiring manager who drafted the job description
      - For each score topic extract the Category, the Priority, the Tradeoff Boost & the content
      - the category can be: TECHNICAL_SKILLS, BEHAVIOR, EXPERIENCE, INDUSTRY_KNOWLEDGE, INTERESTS, CORE_VALUES, GOALS, EDUCATION, OTHER
      - the Priority is a number from 1 High, to 5 Low
      - the Tradeoff Boost is a number 1 Boost, to -1 Penalty, 0 Neutral based on the tradeoff
      - the Content is a brief description of the score topic deliniated with a hyphen and then additionally relevant context as to why this is an important score topic. Do not invent any information here, use all the information you've been given by the hiring manager in the job description, position, hiring manager conversation, the tradeoffs & priorities.
      - Do not use any non-descriptive words like good, proficient, apt - use specific adjectives. 
      - Choose the of memories you have from 10 to 30 Memories to represent the most important parts of the Job

            - Example of Score Topics
      1. TECHNICAL_SKILLS / 1 / 1 / 5 years or equivalent experience in Python - We're building a data science product so demonstrable experience using data science libraries like scikit learn, tensorflow, ... is important.  
      2. BEHAVIOR / 3 / -1 / Demonstrated remote leadership experience for teams bigger than 4 - we work fully remotely, so having worked in a team prior is important for us. 
      3. EXPERIENCE / 4 / 1 / Experience working with chinese teams - this is our first hire outside of china so experience having worked in China is a huge plus. 
      4. ...

            Memories Result 10 to 30:
      `
      // promptFindCards = `
      // Job Description (delimited <>): <${positionsRequirements}>
      // Job Position Description (delimited <>): <${promptConv}>

      // Job Trade Offs (delimited <>): <${tradeOffsPrompt}>

      // Job Priorities (delimited <>): <${prioritiesPrompt}>


      // - Your task is to create a Memory that will indicate the best fit with a future candidate
      // - You need to extract for each Memory the Category, Priority,  Tradeoff Boost, content
      // - Category can be: TECHNICAL_SKILLS, SOFT_SKILLS, EXPERIENCE, INDUSTRY_KNOWLEDGE, INTERESTS, CORE_VALUES, GOALS, OTHER
      // - Priority is a number from 1 High, to 5 Low
      // - Tradeoff Boost is a number 1 Boost, to -1 Penalty, 0 Neutral based on the tradeoff
      // - Content is a text that describes the Memory
      // - Be careful choosing the right amount of memories you have from 10 to 30 Memories to represent the most important parts of the Job

      // - Example of Memory:
      // 1. TECHNICAL_SKILLS / 1 / 1 / Senior in Python
      // 2. SOFT_SKILLS / 3 / -1 / Great leader
      // 3. EXPERIENCE / 4 / 1 / Work experience for at least 5 years in react
      // 4. ...

      // Memories Result 10 to 30:
      // `

      cardMemoriesString = await useGPTchatSimple(promptFindCards, 0,"API 2","chatGPT4");

//         cardMemoriesString = ` 1. TECHNICAL_SKILLS / 1 / 1 / Proficient in React, TypeScript, API GraphQL, and TailwindCSS
// 2. EXPERIENCE / 1 / 1 / Proven experience in front-end development
// 3. TECHNICAL_SKILLS / 2 / 1 / Good UI design skills
// 4. EXPERIENCE / 2 / 1 / Experience in product development is a plus
// 5. SOFT_SKILLS / 2 / 1 / Good communication and problem-solving skills
// 6. SOFT_SKILLS / 1 / 1 / Dependability is key
// 7. EXPERIENCE / 1 / 1 / Senior level experience is required
// 8. TECHNICAL_SKILLS / 1 / 1 / Ability to develop UI components using React & TypeScript
// 9. TECHNICAL_SKILLS / 1 / 1 / Ability to read GraphQL and work closely with backend team
// 10. SOFT_SKILLS / 2 / 1 / Ability to contribute to UI/UX design
// 11. SOFT_SKILLS / 2 / 1 / Ability to partake in early stages of product development
// 12. SOFT_SKILLS / 3 / 1 / Ability to understand users and translate that into frontend
// 13. SOFT_SKILLS / 3 / 1 / Ability to work in a fast-paced startup environment
// 14. EXPERIENCE / 1 / 1 / Impressive portfolio of positions that worked and created awesome designs with clean code
// 15. SOFT_SKILLS / 3 / -1 / Flexible on the salary expectations
// 16. SOFT_SKILLS / 3 / 1 / Ability to move tasks forward and discuss progress in meetings
// 17. CORE_VALUES / 4 / 1 / Aligns with Eden's mission to help everyone on Earth find work & co-workers they love
// 18. INTERESTS / 5 / 0 / Interest in AI & blockchain-powered talent-matching tools
// 19. GOALS / 5 / 0 / Aim to be the right person on the right project for the right reasons
// 20. OTHER / 5 / 0 / Comfortable in a lively, transformative startup environment.`

      printC(cardMemoriesString, "3", "cardMemoriesString", "g")
      // --------- Prompt for finding Cards -----------

      // --------- Regex the cardMemoriesString ----------

      const regex = /^(.*?) \/ (\d+) \/ (-?\d+) \/ (.*)$/gm;
      const cardMemoriesArray = [];
      
      let match;
      while ((match = regex.exec(cardMemoriesString)) !== null) {
        let obj = {
          category: match[1].trim().split('. ')[1],
          priority: parseInt(match[2]),
          tradeoffBoost: parseInt(match[3]),
          description: match[4].trim(),
          scoreCriteria: ""
        };

        const descriptionParts = obj.description.split(' - ');
        obj.description = descriptionParts[0].trim();
        obj.scoreCriteria = descriptionParts[1] ? descriptionParts[1].trim() : '';


        cardMemoriesArray.push(obj);
      }
      
      console.log(cardMemoriesArray);
      // s12
      // --------- Regex the cardMemoriesString ----------




      // --------- Prompt for finding Cards -----------
      promptFindKeyPriorities = `
      Job Description (delimited <>): <${positionsRequirements}>
      Job Position Description (delimited <>): <${promptConv}>

      Job Priorities (delimited <>): <${prioritiesPrompt}>

      Score Topics (delimited <>): <${cardMemoriesString}>


      - Find the ONE key priority Topic, you can only choose ONE
      - Find the Future Potential Topic, you can choose three
      - You need to return only the numbers of the Topics, the format need to match the example below with the real numbers of the score topics 
      - Don't use the same priority and future potential Topic

      Example:
      Key Priority: number_1
      Future Potential: number_2, number_3, number_4

      Result: 
      `

      keyPrioritiesAndFuturePotential = await useGPTchatSimple(promptFindKeyPriorities, 0,"API 1");

        // keyPrioritiesAndFuturePotential = `Key Priority: 1
        // Future Potential: 2, 3, 8`

      printC(keyPrioritiesAndFuturePotential, "3", "keyPrioritiesAndFuturePotential", "g")
      // --------- Prompt for finding Cards -----------

      // --------- Regex the keyPrioritiesAndFuturePotential ----------
      let keyPriority = keyPrioritiesAndFuturePotential.match(/Key Priority: (\d+)/)[1];
      keyPriority = parseInt(keyPriority)


      const futurePotential = keyPrioritiesAndFuturePotential.match(/Future Potential: ([\d,\s]+)/)[1].split(',').map(Number);
      
      
      console.log("keyPriority = ",keyPriority);
      console.log("futurePotential = ",futurePotential);
      // --------- Regex the keyPrioritiesAndFuturePotential ----------


      // --------- add keyPrioritiesAndFuturePotential to cardMemoriesArray ----------

      cardMemoriesArray[keyPriority-1].keyPriority = true;

      for (let i = 0; i < futurePotential.length; i++) {
        const futurePotentialNow = futurePotential[i];
        cardMemoriesArray[futurePotentialNow-1].futurePotential = true;
      }

      printC(cardMemoriesArray, "5", "cardMemoriesArray", "g")
      // --------- add keyPrioritiesAndFuturePotential to cardMemoriesArray ----------



      // --------- Add Card Memories ----------
      let cardMemories = []

      for (let i = 0; i < cardMemoriesArray.length; i++) {
        const cardMemory = cardMemoriesArray[i];

      
        cardMemories.push({
          content: cardMemory.description,
          scoreCriteria: cardMemory.scoreCriteria,
          priority: cardMemory.priority,
          tradeOffBoost: cardMemory.tradeoffBoost,
          type: cardMemory.category,
          authorCard: {
            positionID: positionID,
            category: "POSITION"
          },
          pineconeDB: {},
        })

        if (cardMemory.keyPriority) {
          cardMemories[cardMemories.length - 1] = {
            ...cardMemories[cardMemories.length - 1],
            keyPriority: true,
          }
        }

        if (cardMemory.futurePotential) {
          cardMemories[cardMemories.length - 1] = {
            ...cardMemories[cardMemories.length - 1],
            futurePotential: true,
          }
        }

      }

      printC(cardMemories, "6", "cardMemories", "g")

       
      cardMemoriesData = await CardMemory.insertMany(cardMemories);
      // --------- Add Card Memories ----------


      // ----------------- Add Memories on Pinecone ------------------
      const reactAppMongoDatabase = process.env.REACT_APP_MONGO_DATABASE
      for (let i = 0; i < cardMemoriesData.length; i++) {

        let textPinecone = cardMemoriesData[i].content + "\n Category: " + cardMemoriesData[i].type

        let filterUpsert = {
          text: textPinecone,
          database: reactAppMongoDatabase,
          label: "scoreCardMemory",
          category: cardMemoriesData[i].type,
          positionID: positionID,
          mongoID: cardMemoriesData[i]._id,
        }

        let resPineCone  = await upsertEmbedingPineCone(filterUpsert)

        cardMemoriesData[i].pineconeDB = {
          pineconeID: resPineCone.pineConeID,
          text: textPinecone,
          metadata: {
            label: "scoreCardMemory",
            database: reactAppMongoDatabase,
            positionID: positionID,
          }
        }

        await cardMemoriesData[i].save();
      }
      // ----------------- Add Memories on Pinecone ------------------
      

      return cardMemoriesData
      
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "createCardsForPosition",
        { component: "cardMemoryMutation > createCardsForPosition" }
      );
    }
  },
  createCardsCandidateForPosition: async (parent, args, context, info) => {
    const { positionID} = args.fields;
    let { userID} = args.fields;
    console.log("Mutation > createCardsCandidateForPosition > args.fields = ", args.fields);

    res = await createCardsCandidateForPositionFunc(positionID,userID)

    return res
  },

  calculateScoreCardCandidateToPosition: async (parent, args, context, info) => {
    let { userID, positionID} = args.fields;
    console.log("Mutation > calculateScoreCardCandidateToPosition > args.fields = ", args.fields);

    res = await calculateScoreCardCandidateToPositionFunc(userID,positionID)
  },

};


function wait(x) {
  return new Promise(resolve => {
    setTimeout(resolve, x*1000);
  });
}

