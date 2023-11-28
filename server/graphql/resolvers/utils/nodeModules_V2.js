
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { printC } = require("../../../printModule");

const {
  useGPTFunc,
} = require("../utils/aiExtraModules");

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


  // ---------------- use GPT function ----------------
  let discussionT = [{
    role: "user",
    content: "I know react for like 10 years and a bit of figma the past month ",
  }];

  functionsUseGPT = ["memory_primitives"]


  const systemPrompt = `Your job is to take memories and split them up into the primitives together with score for this memory,

  - you need to focus on finding a job, job descriptions and CVs of people and anything related to matching people with jobs 
  
  Example of primitives: 
  Javascript, leader, marketing, manager`

  let resGPTFunc = await useGPTFunc(discussionT,systemPrompt,functionsUseGPT)

  printC(resGPTFunc, "1", "resGPTFunc", "b")
  // ---------------- use GPT function ----------------

  

  
};


module.exports = {
    createNodeFunc,
    memoriesToKnowledgeGraphFunc,
  };