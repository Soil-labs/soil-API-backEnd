
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findProject: async (parent, args, context, info) => {
   
    const {_id} = args.fields;

    if (!_id) throw new ApolloError("Project id is required");

    try {


      let projectData = await Projects.findOne({ _id: _id })


      if (!projectData) throw new ApolloError("Project not found");


      return projectData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  findProjects: async (parent, args, context, info) => {
   
    const {_id} = args.fields;

    

    try {


      let projectsData
      if (_id) {
        
        projectsData = await Projects.find({ _id: _id })
      } else {
        

        projectsData = await Projects.find({})
      }
      console.log("projectsData = " , projectsData)


      


      return projectsData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
