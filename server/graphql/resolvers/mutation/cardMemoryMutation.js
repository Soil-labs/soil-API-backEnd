const { ApolloError } = require("apollo-server-express");

const { printC } = require("../../../printModule");


const { CardMemory } = require("../../../models/cardMemoryModel");


module.exports = {
  addCardMemory: async (parent, args, context, info) => {
    const { _id,content, priority, tradeOffBoost,type,connectedCards,authorCard,score} = args.fields;
    console.log("Mutation > addCardMemory > args.fields = ", args.fields);


    try {

      if (_id) { // update

        let cardMemoryData = await CardMemory.findOne({ _id });

        if (!cardMemoryData) throw new ApolloError("CardMemory not found", { component: "cardMemoryMutation > addCardMemory" });

        if (content) cardMemoryData.content = content;
        if (priority) cardMemoryData.priority = priority;
        if (tradeOffBoost) cardMemoryData.tradeOffBoost = tradeOffBoost;
        if (type) cardMemoryData.type = type;
        if (connectedCards) cardMemoryData.connectedCards = connectedCards;
        if (authorCard) cardMemoryData.authorCard = authorCard;
        if (score) cardMemoryData.score = score;


        printC(cardMemoryData, "1", "cardMemoryData", "b")

        await cardMemoryData.save();


        return cardMemoryData


      } else { // create

        let cardMemoryData = new CardMemory({
          content,
          priority,
          tradeOffBoost,
          type,
          connectedCards,
          score
        });

        if (authorCard) cardMemoryData.authorCard = authorCard;

        await cardMemoryData.save();

        printC(cardMemoryData, "1", "cardMemoryData", "b")

        return cardMemoryData
      }


      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addCardMemory",
        { component: "cardMemoryMutation > addCardMemory" }
      );
    }
  },
  // deleteMemories: async (parent, args, context, info) => {
  //   const { _id , userID, positionID,label } = args.fields;
  //   console.log("Mutation > deleteMemories > args.fields = ", args.fields);

  //   try {


  //     let filter = {}

  //     if (_id) filter = { ...filter, _id }
  //     if (userID) filter = { ...filter, userID }
  //     if (positionID) filter = { ...filter, positionID }
  //     if (label) filter = { ...filter, label }
     
  //     res = await deleteMemoriesPineconeFunc(filter)

  //     printC(res, "1", "res", "b")


  //     // from the res.memoriesData create an array in order to return it

  //     let memoriesData = []
  //     res?.memoriesData?.forEach(memory => {
  //       memoriesData.push({
  //         _id: memory._id,
  //         pineconeID: memory.pineconeID,
  //         userID: memory.userID,
  //         positionID: memory.positionID,
  //         memory: memory.memory,
  //         label: memory.label,
  //         environment: memory.environment,
  //         convKey: memory.convKey,
  //       })
  //     });


      

  //     // return memoriesData;
  //     return res;
  //   } catch (err) {
  //     throw new ApolloError(
  //       err.message,
  //       err.extensions?.code || "deleteMemories",
  //       { component: "cardMemoryMutation > deleteMemories" }
  //     );
  //   }
  // },

};
