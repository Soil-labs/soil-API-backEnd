
const { CardMemory } = require("../../../models/cardMemoryModel");


const { ApolloError } = require("apollo-server-express");

module.exports = {
  connectedCards: {
    card: async (parent, args, context, info) => {
      // console.log("parent = ", parent);
      try {
        
        let card = parent


        let cardsData = await CardMemory.findOne({ _id: card.cardID});

       
        return cardsData

      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_SEARCH_ERROR",
          {
            component: "memoryPinecone > position",
          }
        );
      }
    },
  },
};
