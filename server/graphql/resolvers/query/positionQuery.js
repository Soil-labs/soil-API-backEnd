const { Conversation } = require("../../../models/conversationModel");
const { Position } = require("../../../models/positionModel");


const { ApolloError } = require("apollo-server-express");


module.exports = {
  findPosition: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findPosition > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("ID is required")


    try {

      // const collection = Position.collection;


      // // Rename the collection
      // collection.rename('positions', { dropTarget: true }, (err, result) => {
      //   if (err) {
      //     console.error(err);
      //   } else {
      //     console.log(result);
      //   }
      // });

      // find conversaiotn 
      console.log("change = ")
      let positionData = await Position.findOne({ _id: _id });
      console.log("change = 1",positionData)

      
      if (!positionData) throw new ApolloError("Position not found")

      console.log("positionData = " , positionData)
      // sdf9

      return positionData;
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPosition",
        { component: "positionQuery > findPosition" }
      );
    }
  },
  deletePositionCandidate: async (parent, args, context, info) => {
    const { positionID,userID } = args.fields;
    console.log("Query > deletePositionCandidate > args.fields = ", args.fields);

    if (!positionID) throw new ApolloError("positionID is required")

    if (!userID) throw new ApolloError("userID is required")


    try {
      let positionData = await Position.findOne({ _id: positionID }).select('_id candidates');
      
      if (!positionData) throw new ApolloError("Position not found")

      console.log("positionData = " , positionData)

      // find the positionData.candidates userID and return it

      // const candidate = positionData.candidates.find(candidate => candidate.userID.toString() == userID.toString());
      const index = positionData.candidates.findIndex(candidate => candidate.userID.toString() == userID.toString());


      positionData.candidates[index].interviewQuestionsForCandidate = []

      positionData = await positionData.save()

      // console.log("candidate = " , candidate)

      


      return  positionData.candidates[index];
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "deletePositionCandidate",
        { component: "positionQuery > deletePositionCandidate" }
      );
    }
  },
  findPositions: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findPositions > args.fields = ", args.fields);

    console.log("eloi is cool = " )
    let searchQuery_and = [];
    let searchQuery = {};


    if (_id) {
      searchQuery_and.push({ _id: _id });
    }

    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }
    try {

      let positionData = await Position.find(searchQuery);

      return positionData;
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findPositions",
        { component: "positionQuery > findPositions" }
      );
    }
  },
  
};
