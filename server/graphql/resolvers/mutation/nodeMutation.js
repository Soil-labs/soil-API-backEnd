const { Node } = require("../../../models/nodeModal");
const { Position } = require("../../../models/positionModel");

const { ServerTemplate } = require("../../../models/serverModel");
const { ApolloError } = require("apollo-server-express");
const {
  createNode_neo4j,
  createNode_neo4j_field,
  updateNode_neo4j_serverID_f,
  makeConnection_neo4j,
  deleteNode_neo4j,
} = require("../../../neo4j/func_neo4j");
const { combineResolvers } = require("graphql-resolvers");
const {
  IsAuthenticated,
  IsOnlyOperator,
} = require("../../../utils/authorization");

const {deletePineCone} = require("../utils/aiExtraModules");
const { CardMemory } = require("../../../models/cardMemoryModel");



const { printC } = require("../../../printModule");

const { createNodeFunc,memoriesToKnowledgeGraphFunc,connectNeighborNodesKGFunc,
  findNeighborNodesFunc,findCardMemoriesAndMembersFromNodes,createMembersCategoryDict,
  rankMembersFunc,orderedMembersFunc,memoryToPrimitivesFun,createMembersCategoryArrayFun,
  rankBasedOnNodeInputFunc,createCategoryDict } = require("../utils/nodeModules_V2");

async function findOrCreateNode(node,nodeID,nodeName,serverID) {
  let nodeData;

  if (nodeID){
    nodeData = await Node.findOne({ _id: nodeID }).select("_id name node  groupNodes aboveNodes categoryNodes subNodes");


  } else if (nodeName){
    nodeData = await Node.findOne({ name: nodeName }).select("_id name node  groupNodes aboveNodes categoryNodes subNodes");

  }

  if (!nodeData){
    if (nodeName){
      let fields = {
        name: nodeName,
        node,
        state: "approved",
        registeredAt: new Date(),
        matchByServer_update: true,
      };

      nodeData = await new Node(fields);

      nodeData.save();

      await createNode_neo4j_field({
        fields: {
          node: nodeData.node,
          _id: nodeData._id,
          serverID_code: "828",
          name: nodeData.name,
          serverID: serverID,
        },
      });

    }
  }


  return nodeData

}

async function updateNode(nodeData) {

  nodeData = await Node.findOneAndUpdate(
    { _id: nodeData._id },
    {
      $set: {
        subNodes: nodeData.subNodes,
        aboveNodes: nodeData.aboveNodes,
        groupNodes: nodeData.groupNodes,
        categoryNodes: nodeData.categoryNodes,
      },
    },
    { new: true }
  );

  return nodeData


}


module.exports = {
  createNode: 
  // combineResolvers(
  //   IsAuthenticated,
  //   IsOnlyOperator,
    async (parent, args, context, info) => {
      const { node, name, subNodes, aboveNodes, state } = args.fields;
      console.log("Mutation > createNode > args.fields = ", args.fields);

      if (!name)
        throw new ApolloError("You need to specify the name of the node");
      // if (!node) throw new ApolloError( "You need to specify the type of the node");

      let fields = {
        name,
        registeredAt: new Date(),
      };

      if (subNodes) fields.subNodes = subNodes;
      if (aboveNodes) fields.aboveNodes = aboveNodes;
      if (node) fields.node = node;

      if (state) {
        fields = {
          ...fields,
          state,
        };
      } else {
        fields = {
          ...fields,
          state: "approved",
        };
      }

      fields = {
        ...fields,
        matchByServer_update: true,
      };

      console.log("fields = ", fields);

      try {
        let nodeData;

        nodeData = await Node.findOne({ name: fields.name });

        if (!nodeData) {
          nodeData = await new Node(fields);

          nodeData.save();

          // ----------------- Save the Server on the Skills -----------------
          let serverData = await ServerTemplate.find({});

          let serverID = [];
          serverData.map((server) => {
            serverID.push(server._id);
          });
          // ----------------- Save the Server on the Skills -----------------

          await createNode_neo4j_field({
            fields: {
              node: nodeData.node,
              _id: nodeData._id,
              serverID_code: "828",
              name: nodeData.name,
              serverID: serverID,
            },
          });
        } else {
          // if nodeData.subNodes don't include the new subNodes then add them
          if (!nodeData.subNodes.includes(fields.subNodes)) {
            nodeData.subNodes.push(fields.subNodes);
          }

          if (subNodes) {
            await Node.findOneAndUpdate(
              { _id: nodeData._id },
              {
                $set: {
                  subNodes: nodeData.subNodes,
                },
              },
              { new: true }
            );
          }

          if (!nodeData.aboveNodes.includes(fields.aboveNodes)) {
            nodeData.aboveNodes.push(fields.aboveNodes);
          }

          if (aboveNodes) {
            await Node.findOneAndUpdate(
              { _id: nodeData._id },
              {
                $set: {
                  aboveNodes: nodeData.aboveNodes,
                },
              },
              { new: true }
            );
          }
        }

        connect_node_to_subNode(nodeData, subNodes, 1);

        connect_node_to_aboveNode(nodeData, aboveNodes, 1);

        console.log("DONE ......" )
        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }
    },
  // ),

  createNodeCategoryGroup: 
  // combineResolvers(
  //   IsAuthenticated,
  //   IsOnlyOperator,
    async (parent, args, context, info) => {
      const { name,node,categoryName,categoryTypeName,categoryID,groupName,groupTypeName,groupID } = args.fields;
      console.log("Mutation > createNodeCategoryGroup > args.fields = ", args.fields);

      if (!name)
        throw new ApolloError("You need to specify the name of the node");
      if (!node) throw new ApolloError( "You need to specify the type of the node");

      
      
      try {
        
        if (!categoryTypeName) categoryTypeName = "Category"

        if (!groupTypeName) groupTypeName = "Group"
        

        // ----------------- Save the Server on the Skills -----------------
        let serverData = await ServerTemplate.find({});

        let serverID = [];
        serverData.map((server) => {
          serverID.push(server._id);
        });
        // ----------------- Save the Server on the Skills -----------------

        // ----------- Find the Group Node -----------
        let groupNodeData = await findOrCreateNode(groupTypeName,groupID,groupName)
        // ----------- Find the Group Node -----------

        // ----------- Find the Category Node -----------
        let categoryNodeData = await findOrCreateNode(categoryTypeName,categoryID,categoryName)
        
        // ----------- Find the Category Node -----------
 
        // ----------- Find the Node -----------
        let nodeData = await findOrCreateNode(node,"",name)
        // ----------- Find the Node -----------



        // ------------- Category - Group -------------
        console.log("change = 1",categoryNodeData )
        console.log("change = 1",categoryNodeData.aboveNodes )
        if (!categoryNodeData.aboveNodes.includes(groupNodeData._id)) {
          categoryNodeData.aboveNodes.push(groupNodeData._id);
        }
        console.log("change = 3" )

        if (!groupNodeData.subNodes.includes(categoryNodeData._id)) {
          groupNodeData.subNodes.push(categoryNodeData._id);
        }
        console.log("change = 2" )
        if (!categoryNodeData.groupNodes.includes(groupNodeData._id)) {
          categoryNodeData.groupNodes.push(groupNodeData._id);
        }
        // ------------- Category - Group -------------

        console.log("change = 1" )

        // ------------- Node - Category -------------
        if (!nodeData.aboveNodes.includes(categoryNodeData._id)) {
          nodeData.aboveNodes.push(categoryNodeData._id);
        }
        if (!categoryNodeData.subNodes.includes(nodeData._id)) {
          categoryNodeData.subNodes.push(nodeData._id);
        }
        console.log("change = 1" )

        if (!nodeData.categoryNodes.includes(categoryNodeData._id)) {
          nodeData.categoryNodes.push(categoryNodeData._id);
        }
        // ------------- Node - Category -------------
        console.log("change = 1" )

        // ------------- Node - Group -------------
        if (!nodeData.groupNodes.includes(groupNodeData._id)) {
          nodeData.groupNodes.push(groupNodeData._id);
        }
        // ------------- Node - Group -------------



        // --------- Update Nodes ----------
        nodeData = await updateNode(nodeData)

        categoryNodeData = await updateNode(categoryNodeData)

        groupNodeData = await updateNode(groupNodeData)
        // --------- Update Nodes ----------



        console.log("DONE ......" )
        return nodeData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "createNodeCategoryGroup",
          { component: "tmemberQuery > createNodeCategoryGroup" }
        );
      }
    },
  // ),

  relatedNode: 
  // combineResolvers(
  //   IsAuthenticated,
  //   IsOnlyOperator,
    async (parent, args, context, info) => {
      const { _id, relatedNode_id } = args.fields;
      console.log("Mutation > relatedNode > args.fields = ", args.fields);

      if (!_id)
        throw new ApolloError("You need to specify the _id of the node");
      if (!relatedNode_id)
        throw new ApolloError(
          "You need to specify the relatedNode_id of the node"
        );

      let nodeData = await Node.findOne({ _id });

      let relatedNodeData = await Node.findOne({ _id: relatedNode_id });

      try {
        await makeConnection_neo4j({
          node: [nodeData.node, relatedNodeData.node],
          id: [nodeData._id, relatedNodeData._id],
          connection: "related",
        });

        if (!nodeData.relatedNodes.includes(relatedNode_id)) {
          nodeData.relatedNodes.push(relatedNode_id);
        }

        await Node.findOneAndUpdate(
          { _id: nodeData._id },
          {
            $set: {
              relatedNodes: nodeData.relatedNodes,
            },
          },
          { new: true }
        );

        if (!relatedNodeData.relatedNodes.includes(_id)) {
          relatedNodeData.relatedNodes.push(_id);
        }

        await Node.findOneAndUpdate(
          { _id: relatedNodeData._id },
          {
            $set: {
              relatedNodes: relatedNodeData.relatedNodes,
            },
          },
          { new: true }
        );
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }

      return nodeData;
    },
  // ),
  deleteNodes: async (parent, args, context, info) => {
    let { _id  } = args.fields;
    console.log("Mutation > relatedNode > args.fields = ", args.fields);


    try {

      if (_id == undefined || _id.length == 0) {
        nodesData = await Node.find({})

        _id = nodesData.map(node => node._id);
      }

      let nodesDataDeleted = []

      for (let i = 0; i < _id.length; i++) {
        let nodeIDNow = _id[i];

        // then delete from Mongo
        let nodeData = await Node.findOneAndDelete({ _id: nodeIDNow });

        if (!nodeData) continue;

        // delete first from neo4j
        deleteNode_neo4j({
          nodeID: nodeIDNow,
        });

        if (nodeData.pineconeID){
          deletePineCone(nodeData.pineconeID)
        }

        

        nodesDataDeleted.push(nodeData)

      }

      return nodesDataDeleted;
      

    } catch (err) {
      printC(err, "-1", "err", "r");
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember" }
      );
    }


    return nodeData;
  },
  relatedNode_name: 
  // combineResolvers(
  //   IsAuthenticated,
  //   IsOnlyOperator,
    async (parent, args, context, info) => {
      const { name, relatedNode_name, weight, connection } = args.fields;
      console.log("Mutation > relatedNode_name > args.fields = ", args.fields);

      if (!name)
        throw new ApolloError("You need to specify the name of the node");
      if (!relatedNode_name)
        throw new ApolloError(
          "You need to specify the relatedNode_name of the node"
        );

      let nodeData = await Node.findOne({ name }).select(
        "name _id node relatedNodes"
      );

      let relatedNodeData = await Node.findOne({ name: relatedNode_name }).select(
        "name _id node relatedNodes"
      );

      let connection_n = connection.replace(" ", "_");

      console.log("res nodeData = ", nodeData);
      console.log("res relatedNodeData = ", relatedNodeData);
      console.log("connection_n = ", connection_n);
      try {
        if (weight) {
          await makeConnection_neo4j({
            node: [nodeData.node, relatedNodeData.node],
            id: [nodeData._id, relatedNodeData._id],
            connection: connection_n,
            weight: weight,
          });
        } else {
          await makeConnection_neo4j({
            node: [nodeData.node, relatedNodeData.node],
            id: [nodeData._id, relatedNodeData._id],
            connection: connection_n,
          });
        }
        console.log("phase 1= ", nodeData.relatedNodes, relatedNodeData._id);
        console.log(
          "phase 1= ",
          nodeData.relatedNodes,
          relatedNodeData._id,
          nodeData.relatedNodes.includes(relatedNodeData._id)
        );

        if (!nodeData.relatedNodes.includes(relatedNodeData._id)) {
          nodeData.relatedNodes.push(relatedNodeData._id);
        }
        console.log("phase 2= ");

        await Node.findOneAndUpdate(
          { _id: nodeData._id },
          {
            $set: {
              relatedNodes: nodeData.relatedNodes,
            },
          },
          { new: true }
        );

        if (!relatedNodeData.relatedNodes.includes(nodeData._id)) {
          relatedNodeData.relatedNodes.push(nodeData._id);
        }

        await Node.findOneAndUpdate(
          { _id: relatedNodeData._id },
          {
            $set: {
              relatedNodes: relatedNodeData.relatedNodes,
            },
          },
          { new: true }
        );
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember" }
        );
      }

      return nodeData;
    },
    createNode_V2: async (parent, args, context, info) => {
      const { name, node } = args.fields;
      console.log("Mutation > createNode_V2 > args.fields = ", args.fields);

      if (!name) throw new ApolloError("You need to specify the name of the node");


      try {

        nodeData = await createNodeFunc({
          name,
          node,
        })
  
  
        return nodeData;
      } catch (err) {
        printC(err, "-1", "err", "r");
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "nodeMutation > createNode_V2" }
        );
      }
    },
    connectMemoriesToKnowledgeGraph_V2: async (parent, args, context, info) => {
      let { userID, positionID } = args.fields;
      const { runAuto } = args.fields;
      let {createKGconnections} = args.fields;
      console.log("Mutation > connectMemoriesToKnowledgeGraph_V2 > args.fields = ", args.fields);


      let noPrimitivesCardsData = []

      if (!userID && !positionID && runAuto != undefined){ // find your own userID or positionID based on runAuto

        let category
        if (runAuto == "MEMBER"){
          category = "CANDIDATE"
        } else if (runAuto == "POSITION"){
          category = "POSITION"
        }

        noPrimitivesCardsData = await CardMemory.find({ 
          $or: [{"primitives": { $exists: false }}, {"primitives": { $size: 0 }}],
          "authorCard.category": category,
        }).select("_id authorCard")


        printC(noPrimitivesCardsData.length,"1", "noPrimitivesCardsData.length", "p")


        if (noPrimitivesCardsData.length > 0) {
          const firstCard = noPrimitivesCardsData[0];
          if (runAuto == "MEMBER") {
            userID = firstCard.authorCard.userID;
          } else if (runAuto == "POSITION") {
            positionID = firstCard.authorCard.positionID;
          }
        } else {
          return {}
        }
        

      }


      printC(userID,"1", "----------------", "p")
      printC(userID,"1", "userID", "p")
      printC(userID,"1", "------------", "p")
      printC(noPrimitivesCardsData.length,"1", "noPrimitivesCardsData.length", "p")
      

      // f1
      try {

        nodeData = await memoriesToKnowledgeGraphFunc({
          userID,
          positionID,
          createKGconnections,
        })
  
  
        return {
          usersLeft: noPrimitivesCardsData.length,
          userConnectedToKGID: userID,
          positionConnectedToKGID: positionID,
          node: nodeData
        };
      } catch (err) {
        printC(err, "-1", "err", "r");
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "nodeMutation > connectMemoriesToKnowledgeGraph_V2" }
        );
      }
    },
    connectNeighborNodesKG: async (parent, args, context, info) => {
      const { nodesID } = args.fields;
      console.log("Mutation > connectNeighborNodesKG > args.fields = ", args.fields);

      if (!nodesID) throw new ApolloError("You need to specify the nodesID of the node");



      try {

        let nodesData = []
        for (let i = 0; i < nodesID.length; i++) {
            let nodeID = nodesID[i];

            let res = await connectNeighborNodesKGFunc({
              nodeID,
            })

            if (res.nodeData){
              nodesData.push(res.nodeData)
            }

        }
  
  
        return nodesData;
      } catch (err) {
        printC(err, "-1", "err", "r");
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "nodeMutation > connectNeighborNodesKG" }
        );
      }
    },
    showMembersConnectedToNodes: async (parent, args, context, info) => {
      const { nodesID } = args.fields;
      let {pageSize, pageNumber,neighborNodeMaxSize} = args.fields;
      console.log("Mutation > showMembersConnectedToNodes > args.fields = ", args.fields);

      if (!pageSize) pageSize = 10
      if (!pageNumber) pageNumber = 1

      if (pageNumber == 0) throw new ApolloError("pageNumber can't be 0, starts form 1 ");

      if (!nodesID) throw new ApolloError("You need to specify the nodesID of the node");


      try {

        let nodesData = await Node.find({ _id: nodesID }).select("-match_v2 -match_v2_update -subNodes -aboveNodes -categoryNodes -groupNodes");




        let resFindNeighborNodesFunc = await findNeighborNodesFunc({
          nodesData,
        })
        let neighborsDict = resFindNeighborNodesFunc.neighborsDict
        let neighborsNodeIDs = resFindNeighborNodesFunc.neighborsNodeIDs
        

        let resFindCardMemoriesAndMembersFromNodes = await findCardMemoriesAndMembersFromNodes({
          neighborsDict,
          neighborsNodeIDs,
        })
        let membersDict = resFindCardMemoriesAndMembersFromNodes.membersDict
        let nodeInputDict = resFindCardMemoriesAndMembersFromNodes.nodeInputDict


        let resRankBasedOnNodeInputFunc = await rankBasedOnNodeInputFunc({
          nodeInputDict,
          membersDict,
          nodesID,
        })
        membersDict = resRankBasedOnNodeInputFunc.membersDict
        nodeInputDict = resRankBasedOnNodeInputFunc.nodeInputDict



        let resRankMembersFunc = await orderedMembersFunc({
          membersDict,
          pageSize,
          pageNumber,
          neighborNodeMaxSize,
        })
        let membersArray = resRankMembersFunc.membersArray

        

        return membersArray;
        

      } catch (err) {
        printC(err, "-1", "err", "r");
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "nodeMutation > showMembersConnectedToNodes" }
        );
      }
    },
    createNeo4jDatabaseFromMongoNodes: async (parent, args, context, info) => {
      console.log("Mutation > textToPrimitivesAndTalent > args.fields = ", args.fields);

      
      let nodesData = await Node.find({ }).select("_id name existNeo4j connectedNodes");


      nodesDict = {}
      for (let i = 0; i < nodesData.length; i++) {

        if (nodesDict[nodesData[i]._id]) continue

        nodesDict[nodesData[i]._id] = nodesData[i]

        // add also the position on nodesData
        nodesDict[nodesData[i]._id] = {
          ...nodesDict[nodesData[i]._id],
          position: i
        }
        
      }

      // nodesDataTemp = nodesData.slice(0, 30);
      nodesDataTemp = nodesData;

      

      try {


        for (let i = 0; i < nodesDataTemp.length; i++) {
          // for (let i = 0; i < 1; i++) {


          // if the node don't exist on neo4j then create them
          if (!nodesDataTemp[i].existNeo4j) {
            let resCreateNode_neo4j = await createNode_neo4j({
              node: "Skill",
              id: nodesDataTemp[i]._id,
              name: nodesDataTemp[i].name,
            })
            nodesDict[nodesDataTemp[i]._id].existNeo4j = true
          } else {
            continue;
          }


          for (let j = 0; j < nodesDataTemp[i].connectedNodes.length; j++) {
            let nodeID = nodesDataTemp[i].connectedNodes[j].nodeID;

            if (!nodesDict[nodeID]) continue



            if (!nodesDict[nodeID].existNeo4j) {
              let resCreateNode_neo4j = await createNode_neo4j({
                node: "Skill",
                id: nodeID,
                name: nodesDict[nodeID]._doc.name,
              })
              nodesDict[nodeID].existNeo4j = true
            }


            let resMakeConnection_neo4j = await makeConnection_neo4j({
              node: ["Skill", "Skill"],
              id: [nodesDataTemp[i]._id, nodeID],
              connection: "related",
              weight: nodesDataTemp[i].connectedNodes[j].score,
            })

          }

          nodesDataTemp[i].existNeo4j = true
          nodesDataTemp[i].save()



        }

        // // save the nodesDict 
        // // loop the dictionary nodesDict
        // for (let key in nodesDict) {
        //   let nodeData = nodesDict[key]

        //   if (nodeData.existNeo4j == true) {
        //     nodesData[nodesDict[key].position].existNeo4j = true

        //     nodesData[nodesDict[key].position].save()
        //   }
        // }
            



        return nodesData;
      } catch (err) {
        printC(err, "-1", "err", "r");
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "nodeMutation > textToPrimitivesAndTalent" }
        );
      }
    },
    textToPrimitivesAndTalent: async (parent, args, context, info) => {
      const { text,primitiveState } = args.fields;
      let {pageSize, pageNumber,neighborNodeMaxSize,scoreCardMaxSize} = args.fields;
      console.log("Mutation > textToPrimitivesAndTalent > args.fields = ", args.fields);

      if (!pageSize) pageSize = 10
      if (!pageNumber) pageNumber = 1
      if (pageNumber == 0) throw new ApolloError("pageNumber can't be 0, starts form 1 ");

      if (!neighborNodeMaxSize) neighborNodeMaxSize = 3
      if (!scoreCardMaxSize) scoreCardMaxSize = 6

      printC(text,"1", "text", "p")

      try {

        // ---------------- Memory to Primitives --------------
        let resMemoryToPrimitivesFun = await memoryToPrimitivesFun({
          memory: text,
          primitiveState: primitiveState,
        })
        let primitives = resMemoryToPrimitivesFun.primitives
        let nodesData = resMemoryToPrimitivesFun.nodesData
        let nodesID = resMemoryToPrimitivesFun.nodesID
        // ---------------- Memory to Primitives --------------




        // ---------------- Find Members based on the nodes ----------------
        let resFindNeighborNodesFunc = await findNeighborNodesFunc({
          nodesData,
        })
        let neighborsDict = resFindNeighborNodesFunc.neighborsDict
        let neighborsNodeIDs = resFindNeighborNodesFunc.neighborsNodeIDs
        

        let resFindCardMemoriesAndMembersFromNodes = await findCardMemoriesAndMembersFromNodes({
          neighborsDict,
          neighborsNodeIDs,
        })
        let membersDict = resFindCardMemoriesAndMembersFromNodes.membersDict
        let nodeInputDict = resFindCardMemoriesAndMembersFromNodes.nodeInputDict

        

        let resRankBasedOnNodeInputFunc = await rankBasedOnNodeInputFunc({
          nodeInputDict,
          membersDict,
          nodesID,
        })
        membersDict = resRankBasedOnNodeInputFunc.membersDict
        nodeInputDict = resRankBasedOnNodeInputFunc.nodeInputDict


        // printC(membersDict,"1", "membersDict", "p")
        // printC(membersDict["113683633121156649655"],"1", "membersDict", "p")
        // printC(membersDict["113683633121156649655"].nodeInput["65847fb7182115721db30a17"],"1", "membersDict", "p")
        // printC(membersDict["106662011105885655262"].nodeInput["65847fb7182115721db30a17"].neighborNodeWithMem,"1", "membersDict", "p")
        // // printC(membersDict["106662011105885655262"].nodeInput["6584819c182115721db30eb0"].cardMemoryOutput["65903c6d7528570007afdc10"],"1", "membersDict", "p")
        // f2
        


        let resRankMembersFunc = await orderedMembersFunc({
          membersDict,
          pageSize,
          pageNumber,
          neighborNodeMaxSize,
          scoreCardMaxSize,
        })
        let membersArray = resRankMembersFunc.membersArray
        // ---------------- Find Members based on the nodes ----------------


        // printC(membersArray,"1", "membersArray", "p")
        // printC(membersArray[2],"1", "membersArray", "p")
        // printC(membersArray[2].nodeInput,"1", "membersArray", "p")
        // // // printC(membersArray[0].nodeInput[0].cardMemoryOutput,"1", "membersArray", "p")
        // // // printC(membersArray[0].nodeInput[0].cardMemoryOutput[0].nodeOutput,"1", "membersArray", "p")
        // f1

        

        return {
          primitiveState: primitives,
          memberScoreAndPrimitiveCardType: membersArray,
        };

        

      } catch (err) {
        printC(err, "-1", "err", "r");
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "nodeMutation > textToPrimitivesAndTalent" }
        );
      }
    },
    autoSuggestTalentForPosition: async (parent, args, context, info) => {
      const { positionID } = args.fields;
      let {pageSize, pageNumber,neighborNodeMaxSize,scoreCardMaxSize,maxScoreCardsCheck} = args.fields;
      console.log("Mutation > autoSuggestTalentForPosition > args.fields = ", args.fields);

      if (!pageSize) pageSize = 10
      if (!pageNumber) pageNumber = 1
      if (pageNumber == 0) throw new ApolloError("pageNumber can't be 0, starts form 1 ");

      if (!neighborNodeMaxSize) neighborNodeMaxSize = 3
      if (!scoreCardMaxSize) scoreCardMaxSize = 6

      
      
      
      try {
        // ---------------- Find position and cards of the position ----------------
        positionData = await Position.findOne({ _id: positionID }).select("_id cardsPositionCalculated prioritiesPositionCalculated")
  
        let cardMemoriesData = await CardMemory.find({ "authorCard.positionID": positionID  }).select('_id content type');

        if (cardMemoriesData.length == 0) throw new ApolloError("No cardMemoriesData found for this positionID");

        // printC(cardMemoriesData,"1", "cardMemoriesData", "p")
        // f1
        // ---------------- Find position and cards of the position ----------------


        // ---------------- Memory to Primitives -------------
        flagTEST = true

        primitives = []
        nodesData = []
        nodesID = []
        let nodeInputToCardMemoryInputDict = {}

        if (flagTEST == true){
          hardCodePrimitives = [
            ["marketing","react"],
            ["node.js","web3"],
            ["blockchain","solidity"],
            ["python","django"],
            ["javascript","typescript"],
            ["react","angular"],
            ["angular","vue"],
            // ["vue","react"],
            ["react","react-native"],
            // ["react-native","flutter"],
            // ["flutter","react-native"],
            // ["react-native","react
          ]

          

          for (let i = 0; i < hardCodePrimitives.length; i++) {
            let resMemoryToPrimitivesFun = await memoryToPrimitivesFun({
              memory: "tst",
              primitiveState: [],
              hardCodePrimitives: hardCodePrimitives[i]
            })

            primitives = primitives.concat(resMemoryToPrimitivesFun.primitives)
            nodesData = nodesData.concat(resMemoryToPrimitivesFun.nodesData)
            nodesID = nodesID.concat(resMemoryToPrimitivesFun.nodesID)
            

            for (let j = 0; j < resMemoryToPrimitivesFun.nodesID.length; j++) {
              let nodeID = resMemoryToPrimitivesFun.nodesID[j];
              nodeInputToCardMemoryInputDict[nodeID] = {
                _id: cardMemoriesData[i]._id,
                cardData: cardMemoriesData[i]
              }
            }
          }
        } else {

          if (!maxScoreCardsCheck) maxScoreCardsCheck = cardMemoriesData.length

          if (maxScoreCardsCheck > cardMemoriesData.length) maxScoreCardsCheck = cardMemoriesData.length

          for (let i = 0; i < maxScoreCardsCheck; i++) {
            let cardMemoryData = cardMemoriesData[i];
            printC(cardMemoryData.content,"1", "cardMemoryData.content", "p")
            let resMemoryToPrimitivesFun = await memoryToPrimitivesFun({
              memory: cardMemoryData.content,
            })
            primitives = primitives.concat(resMemoryToPrimitivesFun.primitives)
            nodesData = nodesData.concat(resMemoryToPrimitivesFun.nodesData)
            nodesID = nodesID.concat(resMemoryToPrimitivesFun.nodesID)

            for (let j = 0; j < resMemoryToPrimitivesFun.nodesID.length; j++) {
              let nodeID = resMemoryToPrimitivesFun.nodesID[j];
              nodeInputToCardMemoryInputDict[nodeID] = {
                _id: cardMemoryData._id,
                cardData: cardMemoryData
              }
            }
          }

        }
        // ---------------- Memory to Primitives --------------

        printC(primitives,"1", "primitives", "p")
        // afs

        // ---------------- Create Category Dictionary --------------
        let resCreateCategoryDict = await createCategoryDict({
          nodeInputToCardMemoryInputDict: nodeInputToCardMemoryInputDict,
        })
        let categoryToNodeInputDict = resCreateCategoryDict.categoryToNodeInputDict
        nodeInputToCardMemoryInputDict = resCreateCategoryDict.nodeInputToCardMemoryInputDict
        cardInputDict = resCreateCategoryDict.cardInputDict

        // printC(categoryToNodeInputDict,"1", "categoryDict", "p")
        // printC(nodeInputToCardMemoryInputDict,"1", "nodeInputToCardMemoryInputDict", "p")
        // f1
        // ---------------- Create Category Dictionary --------------


        // ---------------- Find Members based on the nodes ----------------
        let resFindNeighborNodesFunc = await findNeighborNodesFunc({
          nodesData,
        })
        let neighborsDict = resFindNeighborNodesFunc.neighborsDict
        let neighborsNodeIDs = resFindNeighborNodesFunc.neighborsNodeIDs
        

        let resFindCardMemoriesAndMembersFromNodes = await findCardMemoriesAndMembersFromNodes({
          neighborsDict,
          neighborsNodeIDs,
        })
        let membersDict = resFindCardMemoriesAndMembersFromNodes.membersDict
        let nodeInputDict = resFindCardMemoriesAndMembersFromNodes.nodeInputDict
        cardMemoriesData = resFindCardMemoriesAndMembersFromNodes.cardMemoriesData


        // let resCreateMembersCategoryDict = await createMembersCategoryDict({
        //   neighborsDict,
        //   neighborsNodeIDs,
        //   cardMemoriesData,
        //   categoryToNodeInputDict,
        //   nodeInputToCardMemoryInputDict,
        // })
        // let membersCardCategoryDict = resCreateMembersCategoryDict.membersCardCategoryDict
        
        

        let resRankBasedOnNodeInputFunc = await rankBasedOnNodeInputFunc({
          nodeInputDict,
          membersDict,
          nodesID,
        })
        membersDict = resRankBasedOnNodeInputFunc.membersDict
        nodeInputDict = resRankBasedOnNodeInputFunc.nodeInputDict


        let resRankMembersFunc = await orderedMembersFunc({
          membersDict,
          pageSize,
          pageNumber,
          neighborNodeMaxSize,
          scoreCardMaxSize,
        })
        let membersArray = resRankMembersFunc.membersArray


        let resCreateMembersCategoryArrayFun = await createMembersCategoryArrayFun({
          membersArray,
          categoryToNodeInputDict,
          nodeInputToCardMemoryInputDict,
          cardInputDict,
          pageSize,
          pageNumber,
          neighborNodeMaxSize,
          scoreCardMaxSize,
        })
        let membersArrayFinal = resCreateMembersCategoryArrayFun.membersArrayFinal

        printC(membersArrayFinal,"1", "membersCategoryArray", "p")
        // f2

        // ---------------- Find Members based on the nodes ----------------

        

        return membersArrayFinal;

        

      } catch (err) {
        printC(err, "-1", "err", "r");
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "nodeMutation > autoSuggestTalentForPosition" }
        );
      }
    },
};

async function connect_node_to_subNode(nodeData, subNodes, weight = undefined) {
  if (subNodes && subNodes.length > 0) {
    let subNodesData = await Node.find({ _id: subNodes });
    for (let i = 0; i < subNodesData.length; i++) {
      if (!subNodesData[i].aboveNodes.includes(nodeData._id)) {
        subNodesData[i].aboveNodes.push(nodeData._id);

        await Node.findOneAndUpdate(
          { _id: subNodesData[i]._id },
          {
            $set: {
              aboveNodes: subNodesData[i].aboveNodes,
            },
          },
          { new: true }
        );

        if (weight) {
          makeConnection_neo4j({
            node: [nodeData.node, subNodesData[i].node],
            id: [nodeData._id, subNodesData[i]._id],
            connection: subNodesData[i].node,
            weight: weight,
          });
        } else {
          makeConnection_neo4j({
            node: [nodeData.node, subNodesData[i].node],
            id: [nodeData._id, subNodesData[i]._id],
            connection: subNodesData[i].node,
          });
        }
      }
    }
  }
}

async function connect_node_to_aboveNode(
  nodeData,
  aboveNodes,
  weight = undefined
) {
  if (aboveNodes && aboveNodes.length > 0) {
    let aboveNodesData = await Node.find({ _id: aboveNodes });
    for (let i = 0; i < aboveNodesData.length; i++) {
      if (!aboveNodesData[i].subNodes.includes(nodeData._id)) {
        aboveNodesData[i].subNodes.push(nodeData._id);

        await Node.findOneAndUpdate(
          { _id: aboveNodesData[i]._id },
          {
            $set: {
              subNodes: aboveNodesData[i].subNodes,
            },
          },
          { new: true }
        );

        if (weight) {
          makeConnection_neo4j({
            node: [aboveNodesData[i].node, nodeData.node],
            id: [aboveNodesData[i]._id, nodeData._id],
            connection: nodeData.node,
            weight: weight,
          });
        } else {
          makeConnection_neo4j({
            node: [aboveNodesData[i].node, nodeData.node],
            id: [aboveNodesData[i]._id, nodeData._id],
            connection: nodeData.node,
          });
        }
      }
    }
  }
}
