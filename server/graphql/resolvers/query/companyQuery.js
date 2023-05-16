const { Conversation } = require("../../../models/conversationModel");
const { Company } = require("../../../models/companyModel");


const { ApolloError } = require("apollo-server-express");


module.exports = {
  findCompany: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findCompany > args.fields = ", args.fields);

    if (!_id) throw new ApolloError("ID is required")


    try {

      // find conversaiotn 
      let companyData = await Company.findOne({ _id: _id });
      
      if (!companyData) throw new ApolloError("Company not found")

      console.log("companyData = " , companyData)
      // sdf9

      return companyData;
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findCompany",
        { component: "companyQuery > findCompany" }
      );
    }
  },
  findCompanies: async (parent, args, context, info) => {
    const { _id } = args.fields;
    console.log("Query > findCompanies > args.fields = ", args.fields);

    let searchQuery_and = [];
    let searchQuery = {};


    if (_id) {
      searchQuery_and.push({ _id: _id });
    }

    if (searchQuery_and.length > 0) {
      searchQuery = {
        $and: searchQuery_and,
      };
    } else {
      searchQuery = {};
    }
    try {

      let companyData = await Company.find(searchQuery);

      return companyData;
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "findCompanies",
        { component: "companyQuery > findCompanies" }
      );
    }
  },
  
};
