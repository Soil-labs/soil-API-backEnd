

const { Node } = require("../../../models/nodeModal");
const { Members } = require("../../../models/membersModel");

const axios = require("axios");



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
  
  async function useGPTchatSimple(prompt,temperature=0.7) {
    
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
        temperature: temperature,
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

const nodes_aiModule = async (nodesID,weightModules,memberObj) => {

    weightModulesObj = await arrayToObject(weightModules)

    
    let nodeData = await Node.find({ _id: nodesID }).select(
        "_id node match_v2"
    );

    if (!nodeData) throw new ApolloError("Node Don't exist");


    memberObj = await nodesFindMembers(nodeData,memberObj)

    memberObj = await findMemberAndFilter(memberObj)

    memberObj = await membersScoreMap(memberObj,weightModulesObj)

    // console.log("change = " , change)
    await showObject(memberObj,"memberObj")

    // asdf5


    return memberObj
}

const totalScore_aiModule = async (memberObj,weightModules,numberNodes) => {



    max_S = -1
    min_S = 100000000

    newMin_total = 20
    newMax_total = parseInt(nodeToMaxScore(numberNodes))

    // console.log("memberObj = " , memberObj)
    // sdf01

    
    for (const [memberID, member] of Object.entries(memberObj)) {
        let scoreOriginalTotal = 0;
        let scoreOriginalBeforeMap = 0;

        // console.log("member = " , member.nodesTotal)

        if (member.nodesTotal) {
            if (weightModules["node_total"]) {
                scoreOriginalTotal += member.nodesTotal.score * (weightModules["node_total"].weight*0.01);
                scoreOriginalBeforeMap += member.nodesTotal.scoreOriginal * (weightModules["node_total"].weight*0.01);

            } else {
                scoreOriginalTotal += member.nodesTotal.score;
                scoreOriginalBeforeMap += member.nodesTotal.scoreOriginal;

            }
        }

        if (max_S < scoreOriginalTotal) max_S = scoreOriginalTotal;
        if (min_S > scoreOriginalTotal) min_S = scoreOriginalTotal;
        
        if (!memberObj[memberID].total) {
            memberObj[memberID].total = {
                scoreOriginal: scoreOriginalTotal,
                scoreOriginalBeforeMap: scoreOriginalBeforeMap,
            }
        }
    }

    // console.log("max_S,min_S = " , max_S,min_S)

    for (const [memberID, member] of Object.entries(memberObj)) {
        let scoreOriginalTotal = member.total.scoreOriginal;
        let scoreOriginalBeforeMap = member.total.scoreOriginalBeforeMap;

        let scoreMap = mapValue(scoreOriginalTotal, min_S, max_S, newMin_total, newMax_total);

        memberObj[memberID].total.score = parseInt(scoreMap);
        memberObj[memberID].total.realTotalPercentage = scoreOriginalTotal;
        memberObj[memberID].total.scoreOriginalBeforeMap = scoreOriginalBeforeMap;

    }

    return memberObj
}

const sortArray_aiModule = async (memberObj) => {

    memberArray = []

    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = member.total.score;

        // console.log("member = " , member)

        // -------------- Add Nodes --------------
        nodesPercentage = []
        for (const [nodeID, node] of Object.entries(member.nodes)) {
            // console.log("node = " , node)
            nodesPercentage.push({
                nodeID: nodeID,
                totalPercentage: parseInt(node.score*100),
                conn_nodeIDs: node.conn_nodeIDs,
            })
        }

        nodesPercentage.sort((a, b) => (a.totalPercentage > b.totalPercentage) ? -1 : 1)
        // -------------- Add Nodes --------------

        memberArray.push({
            memberID: memberID,
            matchPercentage: {
                totalPercentage: score,
                realTotalPercentage: member.total.scoreOriginalBeforeMap,
            },
            nodesPercentage: nodesPercentage,
        })
    }

    // console.log("memberArray = " , memberArray)

    memberArray.sort((a, b) => (a.matchPercentage.totalPercentage > b.matchPercentage.totalPercentage) ? -1 : 1)

    return memberArray
}

const membersScoreMap = async (memberObj,weightModulesObj) => {

    let max_S = -1
    let min_S = 100000000

    let newMin_members = 0.2
    let newMax_members = 1
   
    // ----------- Find original Scores every Member -----------
    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = 0;
        let nodes = member.nodes;
        for (const [nodeID, node] of Object.entries(nodes)) {
            // score += node.score;

            if (weightModulesObj[`node_${node.type}`]) {
                // score += node.score * (weightModulesObj[`node_${node.type}`].weight*0.01);
                score += node.scoreOriginal * (weightModulesObj[`node_${node.type}`].weight*0.01);
                console.log("change = 1" , `node_${node.type}`,weightModulesObj[`node_${node.type}`].weight,node.scoreOriginal, node.scoreOriginal * (weightModulesObj[`node_${node.type}`].weight*0.01),score,memberID)
            } else {
                if (weightModulesObj["node_else"]) {
                    // console.log("change = 2" , `node_else`)

                    // score += node.score * (weightModulesObj["node_else"].weight*0.01);
                    score += node.scoreOriginal * (weightModulesObj["node_else"].weight*0.01);
                } else {
                    // console.log("change = 3" , `node nothing`)
                    // score += node.score;
                    score += node.scoreOriginal;
                }
            }
            

            // if (node.type == "sub_expertise") {
                // if (weightModulesObj["node_subExpertise"]) {
                //     score += node.score * (weightModulesObj["node_subExpertise"].weight*0.01);
                // } else {
                //     score += node.score;
                // }
            // } else if (node.type == "sub_typeProject") {
            //     if (weightModulesObj["node_subTypeProject"]) {
            //         score += node.score * (weightModulesObj["node_subTypeProject"].weight*0.01);
            //     } else {
            //         score += node.score;
            //     }
            // } else {
                // if (weightModulesObj["node_else"]) {
                //     score += node.score * (weightModulesObj["node_else"].weight*0.01);
                // } else {
                //     score += node.score;
                // }
            // }
        }
        
        if (score > max_S) max_S = score;
        if (score < min_S) min_S = score;

        if (!memberObj[memberID].nodesTotal) {
            memberObj[memberID].nodesTotal = {
                scoreOriginal: score
            }
        }
    }
    // ----------- Find original Scores every Member -----------

    // console.log("max_S,min_S = " , max_S,min_S)
    // asdf12


    // ----------- Map Scores every Member -----------
    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = member.nodesTotal.scoreOriginal;
        let scoreMap = mapValue(score, min_S, max_S, newMin_members, newMax_members);

        // console.log("scoreMap = " , scoreMap, min_S, max_S, newMin_members, newMax_members)

        memberObj[memberID].nodesTotal.score = scoreMap;
    }
    // ----------- Map Scores every Member -----------

    return memberObj
    
}

const passFilterTestMember = async (memberData) => {



    // console.log("memberData = " , memberData)

    // console.log("change = 0" )

    if (!memberData?.hoursPerWeek) return false;
    // console.log("change = 1" )

    if (!memberData?.budget?.perHour) return false;

    // console.log("change = 2" )


    // if (!memberData?.expirienceLevel?.total) return false;

    return true

}

const findMemberAndFilter = async (memberObj) => {

    
    // from memberObj take only the keys and make a new array
    memberIDs = Object.keys(memberObj);

    // search on the mongo for all the members
    let membersData = await Members.find({ _id: memberIDs }).select('_id discordName hoursPerWeek totalNodeTrust expirienceLevel budget');

    // console.log("membersData = " , membersData)


    // add the members data to the memberObj
    for (let i = 0; i < membersData.length; i++) {
        let memberID = membersData[i]._id;

        if (memberObj[memberID]) {

            passFilter = await passFilterTestMember(membersData[i])

            if (passFilter== true){
                memberObj[memberID] = {
                    ...memberObj[memberID],
                    ...membersData[i]._doc
                }
            } else {
                // console.log("change =-------------- dElETE " ,)
                delete memberObj[memberID]
            }

        }
    }

    return memberObj
}

const nodesFindMembers = async (nodeData,memberObj) => {

    memberIDs = [];


    for (let i = 0; i < nodeData.length; i++) {
        // loop on the nodes
        let match_v2 = nodeData[i].match_v2;
        let node = nodeData[i];

        memberObj = await nodeScoreMembersMap(match_v2,node,memberObj)

    }


    return memberObj
}

const nodeScoreMembersMap = async (match_v2,node,memberObj) => {

    let nodeID = node._id;

    max_S = -1
    min_S = 100000000

    newMin_nodeMember = 0.2
    newMax_nodeMember = 1
    // ---------- Find nodes and Max Min -----------
    for (let j = 0; j < match_v2.length; j++) {

        if (! (match_v2[j].type == "Member")) continue;

        let memberID = match_v2[j].nodeResID;
        let scoreUser = match_v2[j].wh_sum;

        // ------------- Find all connected nodes -------------
        let conn_node = match_v2[j].conn_node_wh;
        let conn_nodeIDs = conn_node.map((item) => item.nodeConnID);

        // console.log("conn_nodeIDs = " , conn_nodeIDs)
        // asdf2
        // ------------- Find all connected nodes -------------

        if (scoreUser > max_S) max_S = scoreUser;
        if (scoreUser < min_S) min_S = scoreUser;

        if (!memberObj[memberID]) {
            
            memberObj[memberID] = {
                nodes: {}
            }
            memberObj[memberID].nodes[nodeID] = {
                scoreOriginal: scoreUser,
                type: node.node,
                conn_nodeIDs: conn_nodeIDs
            }
        } else {
            memberObj[memberID].nodes[nodeID] = {
                scoreOriginal: scoreUser,
                type: node.node,
                conn_nodeIDs: conn_nodeIDs
            };
        }
    }
    // ---------- Find nodes and Max Min -----------

    // ---------- Map Score [0,1]-----------
    for (let j = 0; j < match_v2.length; j++) {

        if (! (match_v2[j].type == "Member")) continue;

        let memberID = match_v2[j].nodeResID;
        let scoreUser = match_v2[j].wh_sum;

        let scoreUserMap = mapValue(scoreUser, min_S, max_S, newMin_nodeMember, newMax_nodeMember);

        // console.log("memberObj[memberID] = " , memberObj[memberID]) // TODO: delete
        // console.log("memberObj[memberID].nodes[nodeID] = " , memberObj[memberID].nodes[nodeID]) // TODO: delete

        if (Number.isNaN(scoreUserMap)) {
            memberObj[memberID].nodes[nodeID].score = 0.6
        } else {
            memberObj[memberID].nodes[nodeID].score = scoreUserMap;
        }

        // console.log("change = " , scoreUserMap)

        // console.log("scoreUserMap = -------------" , scoreUserMap,scoreUser, min_S, max_S, newMin_nodeMember, newMax_nodeMember)

        
    }
    // ---------- Map Score [0,1]-----------
    // sfaf6

    return memberObj

}

function mapValue(value, oldMin, oldMax, newMin, newMax) {
    var oldRange = oldMax - oldMin;
    if (oldRange == 0){
        // return newMax*0.9;
        return 0.1;
    } else {
        var newRange = newMax - newMin;
        var newValue = ((value - oldMin) * newRange / oldRange) + newMin;
        return newValue;
    }
}

async function showArray(arr,name="arr") {
    console.log(" ------------------ " + name + " ------------------")
    for (let i = 0; i < arr.length; i++) {
        console.log(arr[i]);
    }
    console.log(" ------------------ " + name + " ------------------")

}

async function showObject(objectT,name="objectT") {
    console.log(" ------------------ " + name + " ------------------")
    for (const [key, value] of Object.entries(objectT)) {
        console.log("key = " , key)
        console.log("value = " , value)
    }
    console.log(" ------------------ " + name + " ------------------")
}

async function arrayToObject(arrayT) {
    let objectT = {};
    for (let i = 0; i < arrayT.length; i++) {
        objectT[arrayT[i].type] = arrayT[i];
    }
    return objectT;
}

function nodeToMaxScore(x) {
    const a = -0.056;
    const b = 3.972;
    const c = 66.084;
    const y = a * Math.pow(x, 2) + b * x + c;



    return y;
}





module.exports = {
    nodes_aiModule,
    totalScore_aiModule,
    showObject,
    sortArray_aiModule,
    chooseAPIkey,
    useGPTchatSimple,
  };