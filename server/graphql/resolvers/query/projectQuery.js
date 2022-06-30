
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findProject: async (parent, args, context, info) => {
   
    const {tagName,_id} = args.fields;

    try {


      let projectData

      if (tagName){
        projectData = await Projects.findOne({ tagName: tagName })
      } else if (_id){
        projectData = await Projects.findOne({ _id: _id })
      } else {
        return {}
      }


      // if (tagName) {
      //   console.log("change =1 ")
      //   projectData = await Projects.find({ tagName: tagName })
      // } else {
      //   return {}
      // }


      return projectData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill", user: req.user.id }
      );
    }
  },
  findProjects: async (parent, args, context, info) => {
   
    const {tagName} = args.fields;

    

    try {


      let projectsData
      if (tagName) {
        console.log("change =1 ")
        projectsData = await Projects.find({ tagName: tagName })
      } else {
        console.log("change =2 ")

        projectsData = await Projects.find({})
      }
      console.log("projectsData = " , projectsData)


      


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
