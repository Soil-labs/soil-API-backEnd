
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
  findProjects_RequireSkill: async (parent, args, context, info) => {
   
    const {skillID} = args.fields;

    // console.log("change = " )
    

    try {


      let projectsData
      projectsData = await Projects.find({ 'role.skills._id':skillID})

      console.log("projectsData = " , projectsData)
      
      if (projectsData){
        return projectsData
      } else {
        return [{}]
      }
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
