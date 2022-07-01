const { Projects } = require("../../../models/projectsModel");
const { Tweet } = require("../../../models/tweetsModel");
const { Members } = require("../../../models/membersModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findMember: async (parent, args, context, info) => {
       
    const {_id} = args.fields;

    if (!_id) {
      throw new ApolloError("No id provided");
    }

    
    try {

      let memberData = await Members.findOne({ _id: _id })
      


      console.log("memberData = " , memberData)

      return memberData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

  findMembers: async (parent, args, context, info) => {
       
    const {_id} = args.fields;

    
    try {

      let membersData
      if (_id){
        membersData = await Members.find({ _id: _id })
        console.log("membersData = " , membersData)
      } else{
        membersData = await Members.find({})
      }


      console.log("membersData = " , membersData)

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  

  
  
};
