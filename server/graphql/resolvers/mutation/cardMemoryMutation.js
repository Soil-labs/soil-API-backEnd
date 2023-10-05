const { ApolloError } = require("apollo-server-express");

const { printC } = require("../../../printModule");

const { Position } = require("../../../models/positionModel");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { Conversation } = require("../../../models/conversationModel");
const { Members } = require("../../../models/membersModel");

const {addCardMemoryFunc,createCardsScoresCandidate_3,connectCardsPositionToCandidateAndScore} = require("../utils/cardMemoryModules");


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
      for (let i = 0; i < cardMemoriesData.length; i++) {
        const cardMemory = cardMemoriesData[i];

        deleteCardIDs.push(cardMemory._id)


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

      if (cardMemoriesData.length > 0) 
        return cardMemoriesData


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
      for (let i = 0; i < convData.conversation.length; i++) {
        let convDataNow = convData.conversation[i];
        if (convDataNow.role == "assistant")
          promptConv = promptConv + "Recruiter: " + convDataNow.content + " \n\n";
        else
          promptConv = promptConv + "User" + ": " + convDataNow.content + " \n\n";
      }

      printC(promptConv, "2", "promptConv", "y")
      //  --------- Find conversation of position ---------


      // --------- Prompt for finding Cards -----------
      promptFindCards = `
      Job Description (delimited <>): <${positionsRequirements}>
      Job Position Description (delimited <>): <${promptConv}>

      Job Trade Offs (delimited <>): <${tradeOffsPrompt}>

      Job Priorities (delimited <>): <${prioritiesPrompt}>


      - Your task is to create a Memory that will indicate the best fit with a future candidate
      - You need to extract for each Memory the Category, Priority,  Tradeoff Boost, content
      - Category can be: TECHNICAL_SKILLS, SOFT_SKILLS, EXPERIENCE, INDUSTRY_KNOWLEDGE, INTERESTS, CORE_VALUES, GOALS, OTHER
      - Priority is a number from 1 High, to 5 Low
      - Tradeoff Boost is a number 1 Boost, to -1 Penalty, 0 Neutral based on the tradeoff
      - Content is a text that describes the Memory
      - Be careful choosing the right amount of memories you have from 10 to 30 Memories to represent the most important parts of the Job

      - Example of Memory:
      1. TECHNICAL_SKILLS / 1 / 1 / Senior in Python
      2. SOFT_SKILLS / 3 / -1 / Great leader
      3. EXPERIENCE / 4 / 1 / Work experience for at least 5 years in react
      4. ...

      Memories Result 10 to 30:
      `

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
        const obj = {
          category: match[1].trim().split('. ')[1],
          priority: parseInt(match[2]),
          tradeoffBoost: parseInt(match[3]),
          description: match[4].trim(),
        };
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
          priority: cardMemory.priority,
          tradeOffBoost: cardMemory.tradeoffBoost,
          type: cardMemory.category,
          authorCard: {
            positionID: positionID,
            category: "POSITION"
          },
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
    const { userID, positionID} = args.fields;
    console.log("Mutation > createCardsCandidateForPosition > args.fields = ", args.fields);


    if (!positionID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > createCardsCandidateForPosition" });
    positionData = await Position.findOne({ _id: positionID }).select('_id name positionsRequirements');
    if (!positionData) throw new ApolloError("Position not found", { component: "cardMemoryMutation > createCardsCandidateForPosition" });
    

    // -------------- Read every Card of the Position --------------
    cardMemoriesData = await CardMemory.find({ "authorCard.positionID": positionID  });

    if (cardMemoriesData.length == 0) throw new ApolloError("CardMemory for Position not found First Create Cards for the Position", { component: "cardMemoryMutation > createCardsCandidateForPosition" });

    printC(cardMemoriesData, "1", "cardMemoriesData", "b")
    
    // -------------- Read every Card of the Position --------------


    if (!userID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > createCardsCandidateForPosition" });
    memberData = await Members.findOne({ _id: userID }).select('_id discordName cvInfo');

    if (!memberData) throw new ApolloError("User not found", { component: "cardMemoryMutation > createCardsCandidateForPosition" });

    try {

      // ---------- CV member ----------
      const cvInfo = memberData.cvInfo.cvContent

      // ---------- CV member ----------

      //  --------- Find conversation of position ---------
      convData = await Conversation.findOne({
        $and: [{ positionID: positionID }, { userID: userID }],
      }).select("_id conversation");



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

    //  sd9

      cardMemoryDataNowAll = await connectCardsPositionToCandidateAndScore(cardMemoriesCandidateArray,cardMemoriesData,userID)



      return cardMemoryDataNowAll

      
    } catch (err) {
      console.log("err = ",err)
      throw new ApolloError(
        err.message,
        err.extensions?.code || "createCardsCandidateForPosition",
        { component: "cardMemoryMutation > createCardsCandidateForPosition" }
      );
    }
  },

  calculateScoreCardCandidateToPosition: async (parent, args, context, info) => {
    const { userID, positionID} = args.fields;
    console.log("Mutation > calculateScoreCardCandidateToPosition > args.fields = ", args.fields);


    e = 0.9 // SOS 🆘 - Variable for Curvature of score
    u = 0.1 // SOS 🆘 - Variable for Curvature of score
    

    let A_m = 0.9// SOS 🆘 - Variables to change the equation for m which is  weight/importance of each card 
    let B_m = 0.2 
    // m = A*e**(-B*n)
    // m = 0.5 //Old -  Variable to change the weight/importance of each card 




    if (!positionID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });
    positionData = await Position.findOne({ _id: positionID }).select('_id name positionsRequirements candidates');
    if (!positionData) throw new ApolloError("Position not found", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });
    

    // find were is the userID inside teh positionData.candidates.userID and keep this index
    let indexCandidateOnPosition = -1

    for (let i = 0; i < positionData.candidates.length; i++) {
      const candidate = positionData.candidates[i];
      if (candidate.userID.toString() == userID.toString()){
        indexCandidateOnPosition = i
        break
      }
    }

    if (indexCandidateOnPosition == -1) throw new ApolloError("User not found on the Position", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });


    // -------------- Read every Card of the Position --------------
    cardMemoriesDataPosition = await CardMemory.find({ "authorCard.positionID": positionID  });

    if (cardMemoriesDataPosition.length == 0) throw new ApolloError("CardMemory for Position not found First Create Cards for the Position", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });

    printC(cardMemoriesDataPosition, "1", "cardMemoriesDataPosition", "b")
    
    // -------------- Read every Card of the Position --------------


    if (!userID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });
    memberData = await Members.findOne({ _id: userID }).select('_id discordName cvInfo');

    if (!memberData) throw new ApolloError("User not found", { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" });

    try {

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
      cardMemoriesDataCandidate = []
      cardMemoriesDataCandidateObj = {}


      for (let i = 0; i < connectedCardDataN.length; i++) {
        const connectedCardDataNow = connectedCardDataN[i];
        if (connectedCardDataNow.authorCard.category == "CANDIDATE") {
          cardMemoriesDataCandidate.push(connectedCardDataNow)

          cardMemoriesDataCandidateObj[connectedCardDataNow._id] = connectedCardDataNow

        }
      }

      printC(cardMemoriesDataCandidate, "3", "cardMemoriesDataCandidate", "r")
      // as1

      // ------------- Find all the IDs of teh cardMemoriesDataPosition connected cards --------


      // --------------- Go to each candidate card and calculate the internal score ---------------
      for (let i = 0; i < cardMemoriesDataCandidate.length; i++) {
        const cardMemoryCandidate = cardMemoriesDataCandidate[i];
        
        if (!cardMemoryCandidate.score) continue

        if (cardMemoryCandidate.score.overall) {
          cardMemoriesDataCandidateObj[cardMemoryCandidate._id].score.overall = cardMemoryCandidate.score.overall
          continue
        }

        let scoreInternal = 0
        let scoreInternalCount = 0
        
        for (let j = 0; j < cardMemoryCandidate.score?.agent?.length; j++) {
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
      // --------------- Go to each candidate card and calculate the internal score ---------------


      
      
      // --------------- Go to each position card and calculate the external-internal score ---------------
      for (let i = 0; i < cardMemoriesDataPosition.length; i++) {
        const cardMemoryPosition = cardMemoriesDataPosition[i];

        // printC(cardMemoryPosition.connectedCards, "3", "cardMemoryPosition.connectedCards", "p")

        let scoreInternalExternal = 0
        let scoreInternalExternalCount = 0

        let n = cardMemoryPosition.connectedCards.length

        let m = A_m*e**(-B_m*n)
        
        for (let j = 0; j < cardMemoryPosition.connectedCards.length; j++) {
          const connectedCard = cardMemoryPosition.connectedCards[j];

          let scoreExternal = 0
          let scoreExternalCont = 0

          for (let k=0; k < connectedCard.agent.length; k++) {
            const agent = connectedCard.agent[k];
            if (agent.score) {
              scoreExternal = scoreExternal + agent.score
              scoreExternalCont = scoreExternalCont + 1
            }
          }

          if (scoreExternalCont > 0) scoreExternal = scoreExternal / scoreExternalCont

          printC(connectedCard, "3", "connectedCard", "p")
          printC(scoreExternal, "4", "scoreExternal", "b")

          let scoreInternal = cardMemoriesDataCandidateObj[connectedCard.cardID].score.overall
          printC(scoreInternal, "4", "scoreInternal", "b")

          let scoreInternalExternalNow = (scoreInternal*0.1) * (scoreExternal*0.1) //  multiple with 0.1 to reduce score from 0 to 1

          cardMemoryPosition.connectedCards[j].score = scoreInternalExternalNow.toFixed(2)

          scoreInternalExternal += scoreInternalExternalNow*m // multiple with m to change the weight of the card
          scoreInternalExternalCount = scoreInternalExternalCount + 1
        }
        // s9

        if (scoreInternalExternalCount > 0) {
          scoreInternalExternal = e*(scoreInternalExternal**2) + u 

          if (scoreInternalExternal > 1) scoreInternalExternal = 1

          cardMemoryPosition.score.overall = scoreInternalExternal.toFixed(2)

          printC(cardMemoryPosition, "3", "cardMemoryPosition", "p")
          printC(scoreInternalExternal, "4", "scoreInternalExternal", "b")

          await cardMemoryPosition.save()
        }


        
      }
      // --------------- Go to each position card and calculate the external-internal score ---------------


      // --------------- Loop find the reasons for teh scores ---------------
      for (let i = 0; i < cardMemoriesDataPosition.length; i++) {

        const cardMemoriesDataPositionN = cardMemoriesDataPosition[i];

        const cardMemoriesScore = cardMemoriesDataPositionN.score.overall;

        if (!cardMemoriesScore) continue

        if (cardMemoriesDataPositionN.score.reason) continue
        

        // Fid the Data for the prompt
        const cardMemoryPositionContent = cardMemoriesDataPositionN.content;

        let cardMemoryCandidateContent = ""

        for (let j=0;j<cardMemoriesDataPositionN?.connectedCards?.length;j++){
          const connectedCard = cardMemoriesDataPositionN.connectedCards[j];

          // printC(connectedCard, "3", "connectedCard", "p")
          
          const connectedCardDataTT = cardMemoriesDataCandidateObj[connectedCard.cardID]
          
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
        - Go straight to the point, don't mention the score, keep it really small 30 - 50 words

        reason: 
        `

        printC(promptReasonScore, "5", "promptReasonScore", "p")
        // s10

        const apiVersion = Math.random() < 0.5 ? "API 1" : "API 2";
        reasonScoreString = await useGPTchatSimple(promptReasonScore, 0,apiVersion);

        printC(reasonScoreString, "5", "reasonScoreString", "b")


        cardMemoriesDataPositionN.score.reason = reasonScoreString

        await cardMemoriesDataPositionN.save()

        // s0



        wait(2)

      }
      // --------------- Loop find the reasons for teh scores ---------------


      printC(cardMemoriesDataPosition, "3", "cardMemoriesDataPosition", "r")


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

          if (scoreCardCategoryMemory.category == cardMemoryPosition.type){
            if (scoreCardCategoryMemory.score) cardMemoriesDataPositionObj[cardMemoryPosition.type].score = scoreCardCategoryMemory.score

            if (scoreCardCategoryMemory.reason) cardMemoriesDataPositionObj[cardMemoryPosition.type].reason = scoreCardCategoryMemory.reason

            if (scoreCardCategoryMemory.priority) cardMemoriesDataPositionObj[cardMemoryPosition.type].priority = scoreCardCategoryMemory.priority

            cardMemoriesDataPositionObj[cardMemoryPosition.type].idxScoreCategoryCandidates = j
            
          }
        }
        // ---------------- if already score or reason exist add it to the object ------------
      }

      printC(cardMemoriesDataPositionObj, "3", "cardMemoriesDataPositionObj", "r")
      // // printC(cardMemoriesDataPositionObj["SOFT_SKILLS"], "3", "cardMemoriesDataPositionObj", "r")
// d9

      // ------------------ Organize per category -------------------

      // ------------------ calculate total score and reason in each category ------------
      for (const category in cardMemoriesDataPositionObj) {
        if (Object.hasOwnProperty.call(cardMemoriesDataPositionObj, category)) {
          const cardMemoriesDataPositionObjNow = cardMemoriesDataPositionObj[category];


          if (cardMemoriesDataPositionObjNow.score != -1) continue

          
          let totalScore = 0
          let totalScoreCount = 0
          let totalScoreC = 0
          let averagePriorityCategory = 0

          for (let i = 0; i < cardMemoriesDataPositionObjNow.cardMemoryPosition.length; i++) {
            const cardMemoryPosition = cardMemoriesDataPositionObjNow.cardMemoryPosition[i];

            if (cardMemoryPosition.score?.overall){
              totalScore += cardMemoryPosition.score.overall*(6 - cardMemoryPosition.priority)
              // totalScoreCount += 1
              totalScoreCount += 6 - cardMemoryPosition.priority
              totalScoreC += 1
            }
            
          }

          if (totalScoreCount > 0) totalScore = totalScore / totalScoreCount
          if (totalScoreC > 0) averagePriorityCategory = totalScoreCount / totalScoreC

          cardMemoriesDataPositionObj[category].score = totalScore
 
          if (cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates != -1) {

            const idx = cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates

            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[idx].score = totalScore
            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[idx].priority = averagePriorityCategory.toFixed(2)

          } else {
            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.push({
              category: category,
              score: totalScore,
              priority: averagePriorityCategory.toFixed(2),
            })

            cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates = positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.length - 1

          }


        }
      }
      printC(cardMemoriesDataPositionObj, "8", "cardMemoriesDataPositionObj", "B")
      // printC(cardMemoriesDataPositionObj["INTERESTS"], "9", "cardMemoriesDataPositionObj", "B")
      // printC(cardMemoriesDataPositionObj["INTERESTS"].cardMemoryPosition, "10", "cardMemoriesDataPositionObj", "B")
      // ------------------ calculate total score and reason in each category ------------

      // await positionData.save()
      // s9

      // ------------ find reason for score------------
      for (const category in cardMemoriesDataPositionObj) {
        if (Object.hasOwnProperty.call(cardMemoriesDataPositionObj, category)) {
          const cardMemoriesDataPositionObjNow = cardMemoriesDataPositionObj[category];


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
          - Go straight to the point, don't mention the score, keep it really small 30 - 50 words

          reason: 
          `

          printC(promptReasonCategoryScore, "5", "promptReasonCategoryScore", "p")


          const apiVersion = Math.random() < 0.5 ? "API 1" : "API 2";
          let reasonCategoryScore = await useGPTchatSimple(promptReasonCategoryScore, 0,apiVersion);
  
          printC(reasonCategoryScore, "5", "reasonCategoryScore", "b")


          if (cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates != -1){

            const idx = cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates

            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories[idx].reason = reasonCategoryScore
          } else {
            positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.push({
              category: category,
              reason: reasonCategoryScore,
            })

            cardMemoriesDataPositionObj[category].idxScoreCategoryCandidates = positionData.candidates[indexCandidateOnPosition].scoreCardCategoryMemories.length - 1

          }



          wait (3);

        }
      }

      // ------------ find reason for score------------


      // -------------- Total Score of Candidate --------------
      // printC(positionData.candidates[indexCandidateOnPosition].scoreCardTotal, "12", "positionData.candidates[indexCandidateOnPosition].scoreCardTotal", "g")
      if (!positionData.candidates[indexCandidateOnPosition]?.scoreCardTotal?.score) {
        let totalScoreCandidate = 0
        let totalScoreCandidateCount = 0

        for (const category in cardMemoriesDataPositionObj) {
          if (Object.hasOwnProperty.call(cardMemoriesDataPositionObj, category)) {
            const cardMemoriesDataPositionObjNow = cardMemoriesDataPositionObj[category];

            printC(cardMemoriesDataPositionObjNow, "3", "cardMemoriesDataPositionObjNow", "r")

            if (cardMemoriesDataPositionObjNow.score){
              totalScoreCandidate += cardMemoriesDataPositionObjNow.score*cardMemoriesDataPositionObjNow.priority
              totalScoreCandidateCount += cardMemoriesDataPositionObjNow.priority
            }

          }
        }

        if (totalScoreCandidateCount > 0) {
          totalScoreCandidate = totalScoreCandidate / totalScoreCandidateCount
          positionData.candidates[indexCandidateOnPosition].scoreCardTotal.score = totalScoreCandidate.toFixed(2)

          printC(totalScoreCandidate, "12", "totalScoreCandidate", "g")
        }
      }

      // -------------- Total Score of Candidate --------------


      await positionData.save()


      return cardMemoriesDataCandidate
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "calculateScoreCardCandidateToPosition",
        { component: "cardMemoryMutation > calculateScoreCardCandidateToPosition" }
      );
    }
  },

};


function wait(x) {
  return new Promise(resolve => {
    setTimeout(resolve, x*1000);
  });
}

