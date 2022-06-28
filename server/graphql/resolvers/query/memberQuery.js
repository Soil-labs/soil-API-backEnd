const { Projects } = require("../../../models/projectsModel");
const { Tweet } = require("../../../models/tweetsModel");
const { Members } = require("../../../models/membersModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findMember: async (parent, args, context, info) => {
   

    const {discordName,discordID,discordAvatar} = args.fields;

    let fields = {
      discordName,
      discordID,
      discordAvatar,
      registeredAt: new Date(),
    };

    

    
    try {

      let membersData = await Members.find({ discordName: fields.discordName })


      if (!membersData || membersData.length==0 ){
        membersData = await new Members(fields);
        
        membersData.save()

        membersData = [membersData]
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
