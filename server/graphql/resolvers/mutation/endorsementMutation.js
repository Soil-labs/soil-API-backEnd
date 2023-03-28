const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Endorsement } = require("../../../models/endorsementModel");


const {sumEndorsement,arrayToObj,checkEndorseNodes} = require("../utils/endorsementModules");
const {useGPTchatSimple} = require("../utils/aiModules");
const {updateNodeToMemberOnNeo4J} = require("../utils/nodeModules");


const { PineconeClient } = require("@pinecone-database/pinecone");
const { ApolloError } = require("apollo-server-express");

const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const {printC} = require("../../../printModule")


module.exports = {
  addEndorsement: async (parent, args, context, info) => {
    const { userSendID, userReceiveID, endorsementMessage, discussion,stars,endorseNodes,stake } = args.fields;
    console.log("Mutation > addEndorsement > args.fields = ", args.fields);
    // asdf34

    if (endorsementMessage && discussion) {
      throw new ApolloError(
        "You should either give the message, or the discussion as input, not both "
      );
    }
    try {
      if (!userReceiveID || !userSendID)
        throw new Error(
          "The endorsee, endorser is required🔥"
        );

      //verify if the endorser and endorsee exist
      let [userSendData, userReceiveData] = await Promise.all([
        Members.findOne({ _id: userSendID }).select('_id name nodes endorsementsReceive endorsementsSend endorseSummary'),
        Members.findOne({ _id: userReceiveID }).select('_id name nodes endorsementsReceive endorsementsSend endorseSummary'),
      ]);

      if (!userReceiveData) throw new ApolloError("The endorsee record missing");
      if (!userSendData) throw new ApolloError("The endorser record missing");

      
      userSendNodeObj = await arrayToObj(userSendData.nodes)

      
      


      let newEndorsement = {
        userSend: userSendID,
        userReceive: userReceiveID,
        createdAt: new Date(),
      }

      if (stars) newEndorsement.stars = stars

      if (endorsementMessage){
        newEndorsement.endorsementMessage = endorsementMessage
      } else if (discussion) {
        // -------------- Prompt of the conversation ------------
        let prompt_discussion = "Endorcment conversation:";
        let roleN
        for (let i = 0; i < discussion.length; i++) {
          roleN = "Endorser"
          if (discussion[i].role == "assistant") roleN = "Recruiter"
          prompt_discussion = prompt_discussion + "\n" + roleN + ": " + discussion[i].content;

        }
        prompt_summary=""
        prompt_summary += prompt_discussion 

        prompt_summary = prompt_summary + "\n\n" + "Summarize the endorsement in 2 sentenses given in this conversation in two sentences, Write it like the endorser is talking:"
        console.log("prompt_summary = " , prompt_summary)
        // -------------- Prompt of the conversation ------------
        let summaryGPT = await useGPTchatSimple(prompt_summary)

        console.log("summaryGPT = " , summaryGPT)

        newEndorsement.endorsementMessage = summaryGPT
      }


      newEndorsement = await checkEndorseNodes(endorseNodes,newEndorsement,userSendNodeObj)
      
      
      newEndorsement.discussion = discussion

      if (userSendID) newEndorsement.endorser = userSendID

      if (stake) newEndorsement.stake = stake

      // ----------- Save to Arweave ------------
      // const fileObject = {
      //   endorserDiscordName: userSendData.discordName,
      //   endorseeDiscordName: userReceiveData.discordName,
      //   message: endorsementMessage,
      // };

      //const transactionId = await uploadFileToArweave(fileObject);
      // if (!transactionId)
      //   throw new Error(
      //     "No transactionID, check your env if Arweave token is included"
      //   );
      // //save the endorsement to the member
      newEndorsement.arweaveTransactionID = "https://www.arweave.org/"
      // ----------- Save to Arweave ------------

      



      const endorsementData = await Endorsement.create(newEndorsement);

      endorsementData.save()


      console.log("userReceiveData?.endorsementsReceive = " , userReceiveData?.endorsementsReceive)

      // console.log("change = " , change)

      if (userReceiveData?.endorsementsReceive?.length > 0) {
        userReceiveData.endorsementsReceive.push(endorsementData._id);
      } else {
        userReceiveData.endorsementsReceive = [endorsementData._id];
      }

      if (userSendData?.endorsementsSend?.length > 0) {
        userSendData.endorsementsSend.push(endorsementData._id);
      } else {
        userSendData.endorsementsSend = [endorsementData._id];
      }

      let res = await sumEndorsement(userReceiveData)
      endorseUpdate = res.endorseUpdate
      nodesEndorserTrustObj = res.nodesEndorserTrustObj
      totalTrust = res.totalTrust

      // console.log("nodesEndorserTrustObj = " , nodesEndorserTrustObj)
      // printC("This is the res","2","totalTrust","b")

      printC(nodesEndorserTrustObj,"6","nodesEndorserTrustObj","b")


      printC(totalTrust,"3","totalTrust","r")
      printC(userReceiveData.nodes,"2","userReceiveData.nodes","b")

      for (let i = 0; i < userReceiveData.nodes.length; i++) {
        let nodeN = userReceiveData.nodes[i]

        printC(nodeN._id,"5","nodeN._id","y")
        if (nodesEndorserTrustObj[nodeN._id]){
          printC("","8","I am in ","y")

          nodesEndorserTrustObj[nodeN._id].Applied = true


          if (userReceiveData.nodes[i].trust){
            userReceiveData.nodes[i].trust.totalTrust = nodesEndorserTrustObj[nodeN._id].trustNodeTotal
            userReceiveData.nodes[i].trust.endorseTrust = nodesEndorserTrustObj[nodeN._id].trustNodeTotal
          } else {
            userReceiveData.nodes[i].trust = {}
            userReceiveData.nodes[i].trust.totalTrust = nodesEndorserTrustObj[nodeN._id].trustNodeTotal
            userReceiveData.nodes[i].trust.endorseTrust = nodesEndorserTrustObj[nodeN._id].trustNodeTotal
          }
        }
      }
      printC(userReceiveData.nodes,"4","userReceiveData.nodes","b")

      // asdf01
      // ----------- Test if all endorsed Nodes exist on user nodes ------------
      // if they don't exist create them
      for (key in nodesEndorserTrustObj) {
        if (nodesEndorserTrustObj[key].Applied != true){
          let newEndorseNode = {
            _id: key,
            trust: {
              totalTrust: nodesEndorserTrustObj[key].trustNodeTotal,
              endorseTrust: nodesEndorserTrustObj[key].trustNodeTotal
            }
          }
          userReceiveData.nodes.push(newEndorseNode)

          nodeData = await Node.findOne({ _id: key }).select("_id name node");

          printC(nodeData,"12","nodeData","p")


          // sf00f
          
          updateNodeToMemberOnNeo4J(nodeData,userReceiveID)
        }
      }
      // ----------- Test if all endorsed Nodes exist on user nodes ------------


      userReceiveData = await Members.findOneAndUpdate(
        {
          _id: userReceiveID,
        },
        {
          $set: { 
            endorsementsReceive: userReceiveData.endorsementsReceive,
            ...endorseUpdate,
            nodes: userReceiveData.nodes,
            totalNodeTrust: totalTrust 
          },
        },
        {
          new: true,
        }
      );

      userSendData = await Members.findOneAndUpdate(
        {
          _id: userSendID,
        },
        {
          $set: {
            endorsementsSend: userSendData.endorsementsSend
          },
        },
        {
          new: true,
        }
      );

      return endorsementData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addEndorsement",
        { component: "memberMutation > addEndorsement" }
      );
    }
  },
  findEndorsements: async (parent, args, context, info) => {
    const { endorsementsID,userSend,userReceive} = args.fields;
    console.log("Mutation > findEndorsements > args.fields = ", args.fields);

    if (userSend && userReceive) throw new Error("Cannot search both userSend and userReceive")

    try {
      let endorsementsData = []

      if (userSend) {
        endorsementsData = await Endorsement.find({ userSend: userSend });
        return endorsementsData;
      }

      if (userReceive) {
        endorsementsData = await Endorsement.find({ userReceive: userReceive });
        return endorsementsData;
      }

      if (!endorsementsID) {
        endorsementsData = await Endorsement.find();
        return endorsementsData;
      } else {
        endorsementsData = await Endorsement.find({ _id: endorsementsID });
        return endorsementsData;
      }
      
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findEndorsements",
        { component: "memberMutation > findEndorsements" }
      );
    }
  },
};
