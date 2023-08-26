const { QueryResponse } = require("../../../models/queryResponseModel");
const { Company } = require("../../../models/companyModel");

const { ApolloError } = require("apollo-server-express");

module.exports = {
  findQueryResponses: async (parent, args, context, info) => {
    const {  _id,senderID,senderType,responderID,responderType,phase,sentFlag } = args.fields;
    console.log("Query > findQueryResponses > args.fields = ", args.fields);

    
    try {

      let searchQuery_and = [];
      let searchQuery = {};
  

      if (_id) {
        searchQuery_and.push({ _id: _id });
      }
      if (senderID && senderType) {
        if (senderType == "USER") searchQuery_and.push({ "sender.userID": senderID });
        else if (senderType == "POSITION") searchQuery_and.push({ "sender.positionID": senderID });
      }

      if (responderID && responderType) {
        if (responderType == "USER") searchQuery_and.push({ "responder.userID": responderID });
        else if (responderType == "POSITION") searchQuery_and.push({ "responder.positionID": responderID });
      }

      if (phase) {
        searchQuery_and.push({ phase: phase });
      }

      if (sentFlag == true) {
        searchQuery_and.push({ sentFlag: sentFlag });
      } else if (sentFlag == false) {
        searchQuery_and.push({ sentFlag: { $ne: true } });
      }
      

      console.log("searchQuery_and = " , searchQuery_and)

      if (searchQuery_and.length > 0) {
        searchQuery = {
          $and: searchQuery_and,
        };
      } else {
        searchQuery = {};
      }

      let queryResponseData = await QueryResponse.find(searchQuery);



      return queryResponseData;
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findQueryResponses",
        { component: "companyQuery > findQueryResponses" }
      );
    }
  },
 
};
