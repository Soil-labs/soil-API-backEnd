const { ServerTemplate } = require("../../../models/serverModel");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findServers: async (parent, args, context, info) => {
   
    const {_id} = args.fields;

    try {

      let serverData

      if (_id) {
        serverData = await ServerTemplate.find({ _id: _id })
      } else {
        serverData = await ServerTemplate.find({})
      }

   


      return serverData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
