

const { Node } = require("../../../models/nodeModal");

const nodes_aiModule = async (nodesID,weightModules,memberObj) => {

    weightModulesObj = await arrayToObject(weightModules)

    
    let nodeData = await Node.find({ _id: nodesID }).select(
        "_id node match_v2"
    );

    if (!nodeData) throw new ApolloError("Node Don't exist");

    console.log("nodeData = " , nodeData)

    // const nodeData_subExpertise = nodeData.filter(obj => obj.node == 'sub_expertise');

    memberObj = await nodesFindMembers(nodeData,memberObj)


    memberObj = await membersScoreMap(memberObj,weightModulesObj)

    // console.log("change = " , change)
    // await showObject(memberObj,"memberObj")

    // asdf5


    return memberObj
}

const totalScore_aiModule = async (memberObj,weightModules) => {



    max_S = -1
    min_S = 100000000

    newMin_total = 20
    newMax_total = 100

    
    for (const [memberID, member] of Object.entries(memberObj)) {
        let scoreOriginalTotal = 0;

        if (member.nodesTotal) {
            if (weightModules["node_total"]) {
                scoreOriginalTotal += member.nodesTotal.score * (weightModules["node_total"].weight*0.01);
            } else {
                scoreOriginalTotal += member.nodesTotal.score;
            }
        }

        if (max_S < scoreOriginalTotal) max_S = scoreOriginalTotal;
        if (min_S > scoreOriginalTotal) min_S = scoreOriginalTotal;
        
        if (!memberObj[memberID].total) {
            memberObj[memberID].total = {
                scoreOriginal: scoreOriginalTotal
            }
        }
    }

    for (const [memberID, member] of Object.entries(memberObj)) {
        let scoreOriginalTotal = member.total.scoreOriginal;

        let scoreMap = mapValue(scoreOriginalTotal, min_S, max_S, newMin_total, newMax_total);

        memberObj[memberID].total.score = parseInt(scoreMap);
    }

    return memberObj
}

const sortArray_aiModule = async (memberObj) => {

    memberArray = []

    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = member.total.score;

        console.log("member = " , member)

        // -------------- Add Nodes --------------
        nodesPercentage = []
        for (const [nodeID, node] of Object.entries(member.nodes)) {
            nodesPercentage.push({
                nodeID: nodeID,
                totalPercentage: parseInt(node.score*100)
            })
        }

        nodesPercentage.sort((a, b) => (a.totalPercentage > b.totalPercentage) ? -1 : 1)
        // -------------- Add Nodes --------------

        memberArray.push({
            memberID: memberID,
            matchPercentage: {
                totalPercentage: score
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
            if (node.type == "sub_expertise") {
                if (weightModulesObj["node_subExpertise"]) {
                    score += node.score * (weightModulesObj["node_subExpertise"].weight*0.01);
                } else {
                    score += node.score;
                }
            } else if (node.type == "sub_typeProject") {
                if (weightModulesObj["node_subTypeProject"]) {
                    score += node.score * (weightModulesObj["node_subTypeProject"].weight*0.01);
                } else {
                    score += node.score;
                }
            }
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


    // ----------- Map Scores every Member -----------
    for (const [memberID, member] of Object.entries(memberObj)) {
        let score = member.nodesTotal.scoreOriginal;
        let scoreMap = mapValue(score, min_S, max_S, newMin_members, newMax_members);

        memberObj[memberID].nodesTotal.score = scoreMap;
    }
    // ----------- Map Scores every Member -----------

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

        if (scoreUser > max_S) max_S = scoreUser;
        if (scoreUser < min_S) min_S = scoreUser;

        if (!memberObj[memberID]) {
            // memberObj[memberID] = {
            //     nodes: {
            //         `${nodeID}`: {
            //             scoreOriginal: scoreUser,
            //             type: node.node
            //         }
            //     }
            // };
            memberObj[memberID] = {
                nodes: {}
            }
            memberObj[memberID].nodes[nodeID] = {
                scoreOriginal: scoreUser,
                type: node.node
            }
        } else {
            memberObj[memberID].nodes[nodeID] = {
                scoreOriginal: scoreUser,
                type: node.node
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

        memberObj[memberID].nodes[nodeID].score = scoreUserMap;

        
    }
    // ---------- Map Score [0,1]-----------

    return memberObj

}

function mapValue(value, oldMin, oldMax, newMin, newMax) {
    var oldRange = oldMax - oldMin;
    var newRange = newMax - newMin;
    var newValue = ((value - oldMin) * newRange / oldRange) + newMin;
    return newValue;
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




module.exports = {
    nodes_aiModule,
    totalScore_aiModule,
    showObject,
    sortArray_aiModule,
  };