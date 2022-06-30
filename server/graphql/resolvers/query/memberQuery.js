const { Projects } = require("../../../models/projectsModel");
const { Tweet } = require("../../../models/tweetsModel");
const { Members } = require("../../../models/membersModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findMember: async (parent, args, context, info) => {
       
    const {discordName,_id} = args.fields;

    
    try {

      let memberData
      if (discordName){
        memberData = await Members.findOne({ discordName: discordName })
      } else if (_id){
        memberData = await Members.findOne({ _id: _id })
      }


      // console.log("memberData = " , memberData)

      return memberData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember", user: req.user.id }
      );
    }
  },

  findMembers: async (parent, args, context, info) => {
       
    const {discordName} = args.fields;

    console.log("discordName = " , discordName)
    
    try {

      let membersData
      if (discordName){
        membersData = await Members.find({ discordName: discordName })
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
        { component: "tmemberQuery > findMember", user: req.user.id }
      );
    }
  },
  

  
  
};
