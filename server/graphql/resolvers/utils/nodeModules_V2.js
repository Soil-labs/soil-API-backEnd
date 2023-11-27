
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { printC } = require("../../../printModule");



const { request, gql} = require('graphql-request');

const { REACT_APP_API_URL, REACT_APP_API_CRON_URL } = process.env;


const {
  createNode_neo4j,
} = require("../../../neo4j/func_neo4j");


const {
    makeConnection_neo4j,
    findAllNodesDistanceRfromNode_neo4j,
  } = require("../../../neo4j/func_neo4j");


const createNodeFunc = async (data) => {

  const {name,node} = data;


  let fields = {
    name,
    node,
    registeredAt: new Date(),
  };

  // put it on Mongo
  let nodeData = await new Node(fields);
  nodeData.save();

  // put it on Neo4j
  await createNode_neo4j({
    node: nodeData.node,
    id: nodeData._id,
    name: nodeData.name,
  });

  return nodeData;
  
};

const memoriesToKnowledgeGraphFunc = async (data) => {

  const {userID,positionID} = data;

  let cardMemoriesData;

  //  ---------------- Find the cardMemories ----------------
  if (userID){
    cardMemoriesData = await CardMemory.find({ 
      "authorCard.userID": userID  
    });
  } else if (positionID){
    cardMemoriesData = await CardMemory.find({ 
      "authorCard.positionID": positionID  
    });
  } else {
    return {
      err: "userID or positionID is required"
    }
  }
  //  ---------------- Find the cardMemories ----------------


  printC(cardMemoriesData, "1", "cardMemoriesData", "b")



  

  
};


module.exports = {
    createNodeFunc,
    memoriesToKnowledgeGraphFunc,
  };