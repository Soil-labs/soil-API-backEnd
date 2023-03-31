const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Endorsement } = require("../../../models/endorsementModel");
const { EndorsementLink } = require("../../../models/endorsementLinkModel");

const axios = require("axios");

const {
  sumEndorsement,
  arrayToObj,
  checkEndorseNodes,
  addEndorsementAPIcall,
} = require("../utils/endorsementModules");
const { useGPTchatSimple } = require("../utils/aiModules");
const { updateNodeToMemberOnNeo4J } = require("../utils/nodeModules");

const { combineResolvers } = require("graphql-resolvers");
const { IsAuthenticated } = require("../../../utils/authorization");

const { PineconeClient } = require("@pinecone-database/pinecone");
const { ApolloError } = require("apollo-server-express");

const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const { printC } = require("../../../printModule");

module.exports = {
  addEndorsement: async (parent, args, context, info) => {
    const {
      userSendID,
      userReceiveID,
      endorsementMessage,
      discussion,
      stars,
      endorseNodes,
      stake,
    } = args.fields;
    console.log("Mutation > addEndorsement > args.fields = ", args.fields);
    // asdf34

    if (endorsementMessage && discussion) {
      throw new ApolloError(
        "You should either give the message, or the discussion as input, not both "
      );
    }
    try {
      if (!userReceiveID || !userSendID)
        throw new Error("The endorsee, endorser is required🔥");

      //verify if the endorser and endorsee exist
      let [userSendData, userReceiveData] = await Promise.all([
        Members.findOne({ _id: userSendID }).select(
          "_id name nodes endorsementsReceive endorsementsSend endorseSummary"
        ),
        Members.findOne({ _id: userReceiveID }).select(
          "_id name nodes endorsementsReceive endorsementsSend endorseSummary"
        ),
      ]);

      if (!userReceiveData)
        throw new ApolloError("The endorsee record missing");
      if (!userSendData) throw new ApolloError("The endorser record missing");

      userSendNodeObj = await arrayToObj(userSendData.nodes);

      let newEndorsement = {
        userSend: userSendID,
        userReceive: userReceiveID,
        createdAt: new Date(),
      };

      if (stars) newEndorsement.stars = stars;

      if (endorsementMessage) {
        newEndorsement.endorsementMessage = endorsementMessage;
      } else if (discussion) {
        // -------------- Prompt of the conversation ------------
        let prompt_discussion = "Endorcment conversation:";
        let roleN;
        for (let i = 0; i < discussion.length; i++) {
          roleN = "Endorser";
          if (discussion[i].role == "assistant") roleN = "Recruiter";
          prompt_discussion =
            prompt_discussion + "\n" + roleN + ": " + discussion[i].content;
        }
        prompt_summary = "";
        prompt_summary += prompt_discussion;

        prompt_summary =
          prompt_summary +
          "\n\n" +
          "Summarize the endorsement in 2 sentenses given in this conversation in two sentences, Write it like the endorser is talking:";
        console.log("prompt_summary = ", prompt_summary);
        // -------------- Prompt of the conversation ------------
        let summaryGPT = await useGPTchatSimple(prompt_summary);

        console.log("summaryGPT = ", summaryGPT);

        newEndorsement.endorsementMessage = summaryGPT;
      }

      newEndorsement = await checkEndorseNodes(
        endorseNodes,
        newEndorsement,
        userSendNodeObj
      );

      newEndorsement.discussion = discussion;

      if (userSendID) newEndorsement.endorser = userSendID;

      if (stake) newEndorsement.stake = stake;

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
      newEndorsement.arweaveTransactionID = "https://www.arweave.org/";
      // ----------- Save to Arweave ------------

      const endorsementData = await Endorsement.create(newEndorsement);

      endorsementData.save();

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

      let res = await sumEndorsement(userReceiveData);
      endorseUpdate = res.endorseUpdate;
      nodesEndorserTrustObj = res.nodesEndorserTrustObj;
      totalTrust = res.totalTrust;

      // console.log("nodesEndorserTrustObj = " , nodesEndorserTrustObj)
      // printC("This is the res","2","totalTrust","b")

      // printC(nodesEndorserTrustObj,"6","nodesEndorserTrustObj","b")

      // printC(totalTrust,"3","totalTrust","r")
      // printC(userReceiveData.nodes,"2","userReceiveData.nodes","b")

      for (let i = 0; i < userReceiveData.nodes.length; i++) {
        let nodeN = userReceiveData.nodes[i];

        // printC(nodeN._id,"5","nodeN._id","y")
        if (nodesEndorserTrustObj[nodeN._id]) {
          nodesEndorserTrustObj[nodeN._id].Applied = true;

          if (userReceiveData.nodes[i].trust) {
            userReceiveData.nodes[i].trust.totalTrust =
              nodesEndorserTrustObj[nodeN._id].trustNodeTotal;
            userReceiveData.nodes[i].trust.endorseTrust =
              nodesEndorserTrustObj[nodeN._id].trustNodeTotal;
          } else {
            userReceiveData.nodes[i].trust = {};
            userReceiveData.nodes[i].trust.totalTrust =
              nodesEndorserTrustObj[nodeN._id].trustNodeTotal;
            userReceiveData.nodes[i].trust.endorseTrust =
              nodesEndorserTrustObj[nodeN._id].trustNodeTotal;
          }
        }
      }
      // printC(userReceiveData.nodes,"4","userReceiveData.nodes","b")

      // asdf01
      // ----------- Test if all endorsed Nodes exist on user nodes ------------
      // if they don't exist create them
      for (key in nodesEndorserTrustObj) {
        if (nodesEndorserTrustObj[key].Applied != true) {
          let newEndorseNode = {
            _id: key,
            trust: {
              totalTrust: nodesEndorserTrustObj[key].trustNodeTotal,
              endorseTrust: nodesEndorserTrustObj[key].trustNodeTotal,
            },
          };
          userReceiveData.nodes.push(newEndorseNode);

          nodeData = await Node.findOne({ _id: key }).select("_id name node");

          // printC(nodeData,"12","nodeData","p")

          // sf00f

          updateNodeToMemberOnNeo4J(nodeData, userReceiveID);
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
            totalNodeTrust: totalTrust,
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
            endorsementsSend: userSendData.endorsementsSend,
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
  createFakeEndorsement: async (parent, args, context, info) => {
    const { userSendID, userReceiveID } = args.fields;
    console.log(
      "Mutation > createFakeEndorsement > args.fields = ",
      args.fields
    );

    try {
      // ----------- find send receive Endorsement ------------
      let userSendData = null;
      let userReceiveData = null;

      if (userSendID) {
        userSendData = await Members.findOne({ _id: userSendID }).select(
          "_id discordName nodes"
        );

        if (!userSendData) throw new Error("userSendID not found");
      }

      if (userReceiveID) {
        userReceiveData = await Members.findOne({ _id: userReceiveID }).select(
          "_id discordName nodes"
        );

        if (!userReceiveData) throw new Error("userReceiveID not found");
      }

      if (userSendData == null || userReceiveData == null) {
        usersAll = await Members.find().select("_id discordName nodes");

        printC(usersAll.slice(0, 3), "1", "usersAll", "r");
        // dsf9

        while (userSendData == null) {
          randomUserIndex = Math.floor(Math.random() * usersAll.length);
          userSendData = usersAll[randomUserIndex];

          if (userSendData.nodes.length == 0) {
            userSendData = null;
          }
        }
        usersAll.splice(randomUserIndex, 1);

        // TODO -> Fix getting users with no nodes
        while (userReceiveData == null) {
          randomUserIndex = Math.floor(Math.random() * usersAll.length);
          userReceiveData = usersAll[randomUserIndex];

          if (userReceiveData.nodes.length == 0) {
            userReceiveData = null;
          }
        }
      }

      printC(userSendData, "1", "userSendData", "b");
      printC(userReceiveData, "2", "userReceiveData", "b");
      // ----------- find send receive Endorsement ------------

      // --------- choose random nodes ----------
      // choose random userSendData.nodes or userReceiveData.nodes
      let randomUser = Math.floor(Math.random() * 2);
      let randomUserNodes = null;
      if (randomUser == 0) {
        randomUserNodes = userSendData.nodes;
      } else {
        randomUserNodes = userReceiveData.nodes;
      }

      // choose random 1-2 nodes to use
      let randomNodes = Math.floor(Math.random() * 2) + 1;
      let randomNodesArray = [];
      for (let i = 0; i < randomNodes; i++) {
        let randomNodeIndex = Math.floor(
          Math.random() * randomUserNodes.length
        );
        randomNodesArray.push(randomUserNodes[randomNodeIndex]._id);
      }

      printC(randomNodesArray, "3", "randomNodesArray", "p");

      let nodeData = await Node.find({ _id: randomNodesArray }).select(
        "_id name node"
      );

      printC(nodeData, "4", "nodeData", "g");

      endorseNodes = [];

      for (let i = 0; i < nodeData.length; i++) {
        endorseNodes.push({
          nodeID: nodeData[i]._id,
        });
      }

      printC(endorseNodes, "5", "endorseNodes", "g");
      // --------- choose random nodes ----------

      // // -------- create message based Nodes -----------

      // // organise the names of the nodes from nodeData to be used as a prompt for GPT
      let prompt_nodes = "Skills of user: ";
      for (let i = 0; i < nodeData.length; i++) {
        prompt_nodes += nodeData[i].name + ", ";
      }
      prompt_nodes = prompt_nodes.slice(0, -2);

      prompt_nodes += "\n\n";

      printC(prompt_nodes, "5", "prompt_nodes", "y");

      prompt_summary =
        "Summarize the endorsement in 2 sentenses given the skills of the user \n\n";
      prompt_summary += prompt_nodes;

      printC(prompt_summary, "6", "prompt_summary", "y");

      let summaryGPT = await useGPTchatSimple(prompt_summary);

      // summaryGPT = " The user is highly skilled in deep learning and has a strong understanding of its applications. They would be an asset to any team or project that involves deep learning technology."

      printC(summaryGPT, "7", "summaryGPT", "y");
      // // -------- create message based Nodes -----------

      // -------- choose random stars and stake --------
      let randomStars = Math.floor(Math.random() * 3) + 3;
      let randomStake = Math.floor(Math.random() * 100) + 1;
      // -------- choose random stars and stake --------

      const fields = {
        userSendID: userSendData._id,
        userReceiveID: userReceiveData._id,
        endorsementMessage: summaryGPT,
        stars: randomStars,
        stake: randomStake,
        endorseNodes: endorseNodes,
        createdAt: new Date(),
      };

      let newEndorsement = await addEndorsementAPIcall(fields);

      newEndorsement = {
        ...newEndorsement,
        endorseNodes: endorseNodes,
      };

      //   const query = gql`
      //   query FindNodes($fields: findNodesInput) {
      //         findNodes(fields: $fields) {
      //           _id
      //           name
      //           node
      //         }
      //       }
      // `;

      // const variables  = {
      //   fields: {
      //     _id: "6416ae1148d9ba5ceefb68a1"
      //   }
      //   };

      // res = await request('https://soil-api-backend-kgfromai2.up.railway.app/graphql', query, variables)

      // console.log("res = " , res)

      return newEndorsement;
      // return fields
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "createFakeEndorsement",
        { component: "endorsementMutation > createFakeEndorsement" }
      );
    }
  },
  findEndorsements: async (parent, args, context, info) => {
    const { endorsementsID, userSend, userReceive } = args.fields;
    console.log("Mutation > findEndorsements > args.fields = ", args.fields);

    if (userSend && userReceive)
      throw new Error("Cannot search both userSend and userReceive");

    try {
      let endorsementsData = [];

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
        { component: "endorsementMutation > findEndorsements" }
      );
    }
  },
  createEndorsementLink: combineResolvers(
    IsAuthenticated,
    async (parent, args, { user }, info) => {
      const { message, nodesID } = args.fields;
      console.log(
        "Mutation > createEndorsementLink > args.fields = ",
        args.fields
      );

      console.log("user = ", user);

      if (!nodesID)
        throw new ApolloError(
          "you need to use nodesID or nodesID_level, you cant use both"
        );

      try {
        let endorsementLinkData;
        // let nodesData = await Node.find({ _id: nodesID }).select(
        //   "_id name node match_v2_update"
        // );

        // ---------- All nodes should be equal to nodeType or else throw error -----------
        // nodesID_array = [];
        // nodesData.forEach((node) => {
        //   nodesID_array.push(node._id.toString());
        //   if (node.node != nodeType) {
        //     throw new ApolloError(
        //       "All nodes should be equal to nodeType, problem on nodeID = " +
        //         node._id +
        //         " with name = " +
        //         node.name +
        //         " and node = " +
        //         node.node +
        //         ""
        //     );
        //   }
        // });

        // console.log("nodesData = ", nodesData);

        const fields = {
          message: message,
          memberID: user._id,
          // nodes: [],
          nodes: nodesID,
          createdAt: new Date(),
        };

        // return fields;

        endorsementLinkData = await new EndorsementLink(fields);
        endorsementLinkData.save();

        return endorsementLinkData;
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "createEndorsementLink",
          { component: "endorsementMutation > createEndorsementLink" }
        );
      }
    }
  ),
};
