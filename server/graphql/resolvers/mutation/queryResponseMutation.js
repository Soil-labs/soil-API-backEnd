const { ApolloError } = require("apollo-server-express");

const { QueryResponse } = require("../../../models/queryResponseModel");
const { Conversation } = require("../../../models/conversationModel");


const { addToFilter } = require("../utils/queryResponseModules");

const { PubSub,withFilter } = require("graphql-subscriptions");
const pubsub = new PubSub();


module.exports = {
  updateQueryResponse: async (parent, args, context, info) => {
    const { _id,phase,sentFlag,senderID,senderType,responderID,responderType,question,conversationID,answer } = args.fields;
    console.log("Mutation > updateQueryResponse > args.fields = ", args.fields);

    try {

     const filter = await addToFilter(_id,phase,sentFlag,senderID,senderType,responderID,responderType,question,conversationID,answer)


     // ------------------ Save to MongoDB ------------------
      if (_id) {
        queryResponseData = await QueryResponse.findOne({ _id });

        if (!queryResponseData) {
          queryResponseData = await new QueryResponse(
            filter
          );
        } else {
          // update using the filter
          if (filter.phase) queryResponseData.phase = filter.phase;
          if (filter.sender) queryResponseData.sender = filter.sender;
          if (filter.responder) queryResponseData.responder = filter.responder;
          if (filter.question) queryResponseData.question = filter.question;
          if (filter.answer) queryResponseData.answer = filter.answer;
          if (filter.conversationID) queryResponseData.conversationID = filter.conversationID;
          if (filter.sentFlag != null) queryResponseData.sentFlag = filter.sentFlag;

        }

      } else {
        queryResponseData = await new QueryResponse(
          filter
        );
      }

      await queryResponseData.save();
     // ------------------ Save to MongoDB ------------------



     pubsub.publish("QUERY_RESPONSE_UPDATED", {
        queryResponseUpdated: queryResponseData,
      });

      return queryResponseData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "updateQueryResponse",
        { component: "queryResponseMutation > updateQueryResponse" }
      );
    }
  },
  respondToQuery: async (parent, args, context, info) => {
    const { _id,conversationID } = args.fields;
    console.log("Mutation > respondToQuery > args.fields = ", args.fields);


    queryResponseData = await QueryResponse.findOne({ _id });

    if (!queryResponseData) {
      throw new ApolloError(
        "QueryResponse not found",
        "QUERYRESPONSE_NOT_FOUND",
        { component: "queryResponseMutation > respondToQuery" }
      );
    }

    conversationData = await Conversation.findOne({ _id: conversationID });

    if (!conversationData) {
      throw new ApolloError(
        "Conversation not found",
        "CONVERSATION_NOT_FOUND",
        { component: "queryResponseMutation > respondToQuery" }
      );
    }

    

    try {

     // ------------------ Save to MongoDB ------------------
      const filter = {
        phase: "RESPONDED",
        conversationID: conversationID,
      }

      if (filter.phase) queryResponseData.phase = filter.phase;
      if (filter.conversationID) queryResponseData.conversationID = filter.conversationID;

      await queryResponseData.save();
     // ------------------ Save to MongoDB ------------------


      return queryResponseData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "respondToQuery",
        { component: "queryResponseMutation > respondToQuery" }
      );
    }
  },

  deleteQueryResponse: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Mutation > deleteQueryResponse > args.fields = ", args.fields);


    queryResponseData = await QueryResponse.findOne({ _id });

    if (!queryResponseData) {
      throw new ApolloError(
        "QueryResponse not found",
        "QUERYRESPONSE_NOT_FOUND",
        { component: "queryResponseMutation > deleteQueryResponse" }
      );
    }


    try {

      // ------------------ Save to MongoDB ------------------
      await QueryResponse.deleteOne({ _id });
      // ------------------ Save to MongoDB ------------------


      return queryResponseData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "deleteQueryResponse",
        { component: "queryResponseMutation > deleteQueryResponse" }
      );
    }
  },
  // queryResponseUpdated: {
  //   subscribe: (parent, args, context, info) => {
  //     const memberUpdatedInRoom = pubsub.asyncIterator("QUERY_RESPONSE_UPDATED");

  //     return memberUpdatedInRoom
  //   },
  // },
  queryResponseUpdated: {
    subscribe: withFilter(
      () => pubsub.asyncIterator('QUERY_RESPONSE_UPDATED'),
      (payload, variables) => {
        console.log("payload = " , payload)
        console.log("variables = " , variables)

        let flagFilter = true

        // -------- ID filter ---------
        const IDs = variables?.fields?._id
        if (IDs){
          const id1 = payload.queryResponseUpdated?._id?.toString()
          
          flagFilter = IDs.includes(id1)
          if (!flagFilter) return false
        }
        // -------- ID filter ---------

        // -------- Phase filter ---------
        const phaseVar = variables?.fields?.phase
        if (phaseVar){
          const phase1 = payload.queryResponseUpdated?.phase?.toString()
          
          flagFilter = phaseVar == phase1
          if (!flagFilter) return false
        }
        // -------- Phase filter ---------

        // -------- Sender filter ---------
        const senderID = variables?.fields?.senderID
        const senderType = variables?.fields?.senderType
        if (senderID && senderType){
          const sender_payload = payload.queryResponseUpdated?.sender
          if (senderType == "USER" && sender_payload?.userID){
            const userIDn = sender_payload?.userID?.toString()
            // flagFilter = userIDn.equals( senderID )
            flagFilter = userIDn.toString() ==  senderID.toString()

            if (!flagFilter) return false


          } else if (senderType == "POSITION" && sender_payload?.positionID){
            const positionIDn = sender_payload?.positionID?.toString()
            // flagFilter = positionIDn.equals( senderID )
            flagFilter = positionIDn.toString() ==  senderID.toString()

            if (!flagFilter) return false

          }  else {
            return false
          }

        }
        // -------- Sender filter ---------

        // -------- Responder filter ---------
        const responderID = variables?.fields?.responderID
        const responderType = variables?.fields?.responderType
        console.log("change = 0" )
        if (responderID && responderType){
          console.log("change = 1" )
          const responder_payload = payload.queryResponseUpdated?.responder
          if (responderType == "USER" && responder_payload?.userID){
          console.log("change = 2" )
            const userIDn = responder_payload?.userID?.toString()
            // flagFilter = userIDn.equals( responderID )
            flagFilter = userIDn.toString() ==  responderID.toString()

            if (!flagFilter) return false


          } else if (responderType == "POSITION" && responder_payload?.positionID){
            console.log("change = 3" )
            const positionIDn = responder_payload?.positionID?.toString()
            console.log("positionIDn = " , positionIDn)
            flagFilter = positionIDn.toString() ==  responderID.toString()
            if (!flagFilter) return false

          } else {
            return false
          }

        }
        // -------- Responder filter ---------


        return (flagFilter);
      },
    ),
  },

};
