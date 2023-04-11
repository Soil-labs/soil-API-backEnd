
const { Review } = require("../../../models/reviewModel");
const { Endorsement } = require("../../../models/endorsementModel");
const { Members } = require("../../../models/membersModel");


const { Node } = require("../../../models/nodeModal");

const {useGPTchatSimple} = require("./aiModules");

const { printC } = require("../../../printModule");

const { request, gql} = require('graphql-request');


const {
    arrayToObj,
  } = require("../utils/endorsementModules");


const sumReview = async (userReceiveData,newReview) => {

    previousEndorsements = await Review.find({ userReceive: userReceiveData._id });

    let reviewUpdate = {}
    
    let reviewSummaryNew = {
        totalStars: 0,
        totalIncome: 0,
        numberUsersStar: 0,
        numberUsersStake: 0,
        numberReview: 0,
        reviewers: [],
        mainNodesObj: {},
    }

    // ------------ add the newReview ------------
    if (newReview.stars) {
        reviewSummaryNew.totalStars += newReview.stars
        reviewSummaryNew.numberUsersStar += 1
    }
    if (newReview.income) {
        reviewSummaryNew.totalIncome += newReview.income
        reviewSummaryNew.numberUsersStake += 1
    } 
    reviewSummaryNew.reviewers.push(newReview.userSend)

    for (let j = 0; j < newReview?.reviewNodes?.length; j++) {
        let nodeIDnow = newReview.reviewNodes[j].nodeID

        if (!reviewSummaryNew.mainNodesObj[nodeIDnow]) {
            reviewSummaryNew.mainNodesObj[nodeIDnow] = {
                nodeID: nodeIDnow,
                numberReview: 1
            }
        } else {
            reviewSummaryNew.mainNodesObj[nodeIDnow].numberReview += 1
        }
    }
    // ------------ add the newReview ------------

    console.log("change = 3.3" )

    // ------------ collect info ------------
    for (let i = 0; i < previousEndorsements?.length; i++) {

        reviewSummaryNew.numberReview += 1

       if (previousEndorsements[i].stars) {
            reviewSummaryNew.totalStars += previousEndorsements[i].stars
            reviewSummaryNew.numberUsersStar += 1
       }
        if (previousEndorsements[i].income) {
            reviewSummaryNew.totalIncome += previousEndorsements[i].income
            reviewSummaryNew.numberUsersStake += 1
        }
        reviewSummaryNew.reviewers.push(previousEndorsements[i].userSend)

        for (let j = 0; j < previousEndorsements[i].reviewNodes.length; j++) {
            let nodeIDnow = previousEndorsements[i].reviewNodes[j].nodeID

            if (!reviewSummaryNew.mainNodesObj[nodeIDnow]) {
                reviewSummaryNew.mainNodesObj[nodeIDnow] = {
                    nodeID: nodeIDnow,
                    numberReview: 1
                }
            } else {
                reviewSummaryNew.mainNodesObj[nodeIDnow].numberReview += 1
            }
        }
    }
    // ------------ collect info ------------

    //  ---------- Organise Nodes ----------
    // from endorseSummary.mainNodesObj dictionarry, to an array
    let mainNodesArray = []
    for (const key in reviewSummaryNew.mainNodesObj) {
        // mainNodesArray.push(reviewSummaryNew.mainNodesObj[key])
        mainNodesArray.push({
            nodeID: key,
            confidence: reviewSummaryNew.mainNodesObj[key].numberReview
        })
        // console.log("reviewSummaryNew.mainNodesObj[key] = " , reviewSummaryNew.mainNodesObj[key])
    }
    reviewSummaryNew.mainNodes = mainNodesArray

    //  ---------- Organise Nodes ----------


    reviewSummaryNew.averageStars = reviewSummaryNew.totalStars / reviewSummaryNew.numberUsersStar
    reviewSummaryNew.averageStake = reviewSummaryNew.totalIncome / reviewSummaryNew.numberUsersStake


    // ------------ Summary GPT ------------
    let prompotAllsummary = ""

    if (userReceiveData?.endorseSummary?.summary){
        prompotAllsummary+= "Summary of all Endorcments so far: " + userReceiveData?.endorseSummary?.summary + "\n"
        prompotAllsummary+= "Last Endorcment:" + newReview.reviewMessage + "\n"

        prompt_n = "Summarize the endorsement in 3 sentenses given all the endorsements below"

        prompt_n = prompt_n + "\n\n" + prompotAllsummary

        console.log("--------------" )
        console.log("prompt_n = " , prompt_n)

        let summaryGPT = await useGPTchatSimple(prompt_n)
        console.log("summaryGPT = " , summaryGPT)
        console.log("--------------" )


        reviewSummaryNew.summary = summaryGPT
    } else {
        // just use the last summary as the total summary
        // console.log("change = " , newReview)
        reviewSummaryNew.summary = newReview.reviewMessage
    }    
    // ------------ Summary GPT ------------




    reviewUpdate = {
        reviewSummary: reviewSummaryNew
    }

    console.log("reviewUpdate = " , reviewUpdate)
    
    return reviewUpdate
}


const calcReputationUser = async (userID) => {


    const query = gql`
    mutation CalculateReputation($fields: calculateReputationInput) {
        calculateReputation(fields: $fields) {
            _id
    
            endorsementsSendStats {
            unclaimedReward
            totalReward
            reputation
            }
        }
    }`;

    const variables  = {
        fields: {
            userID: userID
        }
    };

    res = await request('https://soil-api-backend-kgfromai2.up.railway.app/graphql', query, variables)

    // console.log("res = " , res)

    printC(res.calculateReputation,"10","res","b")
    // sdf00

    return res?.calculateReputation?.endorsementsSendStats?.reputation

}


const payEndorsersF = async (userReceiveData, income) => {

    persentageOfIncome = 0.05

    printC(userReceiveData,"7","userReceiveData","r")


    let endorseData = await Endorsement.find({ _id: userReceiveData?.endorsementsReceive }).select('_id userSend');

    printC(endorseData,"7","endorseData","r")


    let endorseDataObj = await arrayToObj(endorseData,"userSend")

    printC(endorseDataObj,"7","endorseDataObj","r")

    

    // sdf22


    totalReputation = 0
    for (const key in endorseDataObj) {
        let reputation = await calcReputationUser(key)

        // endorseDataObj[key].reputation = reputation
        endorseDataObj[key] = {
            ...endorseDataObj[key]._doc,
            reputation: reputation
        }

        totalReputation += reputation

    }

    printC(endorseDataObj,"11","endorseDataObj","r")


    //  ------------ Members Data -----------
    const membersID = Object.keys(endorseDataObj)

    printC(membersID,"7","membersID","r")

    let membersData = await Members.find({ _id: membersID }).select('_id endorsementsSendStats');

    for (let i = 0; i < membersData.length; i++) {

        let endorsementsSendStatsTemp = membersData[i].endorsementsSendStats

        if (!endorsementsSendStatsTemp?.unclaimedReward) endorsementsSendStatsTemp.unclaimedReward = 0

        if (!endorsementsSendStatsTemp?.totalReward) endorsementsSendStatsTemp.totalReward = 0

        endorseDataObj[membersData[i]._id] = {
            ...endorseDataObj[membersData[i]._id],
            endorsementsSendStats : endorsementsSendStatsTemp
        }
    }

    printC(endorseDataObj,"7","endorseDataObj","r")
    // ------------ Members Data -----------

    // PE = Pay Endorsers

    for (const key in endorseDataObj) {

        reputation = endorseDataObj[key].reputation
        PE = (income*persentageOfIncome) * reputation/ (totalReputation)

        endorseDataObj[key] = {
            ...endorseDataObj[key],
            PE: PE
        }

        printC(endorseDataObj,"12","endorseDataObj","g")
        printC(endorseDataObj[key],"12","endorseDataObj[key]","r")

        // update the user
        memberDataNew = await Members.findOneAndUpdate(
            { _id: key },
            {
                $set: {
                    "endorsementsSendStats.unclaimedReward": endorseDataObj[key].endorsementsSendStats.unclaimedReward + PE,
                    "endorsementsSendStats.totalReward": endorseDataObj[key].endorsementsSendStats.totalReward + PE,
                }
            }

        )


    }

    printC(endorseDataObj,"12","endorseDataObj","r")




    // sdf01


}


const addReviewAPIcall = async (fields) => {

    printC(fields,"7","fields","r")


    const query = gql`
    mutation AddReview($fields: addReviewInput) {
        addReview(fields: $fields) {
            userSend {
                _id
                discordName
            }
            userReceive {
                _id
                discordName
            }
            
            reviewMessage
            nodes {
                node {
                    _id
                    name
                }
                confidence
            }
            stars
            income
            createdAt
        }
    }`;

    const variables  = {
        fields: {
            userSendID: fields.userSendID,
            userReceiveID: fields.userReceiveID,
            reviewMessage: fields.reviewMessage,
            stars: fields.stars,
            income: fields.income,
            reviewNodes: fields.endorseNodes,
        }
    };

    res = await request('https://soil-api-backend-kgfromai2.up.railway.app/graphql', query, variables)

    // console.log("res = " , res)

    printC(res.addReview,"7","res","r")

    // df12

    return res.addReview

}


module.exports = {
    sumReview,
    payEndorsersF,addReviewAPIcall,
  };