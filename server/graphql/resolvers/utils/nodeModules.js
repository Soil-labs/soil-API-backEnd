
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const { request, gql} = require('graphql-request');

const { REACT_APP_API_URL, REACT_APP_API_CRON_URL } = process.env;



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

const updateNodesToMember = async (fields) => {


  console.log(" fields.nodesID = " ,  fields.nodesID)

  const query = gql`
    mutation UpdateNodesToMember($fields: updateNodesToMemberInput!) {
        updateNodesToMember(fields: $fields) {
          _id
          nodes {
            nodeData {
              _id
              name
            }
          }
        }
      }`;

    const variables  = {
        fields: {
            nodesID: fields.nodesID,
            nodeType: fields.nodeType,
        }
    };

    const headers = {
      authorization: `Bearer ${fields.Authorization}`,
      // 'X-Custom-Header': 'CustomValue'
    }

    res = await request(
      // 'https://soil-api-backend-kgfromai2.up.railway.app/graphql'
    REACT_APP_API_URL, query, variables,headers)

    // console.log("res = " , res)


    console.log("res.updateNodesToMember = " , res.updateNodesToMember)

    return res.updateNodesToMember

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

  const addNodesToMemberFunc = async (userID,nodesID) => {
    const query = gql`
      mutation addNodesToMember($fields: addNodesToMemberInput!) {
        addNodesToMember(fields: $fields) {
          _id
          discordName
          nodes {
            nodeData {
              _id
              name
            }
          }
        }
      }
    `;

    const variables = {
      fields: {
        memberID: userID,
        nodesID: nodesID
      },
    };

    res = await request(
      // "https://soil-api-backend-kgfromai2.up.railway.app/graphql",
      // "https://soil-api-backend-productionai2.up.railway.app/graphql",
      REACT_APP_API_URL,
      query,
      variables
    );

    
    return res.addNodesToMember.nodes;
  };


module.exports = {
    changeMatchByServer,
    updateNodeToMemberOnNeo4J,
    updateNodesToMember,
    addNodesToMemberFunc,
  };