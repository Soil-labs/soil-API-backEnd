const { Conversation } = require("../../../models/conversationModel");
const { Company } = require("../../../models/companyModel");
const { MemoryPinecone } = require("../../../models/memoryPineconeModel");


const { ApolloError } = require("apollo-server-express");


const {
  findMemoryPineconeFunc,
} = require("../utils/memoryPineconeModules");


module.exports = {
  findMemories: async (parent, args, context, info) => {
    const { _id , userID, positionID,label} = args.fields;
    console.log("Query > findMemories > args.fields = ", args.fields);

    
    try {

      let filter = {}

      if (_id) filter = { ...filter, _id }
      if (userID) filter = { ...filter, userID }
      if (positionID) filter = { ...filter, positionID }
      if (label) filter = { ...filter, label }

      const memoryData =  await findMemoryPineconeFunc( filter)


      return memoryData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findMemories",
        { component: "memoryPineconeQuery > findMemories" }
      );
    }
  },
};
