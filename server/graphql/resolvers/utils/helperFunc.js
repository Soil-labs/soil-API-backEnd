const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");

const md5 = require('md5'); // Used to hash the email address

const {
  createNode_neo4j,
  updateNode_neo4j_serverID,
  makeConnection_neo4j,
  findAllNodesDistanceRfromNode_neo4j,
} = require("../../../neo4j/func_neo4j");

const arrayToKeyObject = async (arrayT,type) => {

    const nodeArr = []
    const nodeObj = {};
    arrayT?.forEach(obj => {
      const id = obj._id.toString();
      nodeObj[id] = {
          ...obj,
          type: type
      }
      nodeArr.push(id)
    });

    return {
        nodeArr,
        nodeObj
    }
}

const getRandomIDs = async (arrayT, num) => {
    const randomIDs = [];
    console.log("arrayT = " , arrayT)
    mini = Math.min(num,arrayT.length)
    console.log("mini = " , mini)
    // asfd5
    while (randomIDs.length < mini) {
        const randomIndex = Math.floor(Math.random() * arrayT.length);
        const randomID = arrayT[randomIndex];
        if (!randomIDs.includes(randomID)) {
        randomIDs.push(randomID);
        }
    }
    return randomIDs;
}

/**
 * Fetches a random avatar picture from the RandomUser API.
 * @returns {Promise<string>} A Promise that resolves to the URL of the avatar picture.
 */
 const  fetchRandomAvatar = async() => {
    try {
      // Make a GET request to the RandomUser API
      const response = await axios.get('https://randomuser.me/api/');
  
      // Extract the URL of the large avatar picture from the response
      const avatarUrl = response.data.results[0].picture.large;
  
      // Return the URL of the avatar picture
      return avatarUrl;
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error('Error fetching random avatar:', error.message);
      throw error;
    }
  }

  const  randomPicture = async() => {
    try {

      let randomNumber = Math.floor(Math.random() * 1070) + 1;

      // Extract the URL of the large avatar picture from the response
      const avatarUrl = `https://picsum.photos/id/${randomNumber}/200`
  
      // Return the URL of the avatar picture
      return avatarUrl;
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error('Error fetching random avatar:', error.message);
      throw error;
    }
  }



function chooseAPIkey() {
// openAI_keys = [
//   "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",
//   // "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",
//   "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",
//   "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",
// ];
openAI_keys = ["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"];

// randomly choose one of the keys
let randomIndex = Math.floor(Math.random() * openAI_keys.length);
let key = openAI_keys[randomIndex];

return key;
}
  


async function useGPTchat(prompt) {
  
    discussion = [{
      "role": "user",
      "content": prompt
    }]
  
  
    
    let OPENAI_API_KEY = chooseAPIkey();
    response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        messages: discussion,
        model: "gpt-3.5-turbo",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
  
    return response.data.choices[0].message.content;
}

async function addNewFakeUser(fields) {

  console.log("fields = " , fields)

  let membersData = await Members.findOne({ _id: fields._id });

  //console.log("membersData = " , membersData)

  if (!membersData) {

    membersData = await new Members(fields);

    membersData.save();

    //add member node to neo4j
    await createNode_neo4j({
      node: "Member",
      id: fields._id,
      name: fields.discordName,
      serverID: membersData.serverID,
    });

  } else {
    if (!membersData.serverID) {
      membersData = await Members.findOneAndUpdate(
        { _id: membersData._id },
        { serverID: serverID },
        { new: true }
      );

      updateNode_neo4j_serverID({
        node: "Member",
        id: membersData._id,
        serverID: membersData.serverID,
      });
    } else {
      let serverID_new = [...membersData.serverID];
      if (!membersData.serverID.includes(serverID)) {
        serverID_new.push(serverID);
      }
      membersData = await Members.findOneAndUpdate(
        { _id: membersData._id },
        { serverID: serverID_new },
        { new: true }
      );

      updateNode_neo4j_serverID({
        node: "Member",
        id: membersData._id,
        serverID: serverID_new,
      });
    }
  }

}

async function addNodesToFakeMember(fields) {

  let { memberID, nodesID, nodesID_level } = fields;

  let nodesID_level_obj = {};
  if (nodesID == undefined) {
    nodesID = nodesID_level.map((item) => item.nodeID);

    // change nodesID_level from array of objects to an object
    for (let i = 0; i < nodesID_level.length; i++) {
      let item = nodesID_level[i];
      nodesID_level_obj[item.nodeID] = item;
    }
  }
  console.log("nodesID_level_obj = ", nodesID_level_obj);

  let memberData = await Members.findOne({ _id: memberID });

  let nodesData = await Node.find({ _id: nodesID }).select(
    "_id node match_v2_update"
  );

  // check if the nodes are already in the member (memberData.nodes)
  let nodesDataOriginalArray = memberData.nodes.map(function (item) {
    return item._id.toString();
  });

  let nodesIDArray = nodesID.map(function (item) {
    return item.toString();
  });

  let differenceNodes = nodesIDArray.filter(
    (x) => !nodesDataOriginalArray.includes(x)
  );
  console.log("differenceNodes = ", differenceNodes);

  if (differenceNodes.length > 0) {
    let nodesDataNew = [];
    for (let i = 0; i < differenceNodes.length; i++) {
      let nodeID = differenceNodes[i];
      let nodeData = nodesData.find(
        (x) => x._id.toString() == nodeID.toString()
      );

      if (nodesID_level != undefined) {
        // caluclate the skill level and add it to the nodes for the next phase
        let nodeNow_weight = await calculate_skill_level(
          nodesID_level_obj[nodeID]
        );

        nodesDataNew.push({
          ...nodeData._doc,
          weight: nodeNow_weight.weight_total,
        });
        memberData.nodes.push({
          _id: nodeID,
          orderIndex: nodeNow_weight.orderIndex,
          level: nodeNow_weight.level,
          weight: nodeNow_weight.weight_total,
          aboveNodes: nodesID_level_obj[nodeID].aboveNodes,
        });
      } else {
        nodesDataNew.push(nodeData);
        memberData.nodes.push({ _id: nodeID });
      }
    }

    // add only the new ones as relationship on Neo4j
    for (let i = 0; i < nodesDataNew.length; i++) {
      let nodeNow = nodesDataNew[i];

      if (nodeNow.weight != undefined) {
        makeConnection_neo4j({
          node: [nodeNow.node, "Member"],
          id: [nodeNow._id, memberData._id],
          connection: "connection",
          // weight: "0.1",
          weight: nodeNow.weight.toFixed(3),
        });
      } else {
        makeConnection_neo4j({
          node: [nodeNow.node, "Member"],
          id: [nodeNow._id, memberData._id],
          connection: "connection",
        });
      }
      
      changeMatchByServer(nodeNow, memberData);
      
    }
  }

  console.log("memberData.nodes = ", memberData.nodes);
  // safd2;

  console.log("memberData =  -- - -- --- -- " , memberData)

  memberData2 = await Members.findOneAndUpdate(
    { _id: memberID },
    {
      $set: {
        nodes: memberData.nodes,
      },
    },
    { new: true }
  );


  return memberData2;


}


// create async function that will change matchByServer
const changeMatchByServer = async (nodeNow, memberData) => {
  // find all the Nodes that need to change around the nodeNow
  // console.log("nodeNow = " , nodeNow)
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
  
async function generateRandomID(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = {
    arrayToKeyObject,
    getRandomIDs,
    fetchRandomAvatar,
    useGPTchat,
    generateRandomID,
    addNewFakeUser,
    addNodesToFakeMember,
    randomPicture,
  };