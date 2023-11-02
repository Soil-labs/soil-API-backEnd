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
  calculateScoreCardCandidateToPositionFunc,
  createCardsForPosition,
  createCardsForPositionFunc,} = require("../utils/cardMemoryModules");

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


    let cardMemoriesData = await createCardsForPositionFunc(args.fields)

    return cardMemoriesData


  },
  autoCreateCardsForPosition: async (parent, args, context, info) => {
    const { } = args.fields;
    console.log("Mutation > autoCreateCardsForPosition > args.fields = ", args.fields);


    let positionsData = []
    let cardMemoriesData = []


    try {
    // Find all the positions, 
    positionsData = await Position.find({cardsPositionCalculated: { $ne: true } }).select('_id cardsPositionCalculated');
    printC(positionsData.length, "3", "Number of Positions to go ", "p")


    if (positionsData.length == 0) return cardMemoriesData

    // just check the first if it has already cards, if it does make it true, else find the cards 
    cardMemoriesData = await CardMemory.find({ "authorCard.positionID": positionsData[0]._id  });


    if (cardMemoriesData.length > 0) {
      positionsData[0].cardsPositionCalculated = true;
      await positionsData[0].save();
    } else {
      cardMemoriesData = await createCardsForPositionFunc({
        positionID: positionsData[0]._id
      })
      positionsData[0].cardsPositionCalculated = true;
      await positionsData[0].save();
    }



    return cardMemoriesData
    } catch (err) {
      printC(err, "-1", "err", "r")
      throw new ApolloError(
        err.message,
        err.extensions?.code || "autoCreateCardsForPosition",
        { component: "cardMemoryMutation > autoCreateCardsForPosition" }
      );
    }


  },
  autoCalculatePrioritiesAndQuestions: async (parent, args, context, info) => {
    const { } = args.fields;
    console.log("Mutation > autoCalculatePrioritiesAndQuestions > args.fields = ", args.fields);


    let positionsData = []
    let cardMemoriesData = []


    try {
    // Find all the positions, 
    positionsData = await Position.find({prioritiesPositionCalculated: { $ne: true } }).select('_id prioritiesPositionCalculated');
    printC(positionsData.length, "3", "Number of Positions to go ", "p")

    if (positionsData.length == 0) return {}

    let positionData = positionsData[0]


    
    // check if priorities are calculated
      //     - [x] findPrioritiesTrainEdenAI
    
    // check if questions are calculated
      //     - [x] positionSuggestQuestionsAskCandidate
      //     - [x] addQuestionsToAskPositionInput



    positionData.prioritiesPositionCalculated = true;
    await positionData.save();



    return positionData
    } catch (err) {
      printC(err, "-1", "err", "r")
      throw new ApolloError(
        err.message,
        err.extensions?.code || "autoCalculatePrioritiesAndQuestions",
        { component: "cardMemoryMutation > autoCalculatePrioritiesAndQuestions" }
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

