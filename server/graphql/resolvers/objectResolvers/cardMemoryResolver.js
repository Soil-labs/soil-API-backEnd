
const { CardMemory } = require("../../../models/cardMemoryModel");


const { ApolloError } = require("apollo-server-express");

module.exports = {
  connectedCards: {
    card: async (parent, args, context, info) => {
      // console.log("parent = ", parent);
      // console.log("context = ", context);
      // console.log("context = ", context.body.variables.fields);
      // console.log("parent = ", parent);
      try {
        
        let card = parent

        const {connectCardType,userID} = context.body.variables.fields

        console.log("connectCardType = ", connectCardType);


        let cardsData = await CardMemory.findOne({ _id: card.cardID});

        if (connectCardType == "filterUser" && userID) {

          if (cardsData?.authorCard?.userID?.toString() == userID.toString()) {
            return cardsData
          }

        } else {
            
            return cardsData
        }

       
        // return cardsData

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
