
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const {
    makeConnection_neo4j,
    findAllNodesDistanceRfromNode_neo4j,
  } = require("../../../neo4j/func_neo4j");


const updateNodeToMemberOnNeo4J = async (nodeNow,memberID) => {

    console.log("Byaaaa" )
    if (nodeNow.weight != undefined) {
        makeConnection_neo4j({
            node: [nodeNow.node, "Member"],
            id: [nodeNow._id, memberID],
            connection: "connection",
            weight: nodeNow.weight.toFixed(3),
        });
    } else {
        makeConnection_neo4j({
            node: [nodeNow.node, "Member"],
            id: [nodeNow._id, memberID],
            connection: "connection",
        });
        console.log("Byaaaa 2" )
    }

    changeMatchByServer(nodeNow);
}


// create async function that will change matchByServer
const changeMatchByServer = async (nodeNow) => {
    console.log("Byaaaa 3" )
    // find all the Nodes that need to change around the nodeNow
    let allNodesDistanceR = await findAllNodesDistanceRfromNode_neo4j({
      nodeID: nodeNow._id,
    });
  
    // console.log("allNodesDistanceR = " , allNodesDistanceR)
    // console.log("change = " , change)
  
    // find all the node data from the allNodesDistanceR and then loop throw them
    let allNodesDistanceR_Data = await Node.find({
      _id: allNodesDistanceR,
    }).select("_id match_v2_update");
  
    // loop throw all the nodes and change the matchByServer
    for (let i = 0; i < allNodesDistanceR_Data.length; i++) {
      let node_n = allNodesDistanceR_Data[i];
  
      // Update the node
      let nodeData3 = await Node.findOneAndUpdate(
        { _id: node_n._id },
        {
          $set: {
            match_v2_update: {
              member: true,
              projectRole: node_n.match_v2_update.projectRole,
            },
          },
        },
        { new: true }
      );
    }
  };


module.exports = {
    changeMatchByServer,
    updateNodeToMemberOnNeo4J,
  };