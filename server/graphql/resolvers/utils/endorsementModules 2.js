
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { request, gql} = require('graphql-request');

const {useGPTchatSimple} = require("./aiModules");

const {printC} = require("../../../printModule")


const addEndorsementAPIcall = async (fields) => {

    printC(fields,"7","fields","r")

//     const query = gql`
//     query FindNodes($fields: findNodesInput) {
//           findNodes(fields: $fields) {
//             _id
//             name
//             node
//           }
//         }
//   `;

//   const variables  = {
//     fields: {
//       _id: "6416ae1148d9ba5ceefb68a1"
//     }
//     };

//   res = await request('https://soil-api-backend-kgfromai2.up.railway.app/graphql', query, variables)

//   console.log("res = " , res)

    const query = gql`
    mutation AddEndorsement($fields: addEndorsementInput) {
        addEndorsement(fields: $fields) {
            _id
            userSend {
                _id
            }
            userReceive {
                _id
            }
            endorsementMessage
            nodes {
                node {
                    _id
                }
            }
            stars
            createdAt
            stake
        }
    }`;

    const variables  = {
        fields: {
            userSendID: fields.userSendID,
            userReceiveID: fields.userReceiveID,
            endorsementMessage: fields.endorsementMessage,
            stars: fields.stars,
            stake: fields.stake,
            endorseNodes: fields.endorseNodes,
        }
    };

    res = await request('https://soil-api-backend-kgfromai2.up.railway.app/graphql', query, variables)

    // console.log("res = " , res)

    printC(res.addEndorsement,"7","res","r")

    return res.addEndorsement

}

const arrayToObj = async (arrT) => {

    objT = {}
    for (let i=0;i<arrT.length;i++){
        const nodeN = arrT[i]

        if (!objT[nodeN._id]){
            objT[nodeN._id] = nodeN
        } 
    }

    return objT

}

const sumEndorsement = async (userReceiveData) => {

    previousEndorsements = await Endorsement.find({ userReceive: userReceiveData._id });

    // console.log("previousEndorsements = " , previousEndorsements)


    let endorseUpdate = {}
    
    let endorseSummaryNew = {
        totalStars: 0,
        totalStake: 0,
        numberUsersStar: 0,
        numberUsersStake: 0,
        numberEndorsement: 0,
        endorsers: [],
        mainNodesObj: {},
    }


    nodesEndorserTrustObj = {}

    // totalTrust = 0
    totalTrust = {
        totalTrustNum: 0,
        averageTrustNum: 0,
        numberOfTrustNodes: 0,
    }


    // ------------ collect info ------------
    for (let i = 0; i < previousEndorsements.length; i++) {

        endorseSummaryNew.numberEndorsement += 1

       if (previousEndorsements[i].stars) {
            endorseSummaryNew.totalStars += previousEndorsements[i].stars
            endorseSummaryNew.numberUsersStar += 1
       }
        if (previousEndorsements[i].stake) {
            endorseSummaryNew.totalStake += previousEndorsements[i].stake
            endorseSummaryNew.numberUsersStake += 1
        }
        endorseSummaryNew.endorsers.push(previousEndorsements[i].userSend)

        for (let j = 0; j < previousEndorsements[i].endorseNodes.length; j++) {
            let nodeIDnow = previousEndorsements[i].endorseNodes[j].nodeID

            if (!endorseSummaryNew.mainNodesObj[nodeIDnow]) {
                endorseSummaryNew.mainNodesObj[nodeIDnow] = {
                    nodeID: nodeIDnow,
                    numberEndorsement: 1
                }
                nodesEndorserTrustObj[nodeIDnow] = {
                    nodeID: nodeIDnow,
                    userSendID: {},
                    trustNodeTotal: 0,
                }
                nodesEndorserTrustObj[nodeIDnow].userSendID[previousEndorsements[i].userSend] = {
                    userSendID: previousEndorsements[i].userSend,
                    trust: 0,
                }
            } else {
                endorseSummaryNew.mainNodesObj[nodeIDnow].numberEndorsement += 1
                // another user nodesEndorserTrustObj -> userSendID
                if (!nodesEndorserTrustObj[nodeIDnow].userSendID[previousEndorsements[i].userSend]){
                    nodesEndorserTrustObj[nodeIDnow].userSendID[previousEndorsements[i].userSend] = {
                        userSendID: previousEndorsements[i].userSend,
                        trust: 0,
                    }
                }
            }
        }
    }
    // ------------ collect info ------------



    // ------------ Find all the endorser nodes -------------
    let userSendData = await Members.find({ _id: endorseSummaryNew.endorsers  }).select('_id name nodes')
    // console.log("userSendData = " , userSendData)
    
    userSendObj = {}
    for (let i=0;i<userSendData.length;i++){
        let userN = userSendData[i]
    

        let userSendNodeObj = await arrayToObj(userN.nodes)

        if (!userSendObj[userN._id]){
            userSendObj[userN._id] = {
                ...userN.nodes._doc,
                userSendNodeObj: userSendNodeObj,
            }
        }
    }

    // console.log("userSendObj = " , userSendObj)

    // console.log("nodesEndorserTrustObj = " , nodesEndorserTrustObj)
    // sadf

    for (const key in nodesEndorserTrustObj) {
        let nodeIDnow = key


        for (const userSendIDnow in nodesEndorserTrustObj[key].userSendID){
            let userSendNodeObj = userSendObj[userSendIDnow].userSendNodeObj

            if (userSendNodeObj[nodeIDnow]){
                nodesEndorserTrustObj[key].userSendID[userSendIDnow].trust = 0.3
                nodesEndorserTrustObj[key].trustNodeTotal += 0.3
                // totalTrust += 0.3
                 totalTrust.totalTrustNum += 0.3
                totalTrust.numberOfTrustNodes += 1


                if (userSendNodeObj[nodeIDnow]?.trust?.totalTrust){
                    nodesEndorserTrustObj[key].userSendID[userSendIDnow].trust = userSendNodeObj[nodeIDnow]?.trust?.totalTrust
                    nodesEndorserTrustObj[key].trustNodeTotal += userSendNodeObj[nodeIDnow]?.trust?.totalTrust
                    // totalTrust += userSendNodeObj[nodeIDnow]?.trust?.totalTrust
                    totalTrust.totalTrustNum += userSendNodeObj[nodeIDnow]?.trust?.totalTrust
                    totalTrust.numberOfTrustNodes += 1
                    

                }
            } else {
                nodesEndorserTrustObj[key].userSendID[userSendIDnow].trust = 0.1
                nodesEndorserTrustObj[key].trustNodeTotal += 0.1
                // totalTrust += 0.1
                totalTrust.totalTrustNum += 0.1
                totalTrust.numberOfTrustNodes += 1
            }


        }

    }

    // console.log("nodesEndorserTrustObj = " , nodesEndorserTrustObj)
    // console.log("nodesEndorserTrustObj = " , nodesEndorserTrustObj["6416b303a57032640bd80891"])
    // console.log("nodesEndorserTrustObj = " , nodesEndorserTrustObj["6416ae1148d9ba5ceefb68a1"])
    // console.log("totalTrust = " , totalTrust)
    // sf93

    // ------------ Find all the endorser nodes -------------


    totalTrust.averageTrustNum = totalTrust.totalTrustNum / totalTrust.numberOfTrustNodes

    //  ---------- Organise Nodes ----------
    // from endorseSummary.mainNodesObj dictionarry, to an array
    let mainNodesArray = []
    for (const key in endorseSummaryNew.mainNodesObj) {
        // mainNodesArray.push(endorseSummaryNew.mainNodesObj[key])
        mainNodesArray.push({
            nodeID: key,
            confidence: endorseSummaryNew.mainNodesObj[key].numberEndorsement
        })
    }
    endorseSummaryNew.mainNodes = mainNodesArray

    //  ---------- Organise Nodes ----------


    endorseSummaryNew.averageStars = endorseSummaryNew.totalStars / endorseSummaryNew.numberUsersStar
    endorseSummaryNew.averageStake = endorseSummaryNew.totalStake / endorseSummaryNew.numberUsersStake


    // ------------ Summary GPT ------------
    let prompotAllsummary = ""

    let lastEndorseMessgage = ""
    if (previousEndorsements[previousEndorsements.length-1]?.endorsementMessage){
        lastEndorseMessgage = previousEndorsements[previousEndorsements.length-1]?.endorsementMessage
    }

    if (userReceiveData?.endorseSummary?.summary){
        prompotAllsummary+= "Summary of all Endorcments so far: " + userReceiveData?.endorseSummary?.summary + "\n"
        prompotAllsummary+= "Last Endorcment:" + lastEndorseMessgage + "\n"

        prompt_n = "Summarize the endorsement in 3 sentenses given all the endorsements below"

        prompt_n = prompt_n + "\n\n" + prompotAllsummary

        // console.log("--------------" )
        // console.log("prompt_n = " , prompt_n)

        let summaryGPT = await useGPTchatSimple(prompt_n)
        // console.log("summaryGPT = " , summaryGPT)
        // console.log("--------------" )


        endorseSummaryNew.summary = summaryGPT
    } else {
        // just use the last summary as the total summary
        endorseSummaryNew.summary = lastEndorseMessgage
    }    
    // ------------ Summary GPT ------------




    endorseUpdate = {
        endorseSummary: endorseSummaryNew
    }

    
    return {
        endorseUpdate,
        nodesEndorserTrustObj,
        totalTrust,
    }
}

const checkEndorseNodes = async (endorseNodes,newEndorsement,userSendNodeObj) => {

    if (!endorseNodes) return newEndorsement
    
    
    let endorseNodesIDArr = []
    let endorseNodesObj = {}
    for (let i = 0; i < endorseNodes.length; i++) {
        if (!endorseNodesObj[endorseNodes[i].nodeID]) {
        endorseNodesObj[endorseNodes[i].nodeID] = endorseNodes[i]
        endorseNodesIDArr.push(endorseNodes[i].nodeID)
        }
    }

    nodeData = await Node.find({ _id: endorseNodesIDArr }).select('_id name')


    nodesSave = []
    for (let i = 0; i < nodeData.length; i++) {
        
        // console.log("nodeData[i]._id = " , nodeData[i]._id)

        // // ------ trust node from userSend ------
        // let trustNode = 0
        // if (userSendNodeObj[nodeData[i]._id]) {
        //     if (userSendNodeObj[nodeData[i]._id]?.trust?.totalTrust){
        //         trustNode += userSendNodeObj[nodeData[i]._id]?.trust?.totalTrust
        //     } else {
        //         trustNode += 0.3
        //     }
        // } else {
        //     trustNode += 0.1
        // }
        // // ------ trust node from userSend ------


        endorseNodesObj[nodeData[i]._id] = {
        ...endorseNodesObj[nodeData[i]._id],
        ...nodeData[i]._doc
        }
        nodesSave.push(endorseNodesObj[nodeData[i]._id])
        
    }

    newEndorsement.endorseNodes = nodesSave



    return newEndorsement
}


module.exports = {
    sumEndorsement,
    arrayToObj,
    checkEndorseNodes,
    addEndorsementAPIcall,
  };