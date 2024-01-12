
require("dotenv").config();
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { CardMemory } = require("../../../models/cardMemoryModel");
const { printC } = require("../../../printModule");



const {
  useGPTFunc,upsertEmbedingPineCone,findBestEmbedings
} = require("../utils/aiExtraModules");

const { request, gql} = require('graphql-request');

const { REACT_APP_API_URL, REACT_APP_API_CRON_URL } = process.env;


const {
  createNode_neo4j,
  connectNeighborNodesKG_neo4j,
} = require("../../../neo4j/func_neo4j");


const {
    makeConnection_neo4j,
    findAllNodesDistanceRfromNode_neo4j,
  } = require("../../../neo4j/func_neo4j");


const createNodeFunc = async (data) => {

  const {name,node} = data;

  // clean the name from spaces "." capital letters etc. and put "_" instead and tream them to be empty at the start and end 
  let cleanName = name.replace(/[^a-zA-Z0-9]/g, "_").trim();


  cleanName = cleanName.toLowerCase();



  let fields = {
    name,
    cleanName,
    node,
    registeredAt: new Date(),
  };

  // put it on Mongo
  let nodeData = await new Node(fields);
  // nodeData.save();

  // put it on Neo4j
  await createNode_neo4j({
    node: nodeData.node,
    id: nodeData._id,
    name: nodeData.name,
  });

  // ---------- Add to PineCone --------
  let filterUpsert = {
    text: name,
    database: process.env.REACT_APP_MONGO_DATABASE,
    label: "nodePrimitive2",
    mongoID: nodeData._id,
  }

  let resPineCone  = await upsertEmbedingPineCone(filterUpsert)
  // ---------- Add to PineCone --------

  nodeData.pineconeID = resPineCone.pineConeID;

  await nodeData.save();

  return nodeData;
  
};

const memoryToPrimitivesFun = async (data) => {

  let {memory} = data;



  // ---------------- Memory to Primitives using GPT ----------------
  let discussionT = [{
    role: "user",
    content: memory,
    // content: "I know react for like 10 years and a bit of figma the past month ",
  }];

  functionsUseGPT = ["memory_primitives"]


  const systemPrompt = `Your job is to take memories and split them up into the primitives together with score for this memory,

  - you need to focus on finding a job, job descriptions and CVs of people and anything related to matching people with jobs 

  - Always use memory_primitives function
  
  Example of primitives: 
  Javascript, leader, marketing, manager`

  let resGPTFunc = await useGPTFunc(discussionT,systemPrompt,functionsUseGPT)
  // resGPTFunc = {
  //   content: null,
  //   function_call: {functionName: "memory_primitives",
  //     primitive_1: "marketing",score_1: 8,primitive_2: "react",score_2: 7},
  //     // primitive_1: "react",score_1: 8,primitive_2: "marketing",score_2: 7},
  //     // primitive_1: "react",score_1: 8,},
  //     // primitive_1: "marketing",score_1: 8,},
  // }

  printC(resGPTFunc, "1", "resGPTFunc", "b")
  // ---------------- Memory to Primitives using GPT ----------------


  // ---------------- Organize primitives and scores ----------------
  let primitives = []
  let nodesData = []
  let nodesID = []
  if (resGPTFunc.function_call) {
    for (let [key, value] of Object.entries(resGPTFunc.function_call)) {
      if (!key.includes("primitive")) continue;

      if (value == "NA" || value == "") 
        continue;

      
      let keyNumber = key.split("_")[1]; // separate the number from the key

      const score = resGPTFunc.function_call[`score_${keyNumber}`]

      value = value.replace("'", "")


      let resCheckPrimitive = await checkNodeExistAddToKG({
        name: value,
        scoreConnection: score,
        createNewNodeIfNotExist: false,
      })

      if (resCheckPrimitive.nodeData) {
        primitives.push({
          name: value,
          score: score,
          nodeData: resCheckPrimitive.nodeData,
        })
        nodesData.push(resCheckPrimitive.nodeData)
        nodesID.push(resCheckPrimitive.nodeData._id)
      }
     

    }
  }
  // ---------------- Organize primitives and scores ----------------


  return {
    primitives,
    nodesData,
    nodesID,
  }

}

const memoryToKnowledgeGraphFunc = async (data) => {

  let {cardMemory,userID,positionID} = data;

  let nodeData

  printC(cardMemory, "1", "cardMemory", "b")

  if (!cardMemory || !cardMemory.content){
    return {
      err: "cardMemory.content is required"
    }
  }

  let cardMemoryContent = cardMemory.content;

  // ---------------- Memory to Primitives using GPT ----------------
  let discussionT = [{
    role: "user",
    content: cardMemoryContent,
    // content: "I know react for like 10 years and a bit of figma the past month ",
  }];

  functionsUseGPT = ["memory_primitives"]


  const systemPrompt = `Your job is to take memories and split them up into the primitives together with score for this memory,

  - you need to focus on finding a job, job descriptions and CVs of people and anything related to matching people with jobs 

  - Always use memory_primitives function
  
  Example of primitives: 
  Javascript, leader, marketing, manager`

  let resGPTFunc = await useGPTFunc(discussionT,systemPrompt,functionsUseGPT)
  // resGPTFunc = {
  //   content: null,
  //   function_call: {functionName: "memory_primitives",
  //     primitive_1: "HTML",score_1: 8,primitive_2: "prototype",score_2: 7,primitive_3: "production",score_3: 9,},
  // }

  printC(resGPTFunc, "1", "resGPTFunc", "b")
  // ---------------- Memory to Primitives using GPT ----------------

  // ---------------- Add Primitives/nodes to Knowledge Graph ----------------
  if (resGPTFunc.function_call) {
    for (let [key, value] of Object.entries(resGPTFunc.function_call)) {
      if (!key.includes("primitive")) continue;

      if (value == "NA" || value == "") 
        continue;

      
      let keyNumber = key.split("_")[1]; // separate the number from the key

      const score = resGPTFunc.function_call[`score_${keyNumber}`]

      value = value.replace("'", "")

      printC(key, "1", "key", "b");printC(value, "1", "value", "b");printC(score, "1", "score", "b");console.log('----');


      resAddPrimitive = await checkNodeExistAddToKG({
        name: value,
        scoreConnection: score,
        createNewNodeIfNotExist: true,
      })
      // printC(resAddPrimitive, "1", "resAddPrimitive", "b")

      if (resAddPrimitive.nodeData) {
        resConnectCardNode = await connectCardMemoryAndNode({
          nodeData: resAddPrimitive.nodeData,
          cardMemory: cardMemory,
          score: score,
        })

        nodeData = resConnectCardNode.nodeData;
        cardMemory = resConnectCardNode.cardMemory;
      }
      // printC(nodeData, "1", "nodeData", "b")


      if (resAddPrimitive.newNode == true) {
        resCreateNewKG = await createNewKGnodeConnections({
          nodeData: resAddPrimitive.nodeData,
        })

        let res = await connectNeighborNodesKGFunc({
          nodeID: resAddPrimitive.nodeData._id,
        })
      }

    }
  }
  // ---------------- Add Primitives/nodes to Knowledge Graph ----------------

};

const createNewKGnodeConnections = async (data) => {
  let {nodeData,cardMemory,score} = data;

  // ---------------- use GPT function ----------------
  let discussionT = [{
    role: "user",
    content: nodeData.name,
  }];
  functionsUseGPT = ["connectNeighborNodesKG"]


  const systemPrompt = `Your task is to identify the connected nodes in the knowledge graph and their scores based on the main node provided.

  - The main node is the primary focus, and the connected nodes are those directly linked to it in the knowledge graph.

  - The score represents the strength or relevance of the connection between the main node and the connected node.

  - Always use the connectNeighborNodesKG function to perform this task.

  - 0 is the lowest score and 10 is the highest score.

  Example of a main node: Javascript. Connected nodes could be: programming, web development, front-end, etc. Each with their respective scores.`

  let resGPTFunc = await useGPTFunc(discussionT,systemPrompt,functionsUseGPT)
  // resGPTFunc = {
  //   content: null,
  //   function_call: {functionName: "connectNeighborNodesKG",node_1: "AJAX",score_1: 8,node_2: "Animation effect",score_2: 7,}
  // }

  printC(resGPTFunc, "1", "resGPTFunc", "b")
  // ---------------- use GPT function ----------------

  
  //  ---------------- Connect all the nodes ------------
  if (resGPTFunc.function_call) {
    for (let [key, value] of Object.entries(resGPTFunc.function_call)) {
      if (!key.includes("node")) continue;

      if (value == "NA" || value == "") {
        continue;
      }

      let keyNumber = key.split("_")[1]; // separate the number from the key

      const score = resGPTFunc.function_call[`score_${keyNumber}`]

      value = value.replace("'", "")

      printC(key, "1", "key", "b")
      printC(value, "1", "value", "b")
      printC(score, "1", "score", "b")

      resAddPrimitive = await checkNodeExistAddToKG({
        name: value,
        scoreConnection: score,
        createNewNodeIfNotExist: true,
      })

      if (nodeData._id.toString() == resAddPrimitive.nodeData._id.toString()){
        continue;
      }

      printC(resAddPrimitive.nodeData.name, "1", "resAddPrimitive.nodeData.name", "p")
      printC(nodeData.name, "1", "nodeData.name", "p")

      if (resAddPrimitive.nodeData) {
        resConnectTwoNodesWithScoreKG = await connectTwoNodesWithScoreKG({
          nodeData: nodeData,
          nodeData2: resAddPrimitive.nodeData,
          score: score,
        })
      }



      if (resConnectTwoNodesWithScoreKG.nodeData) {
        nodeData = resConnectTwoNodesWithScoreKG.nodeData;
      }


    }
  }
  //  ---------------- Connect all the nodes ------------


}

const connectTwoNodesWithScoreKG = async (data) => {

  const {nodeData,nodeData2,score} = data;

  if (nodeData._id.toString() == nodeData2._id.toString()) 
    return {}


    //  ---------------- check nodeData exist connectedNodes ------------
  let flagNodeExist = false;
  for (let i = 0; i < nodeData.connectedNodes.length; i++) {
    const element = nodeData.connectedNodes[i];

    if (element.nodeID.toString() == nodeData2._id.toString()) {
      flagNodeExist = true;
      break;
    }
  }

  if (flagNodeExist == false) {
    nodeData.connectedNodes.push({
      nodeID: nodeData2._id,
      score: score,
    })
    await nodeData.save();
  } else {
    return {}
  }
  //  ---------------- check nodeData exist connectedNodes ------------


  //  ---------------- check nodeData2 exist connectedNodes ------------
  let flagNodeExist2 = false;
  for (let i = 0; i < nodeData2.connectedNodes.length; i++) {
    const element = nodeData2.connectedNodes[i];

    if (element.nodeID.toString() == nodeData._id.toString()) {
      flagNodeExist2 = true;
      break;
    }
  }

  if (flagNodeExist2 == false) {
    nodeData2.connectedNodes.push({
      nodeID: nodeData._id,
      score: score,
    })
    await nodeData2.save();
  } else {
    return {}
  }
  //  ---------------- check nodeData2 exist connectedNodes ------------


  //  ---------------- Connect two nodes ------------
  await makeConnection_neo4j({
    node: ["SKILL", "SKILL"],
    id: [nodeData._id, nodeData2._id],
    connection: "connection",
    weight: score,
  });
  //  ---------------- Connect two nodes ------------

  return {
    nodeData,
    nodeData2,
  }



}

const connectCardMemoryAndNode = async (data) => {

  const {nodeData,cardMemory,score} = data;


  printC(nodeData, "1", "nodeData", "b")
  printC(cardMemory, "2", "cardMemory", "b")
  printC(score, "3", "score", "b")


  // -------------- Add Node to cardMemory --------------
  // check if nodeID already exist in the cardMemory
  let flagNodeExist = false;
  for (let i = 0; i < cardMemory.primitives.length; i++) {
    const element = cardMemory.primitives[i];

    if (element.nodeID.toString() == nodeData._id.toString()) {
      flagNodeExist = true;
      break;
    }
  }

  if (flagNodeExist == false) {
    cardMemory.primitives.push({
      nodeID: nodeData._id,
      score: score,
    })
    await cardMemory.save();
  }
  // -------------- Add Node to cardMemory --------------


  // -------------- Add cardMemory to Node --------------
  // check if cardMemory already exist in the node
  let flagCardMemoryExist = false;
  for (let i = 0; i < nodeData.connectedCardMemories.length; i++) {
    const element = nodeData.connectedCardMemories[i];

    if (element.cardID.toString() == cardMemory._id.toString()) {
      flagCardMemoryExist = true;
      break;
    }
  }

  if (flagCardMemoryExist == false) {
    nodeData.connectedCardMemories.push({
      cardID: cardMemory._id,
      score: score,
    })
    await nodeData.save();
  }
  // -------------- Add cardMemory to Node --------------



  return {
    nodeData,
    cardMemory,
  }

}

const checkNodeExistAddToKG = async (data) => {

  const {name,scoreConnection,createNewNodeIfNotExist} = data;

  
  
  // ------------- Check on MongoDB -------------
  let cleanName = name.replace(/[^a-zA-Z0-9]/g, "_").trim().toLowerCase(); // clean the name and then check if it already exist 

  let nodeData = undefined;
  
  nodeData = await Node.findOne({ cleanName: cleanName });

  if (nodeData) {
    return {
      nodeData: nodeData,
      newNode: false,
    }
  }
  // ------------- Check on MongoDB -------------


  // ------------- Check on PineCone -------------
  const filter = {
    label: "nodePrimitive2",
  };

  bestKeywordsFromEmbed = await findBestEmbedings(
    name,
    filter,
    (topK = 4)
  );
  // printC(bestKeywordsFromEmbed, "1", "bestKeywordsFromEmbed", "b")

  let nodeID_fromPinecone = undefined;
  let keywordsListStr = ""
  for (let i = 0; i < bestKeywordsFromEmbed.length; i++) {
    const element = bestKeywordsFromEmbed[i];

    if (element.score > 0.92) {
      nodeID_fromPinecone = element.metadata.mongoID;
      break;
    } else {
      keywordsListStr += `ID ${i+1}: ${element.metadata.text}\n`
    }
  }

  if (nodeID_fromPinecone) {
    nodeData = await Node.findOne({ _id: nodeID_fromPinecone });

    if (nodeData) {
      return {
        nodeData: nodeData,
        newNode: false,
      }
    }
  }  else {
    keywordsListStr = keywordsListStr.slice(0, -1);
  }
  // ------------- Check on PineCone -------------



  // ------------- Check using GPT -------------
  functionsUseGPT = ["compareKeywords"]

  let systemPrompt = `Your task is to identify if this Keyword

  - Be really strict, it needs to be exactly the same meaning of keyword and not just similar
  
  Main Keyword: "${name}"

  is the same with any of the Compare Keywords`
  systemPrompt += `\n${keywordsListStr}`
  systemPrompt += `\nID NA: NA\n`


  let discussionT = [{role: "user",content: systemPrompt,}];


  printC(systemPrompt, "1", "systemPrompt", "b")

  // let resGPTFunc = await useGPTFunc(discussionT,systemPrompt,functionsUseGPT,{},0.7,"API 1",[],"gpt-4-0613")
  let resGPTFunc = await useGPTFunc(discussionT,systemPrompt,functionsUseGPT,{},0.7,"API 1",[],"gpt-4-1106-preview")

  printC(resGPTFunc, "1", "resGPTFunc", "b")

  if (resGPTFunc.function_call && resGPTFunc.function_call.keywordID && resGPTFunc.function_call.keywordID != "NA") {

    // turn to number
    let keywordID = parseInt(resGPTFunc.function_call.keywordID) - 1

    if (keywordID >= 0 && keywordID <= bestKeywordsFromEmbed.length) {
    
      nodePineconePass = bestKeywordsFromEmbed[keywordID]

      nodeID_fromPinecone = nodePineconePass.metadata.mongoID;

      nodeData = await Node.findOne({ _id: nodeID_fromPinecone });

      if (nodeData) {
        return {
          nodeData: nodeData,
          newNode: false,
        }
      }

    }
  
  }
  // ------------- Check using GPT -------------


  // ------------- Create Node / Primitive -------------
  if (createNewNodeIfNotExist == true){
    nodeData = await createNodeFunc({
      name,
      node:"SKILL",
    })
    
    return {
      nodeData: nodeData,
      newNode: true,
    }
  } else {
    return {
      err: "node not found"
    }
  }
  // ------------- Create Node / Primitive -------------
}

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

  for (let i = 0; i < cardMemoriesData.length; i++) {
    // for (let i = 1; i < 2; i++) {
    const cardMemory = cardMemoriesData[i];

    await memoryToKnowledgeGraphFunc({
      cardMemory,
      userID,
      positionID,
    })   
    
    // f1


  }
  

  
};


const connectNeighborNodesKGFunc = async (data) => {

  const {nodeID} = data;

  try {

    let nodeData = await Node.findOne({ _id: nodeID });

    if (!nodeData) {
      return {
        err: "nodeID not found"
      }
    }

    // --------- Find all the graphNeighbors and put then on dictionary ---------
    graphNeighborsDict = {}
    for (let i = 0; i < nodeData.graphNeighbors.length; i++) {
      const element = nodeData.graphNeighbors[i];

      const elementID = element.nodeID

      if (elementID == "65848cd593e35f75b8d65b21"){
        printC(element, "1", "element", "b")
      }
  
      graphNeighborsDict[elementID] = {
        hopN: element.hopN,
        weightTotal: element.weightTotal,
      }
    }
    // printC(graphNeighborsDict, "1", "graphNeighborsDict", "b")
    // f3
    // --------- Find all the graphNeighbors and put then on dictionary ---------


    resConnectedNodesKG = await connectNeighborNodesKG_neo4j({
      nodeID: nodeID,
      graphNeighborsDict,
    })

    nodesConnected = resConnectedNodesKG.nodesConnected
    nodesConnectedIDs = resConnectedNodesKG.nodesConnectedIDs
    nodesConnectedDict = resConnectedNodesKG.nodesConnectedDict

    // printC(nodesConnectedDict, "1", "nodesConnectedDict", "p")
    // f1

    resSaveNodeGraphNeighbors = await saveNodeGraphNeighbors({
      nodeData,
      nodesConnected,
      nodesConnectedIDs,
      nodesConnectedDict,
    })

    nodeData = resSaveNodeGraphNeighbors.nodeData;


    return {
      nodeData,
    }


  } catch (err) {
    printC(err, "-1", "err", "r")
    return {
      err: err
    }
    
  }
  
};

const saveNodeGraphNeighbors = async (data) => {

  const {nodeData,nodesConnected,nodesConnectedIDs,nodesConnectedDict} = data;


  nodesData = await Node.find({ _id: { $in: nodesConnectedIDs } });

  for (let i = 0; i < nodesData.length; i++) {
    const element = nodesData[i];

    const elementID = element._id

    // ------------- save the new graphNeighbors -> for main Node -------------
    if (nodesConnectedDict[elementID].replace == true){
      let index = nodeData.graphNeighbors.findIndex(neighbor => neighbor.nodeID.toString() == elementID.toString());
      if (index != -1) {
        nodeData.graphNeighbors.splice(index,1)
      }
    }
    nodeData.graphNeighbors.push({
      nodeID: elementID,
      hopN: nodesConnectedDict[elementID].hopN,
      weightTotal: nodesConnectedDict[elementID].weightTotal,
      score: nodesConnectedDict[elementID].score,
      weightSeparate: nodesConnectedDict[elementID].weightSeparate,
    })
    // ------------- save the new graphNeighbors -> for main Node -------------

    if (nodeData._id.toString() == element._id.toString())
      continue;


    // ------------- save the new graphNeighbors ->  Neighbor node will save the main node  -------------
    if (nodesConnectedDict[elementID].replace == true){
      let index = nodesData[i].graphNeighbors.findIndex(neighbor => neighbor.nodeID.toString() == nodeData._id.toString());
      if (index != -1) {
        nodesData[i].graphNeighbors.splice(index,1)
      }
    }
    nodesData[i].graphNeighbors.push({
      nodeID: nodeData._id,
      hopN: nodesConnectedDict[elementID].hopN,
      weightTotal: nodesConnectedDict[elementID].weightTotal,
      score: nodesConnectedDict[elementID].score,
      weightSeparate: nodesConnectedDict[elementID].weightSeparate,
    })
    // ------------- save the new graphNeighbors ->  Neighbor node will save the main node  -------------
    await nodesData[i].save();
  }

  // printC(nodeData, "1", "nodeData", "b")
  // f3

  await nodeData.save();

  return {
    nodeData,
    nodesData,
  }
}

const findNeighborNodesFunc = async (data) => {

  const {nodesData} = data;

  try {

    let neighborsDict = {}
    let neighborsNodeIDs = []

    for (let i = 0; i < nodesData.length; i++) {
      const element = nodesData[i];

      graphNeighbors = element.graphNeighbors

      for (let j = 0; j < graphNeighbors.length; j++) {
        const neighborNode = graphNeighbors[j];

        const neighborNodeID = neighborNode.nodeID






        if (neighborsDict[neighborNodeID]) {

          neighborsDict[neighborNodeID].push({
            score: neighborNode.score,
            weightTotal: neighborNode.weightTotal,
            hopN: neighborNode.hopN,
            nodeInputID: element._id,
          })

        } else {
          neighborsDict[neighborNodeID] = []

          neighborsDict[neighborNodeID].push({
            score: neighborNode.score,
            weightTotal: neighborNode.weightTotal,
            hopN: neighborNode.hopN,
            nodeInputID: element._id,
          })

          neighborsNodeIDs.push(neighborNodeID)
        }

      }
    }

    return {
      neighborsDict,
      neighborsNodeIDs,
    }


  } catch (err) {
    printC(err, "-1", "err", "r")
    return {
      err: err
    }
    
  }
  
};

const findCardMemoriesAndMembersFromNodes = async (data) => {

  const {neighborsDict,neighborsNodeIDs} = data;
  

  // ------------- Organize the cardMemories -------------
  neighborsNodeData = await Node.find({ _id: { $in: neighborsNodeIDs } }).select("-match_v2 -match_v2_update -subNodes -aboveNodes -categoryNodes -groupNodes -graphNeighbors -connectedNodes");

  cardMemoriesDict = {}
  cardMemoriesIDs = []

  for (let i = 0; i < neighborsNodeData.length; i++) {
    const element = neighborsNodeData[i];

    connectedCardMemories = element.connectedCardMemories

    for (let j = 0; j < connectedCardMemories.length; j++) {
      const cardMemory = connectedCardMemories[j];

      const cardMemoryID = cardMemory.cardID


      if (cardMemoriesDict[cardMemoryID]) {

        cardMemoriesDict[cardMemoryID].push({
          neighborNodeID: element._id,
          scoreCard: cardMemory.score,
          neighborNodeInfo: neighborsDict[element._id],
        })

      } else {
        cardMemoriesDict[cardMemoryID] = []

        cardMemoriesDict[cardMemoryID].push({
          neighborNodeID: element._id,
          scoreCard: cardMemory.score,
          neighborNodeInfo: neighborsDict[element._id],
        })

        cardMemoriesIDs.push(cardMemoryID)
      }
    }
  }
  // ------------- Organize the cardMemories -------------

  cardMemoriesData = await CardMemory.find({ _id: { $in: cardMemoriesIDs } }).select("authorCard score");


  // ------------- Organize the members -------------
  let membersDict = {}
  let membersIDs = []
  let key
  for (let i = 0; i < cardMemoriesData.length; i++) {
    const cardMemory = cardMemoriesData[i];

    const cardMemoryID = cardMemory._id

    const memberID = cardMemory.authorCard.userID

    
    const cardsData = cardMemoriesDict[cardMemoryID]

    for (let j=0; j < cardsData.length; j++) {
      const cardData = cardsData[j];
      const neighborNodeID = cardData.neighborNodeID

      const scoreCard = cardData.scoreCard
      const neighborNodeInfo = cardData.neighborNodeInfo

      for (let k=0; k < neighborNodeInfo.length; k++) {
       
        const scoreNeighbor = neighborNodeInfo[k].score
        const scoreHop = neighborNodeInfo[k].hopN
        const nodeInputID = neighborNodeInfo[k].nodeInputID



        // ------------- Organize the members Dictionary -------------
        if (membersDict[memberID]) {

          if (membersDict[memberID].nodeInput[nodeInputID]){

            key = `${neighborNodeID}_${cardMemoryID}`

            if (!membersDict[memberID].nodeInput[nodeInputID]) {
              membersDict[memberID].nodeInput[nodeInputID] = {};
            }
            if (!membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem) {
              membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem = {};
            }

            if (!membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem[key]) {
              membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem[key] = {
                neighborNodeID: neighborNodeID,
                cardMemoryID: cardMemoryID,
                scoreNeighbor: scoreNeighbor,
                scoreHop: scoreHop,
                scoreCard: scoreCard,
              }
            }

            // --------- membersCardDict ------
            if (!membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID]) {
              if (!membersDict[memberID].nodeInput[nodeInputID]) {
                membersDict[memberID].nodeInput[nodeInputID] = {};
              }
              if (!membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput) {
                membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput = {};
              }
              membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID] = {
                cardMemoryID: cardMemoryID,
                scoreCardTotal: scoreNeighbor*scoreCard*0.1,
                scoreCardTotalNum: 1,
                nodeOutput: []
              };
              let nodeOutputExists = membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].nodeOutput.some(
                output => output.nodeOutputID.toString() == neighborNodeID.toString()
              );
              if (!nodeOutputExists) {
                membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].nodeOutput.push({
                  nodeOutputID: neighborNodeID,
                  scoreNode: scoreNeighbor,
                  scoreHop: scoreHop,
                  scoreCard: scoreCard,
                  scoreTotal: scoreNeighbor*scoreCard*0.1,
                });
              }
            } else {
              membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].scoreCardTotal += scoreNeighbor*scoreCard*0.1
              membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].scoreCardTotalNum += 1
              
              let nodeOutputExists = membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].nodeOutput.some(
                output => output.nodeOutputID.toString() == neighborNodeID.toString()
              );
              if (!nodeOutputExists) {
                membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].nodeOutput.push({
                  nodeOutputID: neighborNodeID,
                  scoreNode: scoreNeighbor,
                  scoreHop: scoreHop,
                  scoreCard: scoreCard,
                  scoreTotal: scoreNeighbor*scoreCard*0.1,
                });
              }
            }
            // --------- membersCardDict ------
            
          } else {
            membersDict[memberID].nodeInput[nodeInputID] = {}

            membersDict[memberID].nodeInput[nodeInputID].importance = -1
            membersDict[memberID].nodeInput[nodeInputID].scoreNode = -1

            membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem = {}

            let key = `${neighborNodeID}_${cardMemoryID}`
            membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem[key] = {
              neighborNodeID: neighborNodeID,
              cardMemoryID: cardMemoryID,
              scoreNeighbor: scoreNeighbor,
              scoreHop: scoreHop,
              scoreCard: scoreCard,
            }

            // --------- membersCardDict ------
            membersDict[memberID].nodeInput[nodeInputID] = {}

            membersDict[memberID].nodeInput[nodeInputID].importance = -1
            membersDict[memberID].nodeInput[nodeInputID].scoreNode = -1

            membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput = {}

            membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID] = {
              cardMemoryID: cardMemoryID,
              scoreCardTotal: scoreNeighbor*scoreCard*0.1,
              scoreCardTotalNum: 1,
              nodeOutput: []
            }

            membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].nodeOutput.push({
              nodeOutputID: neighborNodeID,
              scoreNode: scoreNeighbor,
              scoreHop: scoreHop,
              scoreCard: scoreCard,
              scoreTotal: scoreNeighbor*scoreCard*0.1,
            })

            // --------- membersCardDict ------
          }

        } else {
          membersDict[memberID] = {}

          membersDict[memberID].scoreMember = -1

          membersDict[memberID].nodeInput = {}
          membersDict[memberID].nodeInput[nodeInputID] = {}

          membersDict[memberID].nodeInput[nodeInputID].importance = -1
          membersDict[memberID].nodeInput[nodeInputID].scoreNode = -1
          membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem = {}

          key = `${neighborNodeID}_${cardMemoryID}`
          membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem[key] = {
            neighborNodeID: neighborNodeID,
            cardMemoryID: cardMemoryID,
            scoreNeighbor: scoreNeighbor,
            scoreCard: scoreCard,
          }

          // --------- membersCardDict ------
          membersDict[memberID] = {}; 
          membersDict[memberID].scoreMember = -1

          membersDict[memberID].nodeInput = {}
          membersDict[memberID].nodeInput[nodeInputID] = {}

          membersDict[memberID].nodeInput[nodeInputID].importance = -1
          membersDict[memberID].nodeInput[nodeInputID].scoreNode = -1
          membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem = {}
          membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput = {}


          membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID] = {
            cardMemoryID: cardMemoryID,
            scoreCardTotal: scoreNeighbor*scoreCard*0.1,
            scoreCardTotalNum: 1,
            nodeOutput: []
          }

          membersDict[memberID].nodeInput[nodeInputID].cardMemoryOutput[cardMemoryID].nodeOutput.push({
            nodeOutputID: neighborNodeID,
            scoreNode: scoreNeighbor,
            scoreHop: scoreHop,
            scoreCard: scoreCard,
            scoreTotal: scoreNeighbor*scoreCard*0.1,
          })
          // --------- membersCardDict ------




        }
        // ------------- Organize the members Dictionary -------------

      }
    }
  }
  // ------------- Organize the members -------------

  // printC(membersDict, "1", "membersDict", "b")
  // printC(membersDict['106687126440283720518'].nodeInput, "1", "membersDict", "b")
  // f1

  // ------------- Organize based on nodeInputID -------------
  let nodeInputDict = {}
  for (let memberID in membersDict) {
    let nodesInput = membersDict[memberID].nodeInput

    for (let nodeInputID in nodesInput) {
        
        if (nodeInputDict[nodeInputID]) {

          if (nodeInputDict[nodeInputID].members[memberID]) {

            for (let key in nodesInput[nodeInputID].neighborNodeWithMem) {
              const element = nodesInput[nodeInputID].neighborNodeWithMem[key];

              let key = `${element.neighborNodeID}_${element.cardMemoryID}`

              if (nodeInputDict[nodeInputID].members[memberID].neighborNodeWithMem[key]) {
                continue;
              } else {
                nodeInputDict[nodeInputID].members[memberID].neighborNodeWithMem[key] = {
                  neighborNodeID: element.neighborNodeID,
                  cardMemoryID: element.cardMemoryID,
                  scoreNeighbor: element.scoreNeighbor,
                  scoreCard: element.scoreCard,
                }
              }
            }

          } else {  
            nodeInputDict[nodeInputID].members[memberID] = {}
            nodeInputDict[nodeInputID].members[memberID].scoreMemberNodeFinal = 0
            nodeInputDict[nodeInputID].members[memberID].scoreMemberNodeNormalize = 0

            nodeInputDict[nodeInputID].members[memberID].neighborNodeWithMem = membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem
          }

        } else {
          nodeInputDict[nodeInputID] = {}
          nodeInputDict[nodeInputID].importance = -1

          nodeInputDict[nodeInputID].members = {}


          nodeInputDict[nodeInputID].members[memberID] = {}
          nodeInputDict[nodeInputID].members[memberID].scoreMemberNodeFinal = 0
          nodeInputDict[nodeInputID].members[memberID].scoreMemberNodeNormalize = 0

          nodeInputDict[nodeInputID].members[memberID].neighborNodeWithMem = membersDict[memberID].nodeInput[nodeInputID].neighborNodeWithMem

        }
    }

  }
  // ------------- Organize based on nodeInputID -------------

  // printC(nodeInputDict, "1", "nodeInputDict", "b")
  // printC(nodeInputDict['658486d693e35f75b8d65248'], "1", "nodeInputDict", "b")
  // printC(nodeInputDict['658486d693e35f75b8d65248'].members['105249375398654070518'], "1", "nodeInputDict", "b")
  // f1

  return {
    membersDict,
    nodeInputDict,
  }
  

}

const rankBasedOnNodeInputFunc = async (data) => {

  const {nodeInputDict,membersDict,nodesID} = data;


  // ------ Variables for equation ------
  // scoreNeighborAndCard = scoreNeighbor * scoreCard * 0.1
  // p = sum( scoreNeighborAndCard * m )
  const m = 0.3 // How much Impact each of the primitive/CardMemory has -> the higher the number the more impact it has
  
  const a = 0.2 // how fast will go to the max score 1
  const b = 0.1 // What will be the minimum score 

  // S = a*p^2 + b // The score of the nodeInput


  const e = 2 // When Normalize it will take extra distance based on e (max*e) <= 1 (as long as it is smaller than 1)
  // ------ Variables for equation ------


  // ------------- Calculate the Scores -------------
  for (let nodeInputID in nodeInputDict) {
    // printC(nodeInputID, "1", "nodeInputID", "b")
    let members = nodeInputDict[nodeInputID].members

    let minScoreTemp = 1.1
    let maxScoreTemp = -0.1


    for (let memberID in members) {
      let neighborNodeWithMem = members[memberID].neighborNodeWithMem

      // printC(memberID, "1", "memberID", "b")

      let scoreMemberNodeTemp = 0


      for (let neighborNodeWithMemID in neighborNodeWithMem) {

        // printC(neighborNodeWithMem[neighborNodeWithMemID], "1", "neighborNodeWithMem[", "b")

        const scoreNeighborAndCard = neighborNodeWithMem[neighborNodeWithMemID].scoreNeighbor*neighborNodeWithMem[neighborNodeWithMemID].scoreCard*0.1

        scoreMemberNodeTemp += scoreNeighborAndCard*m
      }

      scoreMemberNodeTemp = a*Math.pow(scoreMemberNodeTemp,2) + b

      if (scoreMemberNodeTemp > 1) {
        members[memberID].scoreMemberNodeTemp = 1
        scoreMemberNodeTemp = 1
      } else {
        members[memberID].scoreMemberNodeTemp = scoreMemberNodeTemp
      }

      if (scoreMemberNodeTemp > maxScoreTemp)
        maxScoreTemp = scoreMemberNodeTemp

      if (scoreMemberNodeTemp < minScoreTemp)
        minScoreTemp = scoreMemberNodeTemp
      
    }
    nodeInputDict[nodeInputID].minScoreTemp = minScoreTemp
    nodeInputDict[nodeInputID].maxScoreTemp = maxScoreTemp

  }
  // ------------- Calculate the Scores -------------


  // ------------- Normalize the Scores -------------
  for (let nodeInputID in nodeInputDict) {
    let members = nodeInputDict[nodeInputID].members

    // ------------- Prepare min max -------------
    const minScoreTemp = nodeInputDict[nodeInputID].minScoreTemp
    let minScoreExtra = minScoreTemp*(1/e)
    if (minScoreExtra < 0 ) minScoreExtra = 0


    const maxScoreTemp = nodeInputDict[nodeInputID].maxScoreTemp
    let maxScoreExtra = maxScoreTemp*(e)
    if (maxScoreExtra > 1 ) maxScoreExtra = 1
    // ------------- Prepare min max -------------


    if (Object.keys(members).length == 1 ){
      for (let memberID in members) {
        members[memberID].scoreMemberNodeNormalize = maxScoreExtra
      }
      continue;
    }

    for (let memberID in members) {
      let scoreMemberNodeTemp = members[memberID].scoreMemberNodeTemp

      const scoreMemberNodeNormalize = (scoreMemberNodeTemp - minScoreExtra)/(maxScoreExtra - minScoreExtra)

      members[memberID].scoreMemberNodeNormalize = scoreMemberNodeNormalize
    }

  }
  // ------------- Normalize the Scores -------------


  //  ------------- Calculate the final score -------------
  // take every member on a loop this time

  let maxEuclScore = -0.1
  let minEuclScore = 1.1
  for (let memberID in membersDict) { // Find the score in each member separately 

    scoreEuclideanAllNodes = 0
    for (let i = 0; i<nodesID.length; i++) { // Take each nodeInput separately
      const nodeInputID = nodesID[i];

      let scoreNode = 0
      if (nodeInputDict[nodeInputID].members[memberID] && nodeInputDict[nodeInputID].members[memberID].scoreMemberNodeNormalize){
        scoreNode = nodeInputDict[nodeInputID].members[memberID].scoreMemberNodeNormalize
      }

      if (membersDict[memberID].nodeInput[nodeInputID] && membersDict[memberID].nodeInput[nodeInputID].scoreNode){
        membersDict[memberID].nodeInput[nodeInputID].scoreNode = scoreNode // save this score that we found before on the membersDict
      } else {
        membersDict[memberID].nodeInput[nodeInputID] = {}
        membersDict[memberID].nodeInput[nodeInputID].scoreNode = scoreNode
      }

      scoreEuclideanAllNodes += Math.pow(scoreNode,2)

    }

    scoreEuclideanAllNodes = Math.sqrt(scoreEuclideanAllNodes)

    membersDict[memberID].scoreMemberEucl = scoreEuclideanAllNodes

    if (scoreEuclideanAllNodes > maxEuclScore)
      maxEuclScore = scoreEuclideanAllNodes

    if (scoreEuclideanAllNodes < minEuclScore)
      minEuclScore = scoreEuclideanAllNodes
    
  }
  //  ------------- Calculate the final score -------------

  for (let memberID in membersDict) { // Normalize the score in each member separately
    
    const scoreMemberEucl = membersDict[memberID].scoreMemberEucl
    
    let scoreMemberEuclNormalize = 0
    if (Object.keys(membersDict).length == 1) {
      scoreMemberEuclNormalize = membersDict[memberID].scoreMemberEuclNormalize = scoreMemberEucl;
    } else {
      scoreMemberEuclNormalize = (scoreMemberEucl - minEuclScore)/(maxEuclScore - minEuclScore)
    }
    
    membersDict[memberID].scoreMember = scoreMemberEuclNormalize
  }


  printC(membersDict, "1", "membersDict", "b")

  
  return {
    membersDict,
    nodeInputDict,
  }


}


const orderedMembersFunc = async (data) => {

  const {membersDict,pageSize,pageNumber,neighborNodeMaxSize,scoreCardMaxSize} = data;
  

  // ------------- transform dictionary into ordered array for members and nodeInput ---------
  let membersArray = []
  let membersArrayCardMemArray = []
  for (let memberID in membersDict) {
    membersArray.push({
      ...membersDict[memberID],
      score: parseFloat(membersDict[memberID].scoreMember.toFixed(2)),
      memberID: memberID,
    });
    membersArrayCardMemArray.push({
      ...membersDict[memberID],
      score: parseFloat(membersDict[memberID].scoreMember.toFixed(2)),
      memberID: memberID,
    });
    let nodeInputArray = [];

    

    for (let nodeInputID in membersDict[memberID].nodeInput) {

      let nodeInputDictTemp = membersDict[memberID].nodeInput[nodeInputID];
      let neighborNodeWithMem = [];
      let cardMemoryOutput = [];


      for (let key in nodeInputDictTemp.neighborNodeWithMem) {
        if (neighborNodeWithMem.length < neighborNodeMaxSize){
          neighborNodeWithMem.push({
            ...nodeInputDictTemp.neighborNodeWithMem[key],
            scoreNode: parseFloat(nodeInputDictTemp.neighborNodeWithMem[key].scoreNeighbor.toFixed(2)),
            scoreCard: parseFloat((nodeInputDictTemp.neighborNodeWithMem[key].scoreCard*0.1).toFixed(2)),
            scoreTotal: parseFloat((nodeInputDictTemp.neighborNodeWithMem[key].scoreNeighbor*nodeInputDictTemp.neighborNodeWithMem[key].scoreCard*0.1).toFixed(2)),
          });
        }
      }

      for (let key in nodeInputDictTemp.cardMemoryOutput) {

        // if (cardMemoryOutput.length < neighborNodeMaxSize){

          let scoreCardTotal = nodeInputDictTemp.cardMemoryOutput[key].scoreCardTotal
          let scoreCardTotalNum = nodeInputDictTemp.cardMemoryOutput[key].scoreCardTotalNum
          
          
          scoreCardTotal = parseFloat((scoreCardTotal / scoreCardTotalNum).toFixed(2))
          
          
          let nodeOutputTemp = nodeInputDictTemp.cardMemoryOutput[key].nodeOutput

          let nodeOutputOrdered = nodeOutputTemp.sort((a, b) => b.scoreTotal - a.scoreTotal)


          // Slice the nodeOutput array to neighborNodeMaxSize length
          nodeOutputOrdered = nodeOutputOrdered.slice(0, neighborNodeMaxSize);

          cardMemoryOutput.push({
            scoreCardTotal: scoreCardTotal,
            cardMemoryID: key,
            nodeOutput: nodeOutputOrdered,
          });
        // }
      }

      // Sort cardMemoryOutput array based on scoreCardTotal
      cardMemoryOutput.sort((a, b) => b.scoreCardTotal - a.scoreCardTotal);
      // Cut cardMemoryOutput array to neighborNodeMaxSize length
      cardMemoryOutput = cardMemoryOutput.slice(0, scoreCardMaxSize);


      nodeInputArray.push({
        neighborNodeWithMem,
        score: parseFloat(membersDict[memberID].nodeInput[nodeInputID].scoreNode.toFixed(2)),
        nodeInputID: nodeInputID,
        cardMemoryOutput: cardMemoryOutput,
      });


    }
    nodeInputArray.sort((a, b) => b.score - a.score); // sort input from best to worst score

    membersArray[membersArray.length - 1].nodeInput = nodeInputArray;
  }
  membersArray.sort((a, b) => b.scoreMember - a.scoreMember); // sort members
  // ------------- transform dictionary into ordered array for members and nodeInput ---------


  // ------------- Pagination -------------
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;


  membersArray = membersArray.slice(startIndex, endIndex);
  // ------------- Pagination -------------



  return {
    membersArray,
  }


}



const rankMembersFunc = async (data) => {

  const {membersDict} = data;
  

  // -------------- Calculate the Scores --------------
  for (let member in membersDict) {
    let nodesInput = membersDict[member].nodeInput

    let scoreMember = 0
    let scoreMemberNum = 0
    
    for (let nodeInput in nodesInput) {
      let neighborNodesWithMem = nodesInput[nodeInput].neighborNodeWithMem

      let scoreNode = 0
      let scoreNodeNum = 0

      for (let neighborNodeWithMem in neighborNodesWithMem) {

        let scoreNeighbor = neighborNodesWithMem[neighborNodeWithMem].scoreNeighbor
        let scoreCard = neighborNodesWithMem[neighborNodeWithMem].scoreCard*0.1

        scoreNode += scoreNeighbor*scoreCard
        scoreNodeNum += 1
      }

      scoreNode = scoreNode/scoreNodeNum

      nodesInput[nodeInput].scoreNode = scoreNode

      scoreMember += scoreNode
      scoreMemberNum += 1
    }

    scoreMember = scoreMember/scoreMemberNum

    membersDict[member].scoreMember = scoreMember
  }
  // -------------- Calculate the Scores --------------





  // ------------- transform dictionary into ordered array for members and nodeInput ---------
  membersArray = []
  for (let memberID in membersDict) {
    membersArray.push({
      ...membersDict[memberID],
      score: parseFloat(membersDict[memberID].scoreMember.toFixed(2)),
      memberID: memberID,
    });
    let nodeInputArray = [];
    for (let nodeInputID in membersDict[memberID].nodeInput) {

      let nodeInputDictTemp = membersDict[memberID].nodeInput[nodeInputID];
      let neighborNodeWithMem = [];

      for (let key in nodeInputDictTemp.neighborNodeWithMem) {
        neighborNodeWithMem.push({
          ...nodeInputDictTemp.neighborNodeWithMem[key],
          scoreNode: parseFloat(nodeInputDictTemp.neighborNodeWithMem[key].scoreNeighbor.toFixed(2)),
          scoreCard: parseFloat((nodeInputDictTemp.neighborNodeWithMem[key].scoreCard*0.1).toFixed(2)),
          scoreTotal: parseFloat((nodeInputDictTemp.neighborNodeWithMem[key].scoreNeighbor*nodeInputDictTemp.neighborNodeWithMem[key].scoreCard*0.1).toFixed(2)),
        });
      }


      nodeInputArray.push({
        neighborNodeWithMem,
        score: parseFloat(membersDict[memberID].nodeInput[nodeInputID].scoreNode.toFixed(2)),
        nodeInputID: nodeInputID,
      });
    }
    nodeInputArray.sort((a, b) => b.scoreNode - a.scoreNode); // sort input from best to worst score

    membersArray[membersArray.length - 1].nodeInput = nodeInputArray;
  }
  membersArray.sort((a, b) => b.scoreMember - a.scoreMember); // sort members
  // ------------- transform dictionary into ordered array for members and nodeInput ---------



  // // ---------- Display the results ----------
  // printC(membersArray, "1", "membersArray", "b")
  // for (let i = 0; i < membersArray.length; i++) {
  //   const element = membersArray[i];
  //   printC(element, "1", `membersArray[${i}]`, "b")

  //   for (let j = 0; j < element.nodeInput.length; j++) {
  //     const element2 = element.nodeInput[j];
  //     printC(element2, "1", `membersArray[${i}].nodeInput[${j}]`, "b")
  //   }
  // }
  // // ---------- Display the results ----------



  return {
    membersArray,
  }


}

module.exports = {
    createNodeFunc,
    memoriesToKnowledgeGraphFunc,
    connectNeighborNodesKGFunc,
    findNeighborNodesFunc,
    findCardMemoriesAndMembersFromNodes,
    rankMembersFunc,
    rankBasedOnNodeInputFunc,
    orderedMembersFunc,
    memoryToPrimitivesFun,
  };