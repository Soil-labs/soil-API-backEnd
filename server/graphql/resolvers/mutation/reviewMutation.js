const { Members } = require("../../../models/membersModel");
const { Node } = require("../../../models/nodeModal");
const { Review } = require("../../../models/reviewModel");


const {sumReview,payEndorsers} = require("../utils/reviewModules");
const {useGPTchatSimple} = require("../utils/aiModules");


const { ApolloError } = require("apollo-server-express");




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
        Members.findOne({ _id: userReceiveID }).select('_id name reviewsReceive reviewsSend reviewSummary'),
      ]);

      if (!userReceiveData) throw new ApolloError("The endorsee record missing");
      if (!userSendData) throw new ApolloError("The endorser record missing");

      if (payEndorsers == true && income && income != 0){

      }


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

      return reviewData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "addReview",
        { component: "memberMutation > addReview" }
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
