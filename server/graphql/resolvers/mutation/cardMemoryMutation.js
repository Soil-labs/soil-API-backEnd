const { ApolloError } = require("apollo-server-express");

const { printC } = require("../../../printModule");


const { Company } = require("../../../models/companyModel");
const { Position } = require("../../../models/positionModel");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { Conversation } = require("../../../models/conversationModel");
const { Members } = require("../../../models/membersModel");

const {
  findPrioritiesTrainEdenAIFunc,
  positionSuggestQuestionsAskCandidateFunc,
} = require("../utils/positionModules");

const {
  addMultipleQuestionsToEdenAIFunc,
} = require("../utils/questionsEdenAIModules");


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





      // sd9

      let deleteCardIDs = []
      deletePineconeIDs = []
      for (let i = 0; i < cardMemoriesData.length; i++) {
        const cardMemory = cardMemoriesData[i];


        // // ------ Delete the card from position ---------
        // if (cardMemory.authorCard.positionID) {
        //   // find the positionData
        //   let positionData = await Position.findOne({ _id: cardMemory.authorCard.positionID }).select('_id candidates');

        //   for (let j = 0; j < positionData.candidates.length; j++) {
        //     let candidate = positionData.candidates[j];

        //     // printC(candidate.scoreCardCategoryMemories, "1", "candidate.scoreCardCategoryMemories", "y")

        //     let scoreCardCategoryMemories = candidate.scoreCardCategoryMemories

        //     for (let k = 0; k < scoreCardCategoryMemories.length; k++) {
        //       let scoreCardCategoryMemory = scoreCardCategoryMemories[k];

        //       if (scoreCardCategoryMemory.scoreCardsPosition) {
        //         for (let l = 0; l < scoreCardCategoryMemory.scoreCardsPosition.length; l++) {
        //           let scoreCardsPosition = scoreCardCategoryMemory.scoreCardsPosition[l];

        //           // console.log("scoreCardsPosition = ", scoreCardsPosition)

        //           if (deleteCardIDs.includes(scoreCardsPosition.cardID)) {
        //             console.log("scoreCardsPosition = ", scoreCardsPosition)
        //             // scoreCardCategoryMemory.scoreCardsPosition.splice(l, 1);
        //           }
        //         }
        //       }

        //     }
        //   }
        // }
        // f1
        // // ------ Delete the card from position ---------

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

      
      deleteCardIDsString = []
      for(let i = 0; i < deleteCardIDs.length; i++) {
        deleteCardIDsString.push(deleteCardIDs[i].toString())
      }
      
      printC(deleteCardIDsString, "1", "deleteCardIDsString", "b")

      for (let i = 0; i < cardMemoriesData.length; i++) {
          const cardMemory = cardMemoriesData[i];


          // ------ Delete the card from position ---------
          if (cardMemory.authorCard.positionID) {
            // find the positionData
            let positionData = await Position.findOne({ _id: cardMemory.authorCard.positionID }).select('_id candidates');

            for (let j = 0; j < positionData.candidates.length; j++) {
              let candidate = positionData.candidates[j];

              // printC(candidate.scoreCardCategoryMemories, "1", "candidate.scoreCardCategoryMemories", "y")

              let scoreCardCategoryMemories = candidate.scoreCardCategoryMemories

              for (let k = 0; k < scoreCardCategoryMemories.length; k++) {
                let scoreCardCategoryMemory = scoreCardCategoryMemories[k];

                if (scoreCardCategoryMemory.scoreCardsPosition) {
                  for (let l = 0; l < scoreCardCategoryMemory.scoreCardsPosition.length; l++) {
                    let scoreCardsPosition = scoreCardCategoryMemory.scoreCardsPosition[l];

                    console.log("scoreCardsPosition.cardID = ", scoreCardsPosition.cardID)

                    if (deleteCardIDsString.includes(scoreCardsPosition.cardID.toString())) {
                      console.log("scoreCardsPosition = ", scoreCardsPosition)
                      // scoreCardCategoryMemory.scoreCardsPosition.splice(l, 1);

                      // delete from position this 
                      positionData.candidates[j].scoreCardCategoryMemories[k].scoreCardsPosition.splice(l, 1);
                    }
                  }
                }

              }
            }
            positionData.save(  )
          }
          // f1
        }
        // ------ Delete the card from position ---------

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
  editCardMemory: async (parent, args, context, info) => {
    // const { positionID,cardMemoryID,content,type,priority,tradeOffBoost, scoreCriteria,updateCandidatesPosition} = args.fields;
    const { positionID,batchCards,updateCandidatesPosition} = args.fields;
    console.log("Mutation > editCardMemory > args.fields = ", args.fields);
    
    if (!positionID) throw new ApolloError("You need to give some IDs", { component: "cardMemoryMutation > editCardMemory" });

    try {

      allCardMemoriesData = []

      for (let i = 0; i < batchCards.length; i++) {
        const { cardMemoryID,content,type,priority,tradeOffBoost, scoreCriteria} = batchCards[i];



  
        if (!content) continue;

        let cardMemoryData
        if (cardMemoryID){
          cardMemoryData = await CardMemory.findOne({ _id: cardMemoryID });
        

          printC(cardMemoryData, "1", "cardMemoryData", "b")

          // update the card content and scoreCriteria
          if(content) {
            cardMemoryData.content = content;
          }
          if(scoreCriteria) {
            cardMemoryData.scoreCriteria = scoreCriteria;
          }
        } else {
          cardMemoryData = await addCardMemoryFunc({
            content,
            scoreCriteria,
            type,
            priority: priority,
            tradeOffBoost: tradeOffBoost,
            authorCard: {
              positionID: positionID,
              category: "POSITION",
            }

          })
        }

        if (updateCandidatesPosition) {

          positionData = await Position.findOne({ _id: positionID }).select('_id companyID allCandidateScoreCardCalculated candidates');

          printC(positionData._id, "3", "positionData._id", "p")

          positionData.allCandidateScoreCardCalculated = false;


          for (let i = 0; i < positionData.candidates.length; i++) {

            
            if (positionData.candidates[i]) {
              positionData.candidates[i].candidateScoreCardCalculated = false;
              positionData.candidates[i].scoreCardCategoryMemories = []
            }


            if (positionData.candidates[i] && positionData.candidates[i].scoreCardTotal) {
              positionData.candidates[i].scoreCardTotal.score = 0;
              positionData.candidates[i].scoreCardTotal.scoreCardCalculated = false;
            }

            
          }
          
          cardMemoryData.connectedCards = []


          await positionData.save();
          
          
        }

        await cardMemoryData.save();




        // return cardMemoryData
        allCardMemoriesData.push(cardMemoryData)
      }
      return allCardMemoriesData
    } catch (err) {
      printC(err, "-1", "err", "r")
      throw new ApolloError(
        err.message,
        err.extensions?.code || "editCardMemory",
        { component: "cardMemoryMutation > editCardMemory" }
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
    
    positionsData = await Position.find({
      cardsPositionCalculated: { $ne: true }, 
      // prioritiesPositionCalculated: true ,
      "positionsRequirements.originalContent": { $exists: true, $ne: "" } 
    }).select('_id cardsPositionCalculated prioritiesPositionCalculated');
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

  autoCreateCardsCandidatesAndScore: async (parent, args, context, info) => {
    const { } = args.fields;
    console.log("Mutation > autoCreateCardsCandidatesAndScore > args.fields = ", args.fields);


    let positionsData = []
    let positionData
    let cardMemoriesData = []


    try {

      
    // carsPositionNotCalculatedYet = {}

    candidateScoreCardCalculatedExist = {
      $or: [
        { "candidates.candidateScoreCardCalculated": null},
        { "candidates.candidateScoreCardCalculated": false},
      ],
    }

      positionsData = await Position.find({
        $or: [
          { allCandidateScoreCardCalculated: { $ne: true } },
          candidateScoreCardCalculatedExist,
          // { "candidates.candidateScoreCardCalculated": null},
        ],
      }).select('_id companyID allCandidateScoreCardCalculated candidates');
      printC(positionsData.length, "3", "Number of Positions to go ", "p")
      printC(positionsData, "3", "Number of Positions to go ", "p")

      // f1

      // printC(positionsData[0], "3", "positionsData[0]", "p")

      // // SOS hack delete
      // for (let i = 0; i < positionsData.length; i++) {
      //   // printC(positionsData[i], "3", "positionsData[i] ", "p")
      //   if (positionsData[i].candidates) {
      //     for (let j = 0; j < positionsData[i].candidates.length; j++) {
      //       if (positionsData[i].candidates[j]) {
      //         positionsData[i].candidates[j].candidateScoreCardCalculated = true;
      //       }
      //     }
      //     await positionsData[i].save();
      //     break
      //   }
      // }


      // return null

      // // SOS hack delete



      // f1


      // let posIdx = -1
      // let companyData

      // for (let i = 0; i < positionsData.length; i++) {
      //   const companyID = positionsData[i].companyID;

      //   companyData = await Company.findOne({ _id: companyID }).select('_id slug');

      //   if (companyData == null || companyData.slug == null) {
      //     positionsData[i].allCandidateScoreCardCalculated = true;
      //     await positionsData[i].save();
      //     continue
      //   } else {
      //     posIdx = i
      //     break
      //   }

      // }

      // if (posIdx == -1) return null

      // printC(companyData, "3", "companyData", "p")
      // printC(posIdx, "3", "posIdx", "p")

      // // f2
        

      // positionData = await Position.findOne({ _id: positionsData[posIdx]._id }).select('_id companyID allCandidateScoreCardCalculated candidates');

      // printC(positionData._id, "3", "positionData._id", "p")
      // // f1

      // let userIDchanged = ""
      // // Initialize allCandidatesDone to true. This will be set to false if we find a candidate that hasn't been calculated yet.
      // allCandidatesDone = true
      // for (let i = 0; i < positionData.candidates.length; i++) {
      //   const candidate = positionData.candidates[i];


      //   // ---------------- Check if conversation is ready ----------------
      //   positionF = {
      //     $or: [{ positionID: positionData._id }, { extraPositionsID: positionData._id }],
      //   }
      //   convData = await Conversation.findOne({
      //     $and: [positionF, { userID: candidate.userID }],
      //   }).select("_id conversation");
  
      //   if (!convData) continue;

      //   let updatedAtConv = convData.updatedAt;
      //   let currentTime = new Date();
      //   let timeDifference = (currentTime - updatedAtConv) / (1000 * 60); // time difference in minutes

      //   if (timeDifference < 3) continue;

        
      //   // ---------------- Check if conversation is ready ----------------

      //   // Check if the candidate's scoreCardTotal or candidateScoreCardCalculated is not true
      //   if (candidate?.scoreCardTotal?.scoreCardCalculated != true || candidate.candidateScoreCardCalculated != true){
          
      //     // If not, set candidateScoreCardCalculated to true for this candidate
      //     positionData.candidates[i].candidateScoreCardCalculated = true;
          
      //     // If scoreCardTotal is already calculated, skip this candidate
      //     if (candidate?.scoreCardTotal?.scoreCardCalculated == true ){
      //       allCandidatesDone = false
      //       continue
      //     }

      //     // Create cards for this candidate
      //     resCards = await createCardsCandidateForPositionFunc(positionData._id,candidate.userID,positionData)

      //     // If there's an error, it means the position doesn't have cards, so we break the loop
      //     if (resCards.error!=null){
      //       break
      //     }

      //     // Wait for 3 seconds to avoid overloading the server
      //     await wait(3)

      //     // Calculate the score card for this candidate
      //     positionData = await calculateScoreCardCandidateToPositionFunc(candidate.userID,positionData._id,positionData)

      //     // Store the userID of the candidate whose score card was calculated
      //     userIDchanged = candidate.userID

      //     await wait(3)

      //     // Since we found a candidate that hasn't been calculated, set allCandidatesDone to false
      //     allCandidatesDone = false

      //     break;

      //   }

      // }


      if (positionsData.length == 0) return null

      let posIdx = -1
      let companyData
      let userIDchanged = ""
      // Initialize allCandidatesDone to true. This will be set to false if we find a candidate that hasn't been calculated yet.
      allCandidatesDone = true

      for (let i = 0; i < positionsData.length; i++) {
        const companyID = positionsData[i].companyID;

        companyData = await Company.findOne({ _id: companyID }).select('_id slug');

        
        if (companyData == null || companyData.slug == null) {
          positionsData[i].allCandidateScoreCardCalculated = true;
          await positionsData[i].save();
          continue
        } else {
          posIdx = i
          positionData = await Position.findOne({ _id: positionsData[posIdx]._id }).select('_id companyID allCandidateScoreCardCalculated candidates');

          

          for (let j = 0; j < positionData.candidates.length; j++) {
            const candidate = positionData.candidates[j];

            // ---------------- Check if conversation is ready ----------------
            positionF = {
              $or: [{ positionID: positionData._id }, { extraPositionsID: positionData._id }],
            }
            convData = await Conversation.findOne({
              $and: [positionF, { userID: candidate.userID }],
            }).select("_id conversation");

            // printC(convData, "3", "convData", "p")
            // f1
      
            if (!convData) {
              // check if he applied more than an hour ago 
              dateApply = candidate.dateApply
              let currentTime = new Date();
              let timeDifference = (currentTime - dateApply) / (1000 * 60 * 60); // time difference in hours

              if (timeDifference > 1) {
                // you can make the candidateScoreCardCalculated true
                positionData.candidates[j].candidateScoreCardCalculated = true;
                await positionData.save();
              };

              continue;
            };

            let updatedAtConv = convData.updatedAt;
            let currentTime = new Date();
            let timeDifference = (currentTime - updatedAtConv) / (1000 * 60); // time difference in minutes

            if (timeDifference < 3) continue;

            // ---------------- Check if conversation is ready ----------------

            // Check if the candidate's scoreCardTotal or candidateScoreCardCalculated is not true
            if (candidate?.scoreCardTotal?.scoreCardCalculated != true || candidate.candidateScoreCardCalculated != true){
              
              // If not, set candidateScoreCardCalculated to true for this candidate
              positionData.candidates[j].candidateScoreCardCalculated = true;
              
              // If scoreCardTotal is already calculated, skip this candidate
              if (candidate?.scoreCardTotal?.scoreCardCalculated == true ){
                allCandidatesDone = false
                continue
              }

              // Create cards for this candidate
              resCards = await createCardsCandidateForPositionFunc(positionData._id,candidate.userID,positionData)

              // If there's an error, it means the position doesn't have cards, so we break the loop
              if (resCards.error!=null){
                break
              }

              // Wait for 3 seconds to avoid overloading the server
              await wait(3)

              // Calculate the score card for this candidate
              positionData = await calculateScoreCardCandidateToPositionFunc(candidate.userID,positionData._id,positionData)

              // Store the userID of the candidate whose score card was calculated
              userIDchanged = candidate.userID

              await wait(3)

              // Since we found a candidate that hasn't been calculated, set allCandidatesDone to false
              allCandidatesDone = false

              break;

            }

          }
          if (allCandidatesDone == false) break;
        }

      }

      if (posIdx == -1) return null

      printC(companyData, "3", "companyData", "p")
      printC(posIdx, "3", "posIdx", "p")
      printC(positionData._id, "3", "positionData._id", "p")


      if (allCandidatesDone == true){
        positionData.allCandidateScoreCardCalculated = true;
      }
      await positionData.save();
      



      printC(positionData._id, "4", "positionData._id", "p")
      printC(userIDchanged, "5", "userIDchanged", "p")
      printC(positionsData.length, "3", "Number of Positions to go ", "p")

      return positionData
    
    } catch (err) {
      printC(err, "-1", "err", "r")
      throw new ApolloError(
        err.message,
        err.extensions?.code || "autoCreateCardsCandidatesAndScore",
        { component: "cardMemoryMutation > autoCreateCardsForPosition" }
      );
    }


  },
  autoCalculatePrioritiesAndQuestions: async (parent, args, context, info) => {
    const { positionID } = args.fields;
    console.log("Mutation > autoCalculatePrioritiesAndQuestions > args.fields = ", args.fields);


    let positionsData = []
    let cardMemoriesData = []


    try {
      
      let positionData

      if (!positionID){
        positionsData = await Position.find({
          prioritiesPositionCalculated: { $ne: true } ,
          "positionsRequirements.originalContent": { $exists: true, $ne: "" },
        })
          .select('_id prioritiesPositionCalculated positionsRequirements questionsToAsk');

        printC(positionsData.length, "3", "Number of Positions to go ", "p")
        // f1

        if (positionsData.length == 0) return {}
        positionData = positionsData[0]

      } else {

        positionData = await Position.findOne({ _id: positionID })
        .select('_id prioritiesPositionCalculated positionsRequirements questionsToAsk');
      }


      let resPriorities,resQuestions


      // --------------- if there is no jobDescription ---------------
      if (positionData?.positionsRequirements?.originalContent == null || positionData?.positionsRequirements?.originalContent == "") {
        positionData.prioritiesPositionCalculated = true;
        await positionData.save();
        return positionData
      }
      // --------------- if there is no jobDescription ---------------



      // --------------- Calculate the priorities ---------------
      if (!positionData.prioritiesPositionCalculated) {
        resPriorities = await findPrioritiesTrainEdenAIFunc({
          positionID: positionData._id,
        });

        if (resPriorities.priorities) {
          positionData.positionsRequirements.priorities = resPriorities.priorities;
        }

        if (resPriorities.tradeOffs) {
          positionData.positionsRequirements.tradeOffs = resPriorities.tradeOffs;
        }
      }
      // --------------- Calculate the priorities ---------------



      // printC(positionData, "3", "positionData", "p")

      // --------------- Calculate the questions ---------------
      if (positionData.questionsToAsk == null || positionData.questionsToAsk.length == 0) {
        resQuestions = await positionSuggestQuestionsAskCandidateFunc({
          positionID: positionData._id,
        })

        if (resQuestions.questionSuggest) {
          let questionsToAskTemp = resQuestions.questionSuggest

          let questionsToAskForSave = questionsToAskTemp.map((question) => {
            return {
              questionContent: question.question,
              questionID: question.IDCriteria,
              category: question.category,
            };
          });


          questionsToAskFinal = await addMultipleQuestionsToEdenAIFunc(questionsToAskForSave);


          positionData.questionsToAsk = questionsToAskFinal;
          
        }
      }
      // --------------- Calculate the questions ---------------




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

