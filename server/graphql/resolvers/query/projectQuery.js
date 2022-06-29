
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findProjects: async (parent, args, context, info) => {
   
    // const {tagName} = args.fields;

    // let fields = {
    // };

    // if (tagName) fields = { ...fields, tagName };

    // console.log("fields = " , fields)
    

    try {
      // let membersData
      // if (tagName) {
      //   console.log("change =1 ")
      //   membersData = await Skills.find({ tagName: fields.tagName })
      // } else {
      //   console.log("change =2 ")

      //   membersData = await Skills.find({})
      //   console.log("membersData = " , membersData)
      // }

      projectsData = await Projects.find({})

      


      return projectsData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill", user: req.user.id }
      );
    }
  },
  
  
};
