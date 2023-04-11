const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Review } = require("../../../models/reviewModel");


const {sumReview,payEndorsersF,addReviewAPIcall} = require("../utils/reviewModules");
const {useGPTchatSimple} = require("../utils/aiModules");


const { ApolloError } = require("apollo-server-express");

const { printC } = require("../../../printModule");



module.exports = {
  addReview: async (parent, args, context, info) => {
    const { userSendID, userReceiveID, reviewMessage, discussion,stars,reviewNodes,income,payEndorsers } = args.fields;
    console.log("Mutation > addReview > args.fields = ", args.fields);
    // asdf34

    if (reviewMessage && discussion) {
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
        Members.findOne({ _id: userSendID }).select('_id name reviewsReceive reviewsSend reviewSummary'),
        Members.findOne({ _id: userReceiveID }).select('_id name reviewsReceive reviewsSend endorsementsReceive reviewSummary'),
      ]);

      if (!userReceiveData) throw new ApolloError("The endorsee record missing");
      if (!userSendData) throw new ApolloError("The endorser record missing");

      


      let newReview = {
        userSend: userSendID,
        userReceive: userReceiveID,
        createdAt: new Date(),
      }


      

      if (stars) newReview.stars = stars

      if (reviewMessage){
        newReview.reviewMessage = reviewMessage
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

        newReview.reviewMessage = summaryGPT
      }

      console.log("change = 2" )

      if (reviewNodes) {
        // reviewNodes only take the nodeID and put them on mongoDB
        let endorseNodesIDArr = []
        let endorseNodesObj = {}
        for (let i = 0; i < reviewNodes.length; i++) {
          if (!endorseNodesObj[reviewNodes[i].nodeID]) {
            endorseNodesObj[reviewNodes[i].nodeID] = reviewNodes[i]
            endorseNodesIDArr.push(reviewNodes[i].nodeID)
          }
        }

        nodeData = await Node.find({ _id: endorseNodesIDArr }).select('_id name')

        // console.log("nodeData = " , nodeData)

        nodesSave = []
        for (let i = 0; i < nodeData.length; i++) {
          
          // console.log("nodeData[i]._id = " , nodeData[i]._id)
          endorseNodesObj[nodeData[i]._id] = {
            ...endorseNodesObj[nodeData[i]._id],
            ...nodeData[i]._doc
          }
          nodesSave.push(endorseNodesObj[nodeData[i]._id])
          // SOS 🆘 -> This is the place that you update the profile of the user for the Node and you make it more trust worthy this specific node
        }

        newReview.reviewNodes = nodesSave
        newReview.discussion = discussion
      }
      console.log("change = 3" )

      // console.log("newReview = " , newReview)
      // sadf32

      if (userSendID) newReview.endorser = userSendID

      if (income) newReview.income = income

      // ----------- Save to Arweave ------------
      // const fileObject = {
      //   endorserDiscordName: userSendData.discordName,
      //   endorseeDiscordName: userReceiveData.discordName,
      //   message: reviewMessage,
      // };

      //const transactionId = await uploadFileToArweave(fileObject);
      // if (!transactionId)
      //   throw new Error(
      //     "No transactionID, check your env if Arweave token is included"
      //   );
      // //save the endorsement to the member
      newReview.arweaveTransactionID = "https://www.arweave.org/"
      // ----------- Save to Arweave ------------

      
      console.log("change = 3.1" )
      
      reviewUpdateSum = await sumReview(userReceiveData, newReview)
      console.log("reviewUpdateSum = " , reviewUpdateSum)
      // sdf92


      const reviewData = await Review.create(newReview);

      reviewData.save()


      console.log("change = 3.2",userReceiveData )
      console.log("change = 3.5",userSendData )
      // console.log("userReceiveData?.reviewsReceive = " , userReceiveData?.reviewsReceive)

      // console.log("change = " , change)

      if (userReceiveData?.reviewsReceive?.length > 0) {
        userReceiveData.reviewsReceive.push(reviewData._id);
      } else {
        userReceiveData.reviewsReceive = [reviewData._id];
      }

      if (userSendData?.reviewsSend?.length > 0) {
        userSendData.reviewsSend.push(reviewData._id);
      } else {
        userSendData.reviewsSend = [reviewData._id];
      }

      console.log("change = 4" )



      userReceiveData = await Members.findOneAndUpdate(
        {
          _id: userReceiveID,
        },
        {
          $set: { 
            reviewsReceive: userReceiveData.reviewsReceive,
            ...reviewUpdateSum
          },
        },
        {
          new: true,
        }
      );

      console.log("change = 5" )

      userSendData = await Members.findOneAndUpdate(
        {
          _id: userSendID,
        },
        {
          $set: {
            reviewsSend: userSendData.reviewsSend
          },
        },
        {
          new: true,
        }
      );


      if (payEndorsers == true && income && income != 0){
        await payEndorsersF(userReceiveData, income)
        // sdf11
      }

      return reviewData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addReview",
        { component: "memberMutation > addReview" }
      );
    }
  },
  createFakeReview: async (parent, args, context, info) => {
    const { userSendID, userReceiveID,payEndorsers } = args.fields;
    console.log(
      "Mutation > createFakeReview > args.fields = ",
      args.fields
    );

    try {
      // ----------- find send receive Review ------------
      let userSendData = null;
      let userReceiveData = null;

      if (userSendID) {
        userSendData = await Members.findOne({ _id: userSendID }).select(
          "_id discordName nodes"
        );

        if (!userSendData) throw new Error("userSend not found");
      }

      if (userReceiveID) {
        userReceiveData = await Members.findOne({ _id: userReceiveID }).select(
          "_id discordName nodes"
        );

        if (!userReceiveData) throw new Error("userReceive not found");
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
      // df0
      // ----------- find send receive Review ------------

      // --------- choose random nodes ----------
      // choose random userSendData.nodes or userReceiveData.nodes
      let randomUser = Math.floor(Math.random() * 2);
      let randomUserNodes = null;
      if (randomUser == 0) {
        randomUserNodes = userSendData.nodes;
      } else {
        randomUserNodes = userReceiveData.nodes;
      }
      console.log("change = start" , randomUserNodes )

      // choose random 1-2 nodes to use
      let randomNodes = Math.floor(Math.random() * 2) + 1;
      let randomNodesArray = [];
      for (let i = 0; i < randomNodes; i++) {
        let randomNodeIndex = Math.floor(
          Math.random() * randomUserNodes.length
        );
        if (randomUserNodes[randomNodeIndex]?._id){
          randomNodesArray.push(randomUserNodes[randomNodeIndex]._id);
        }
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
      // sf2
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
        "Summarize the review of a manager to the freelancer in 2 sentenses given the skills of the user \n Talk like the manager: \n\n";
      prompt_summary += prompt_nodes;

      printC(prompt_summary, "6", "prompt_summary", "y");

      let summaryGPT = await useGPTchatSimple(prompt_summary);

      // summaryGPT = " The user is highly skilled in deep learning and has a strong understanding of its applications. They would be an asset to any team or project that involves deep learning technology."

      printC(summaryGPT, "7", "summaryGPT", "y");
      // // -------- create message based Nodes -----------

      // -------- choose random stars and stake --------
      let randomStars = Math.floor(Math.random() * 3) + 3;
      let randomIncome = Math.floor(Math.random() * 3000) + 200;
      // -------- choose random stars and stake --------

      let payEndorsersT = payEndorsers
      if (!payEndorsers) payEndorsersT = false

      const fields = {
        userSendID: userSendData._id,
        userReceiveID: userReceiveData._id,
        reviewMessage: summaryGPT,
        stars: randomStars,
        income: randomIncome,
        endorseNodes: endorseNodes,
        createdAt: new Date(),
        payEndorsers: payEndorsers,
      };

      let newReview = await addReviewAPIcall(fields);

      newReview = {
        ...newReview,
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

      return newReview;
      // return fields
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "createFakeReview",
        { component: "reviewMutation > createFakeReview" }
      );
    }
  },
  findReviews: async (parent, args, context, info) => {
    const { reviewsID,userSend,userReceive} = args.fields;
    console.log("Mutation > findReviews > args.fields = ", args.fields);

    if (userSend && userReceive) throw new Error("Cannot search both userSend and userReceive")

    // if (!reviewsID) throw new Error("Must have a reviewsID even as null")
    

    try {
      let reviewsData = []

      if (userSend) {
        reviewsData = await Review.find({ userSend: userSend });
        return reviewsData;
      }

      if (userReceive) {
        reviewsData = await Review.find({ userReceive: userReceive });
        return reviewsData;
      }

      if (!reviewsID) {
        reviewsData = await Review.find();
        return reviewsData;
      } else {
        reviewsData = await Review.find({ _id: reviewsID });
        return reviewsData;
      }
      
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findReviews",
        { component: "memberMutation > findReviews" }
      );
    }
  },
};
