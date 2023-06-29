const { ApolloError } = require("apollo-server-express");

const { printC } = require("../../../printModule");


const {
  addMemoryPineconeFunc,
  findMemoryPineconeFunc,
  deleteMemoriesPineconeFunc,
} = require("../utils/memoryPineconeModules");

module.exports = {
  addMemory: async (parent, args, context, info) => {
    const { _id, pineconeID,userID,positionID,memory,label,environment,convKey } = args.fields;
    console.log("Mutation > addMemory > args.fields = ", args.fields);

    try {

      const filter = {
        _id, pineconeID,userID,positionID,memory,label,environment,convKey 
      }
     
      res = await addMemoryPineconeFunc(filter)

      printC(res, "1", "res", "b")

      

      return {
        _id: res.memoryData._id,
        pineconeID: res.memoryData.pineconeID,
        userID: res.memoryData.userID,
        positionID: res.memoryData.positionID,
        memory: res.memoryData.memory,
        label: res.memoryData.label,
        environment: res.memoryData.environment,
        convKey: res.memoryData.convKey,
        database: res.memoryData.database,
      };
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addMemory",
        { component: "memoryPineconeMutation > addMemory" }
      );
    }
  },
  deleteMemories: async (parent, args, context, info) => {
    const { _id , userID, positionID,label } = args.fields;
    console.log("Mutation > deleteMemories > args.fields = ", args.fields);

    try {


      let filter = {}

      if (_id) filter = { ...filter, _id }
      if (userID) filter = { ...filter, userID }
      if (positionID) filter = { ...filter, positionID }
      if (label) filter = { ...filter, label }
     
      res = await deleteMemoriesPineconeFunc(filter)

      printC(res, "1", "res", "b")


      // from the res.memoriesData create an array in order to return it

      let memoriesData = []
      res?.memoriesData?.forEach(memory => {
        memoriesData.push({
          _id: memory._id,
          pineconeID: memory.pineconeID,
          userID: memory.userID,
          positionID: memory.positionID,
          memory: memory.memory,
          label: memory.label,
          environment: memory.environment,
          convKey: memory.convKey,
        })
      });


      

      // return memoriesData;
      return res;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "deleteMemories",
        { component: "memoryPineconeMutation > deleteMemories" }
      );
    }
  },

};
