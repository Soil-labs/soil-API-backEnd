
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");
const {Members} = require("../../../models/membersModel");
const {Team} = require("../../../models/teamModal");


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
    //console.log("projectsData = " , projectsData)


      


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

    //console.log("projectsData = " , projectsData)
      
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
  findProjects_RecommendedToUser: async (parent, args, context, info) => {
   
    const {memberID} = args.fields;

    if (!memberID) throw new ApolloError("Member id is required");


    

    try {

      let memberData = await Members.findOne({ _id: memberID }) // Find the Member info

      if (!memberData) throw new ApolloError("Member not found");

      skillsArray = memberData.skills.map(skill => skill.id) // separate all teh skills

      // console.log("memberData.skills = " , memberData.skills)
    //console.log("skillsArray = " , skillsArray)
      
      projectsData = await Projects.find({ 'role.skills._id':skillsArray}) // Find the proejcts that have one of this skills in their roles

      let projectN,skill_ProjectRole,filteredSkillArray

      let matchNum,roleIndex;
      let projectMatch = []
      for (let i = 0; i < projectsData.length; i++) {
        projectN = projectsData[i]
      //console.log("projectN = " , projectN.role)

        matchNum = 0

        for (let j=0; j < projectN.role.length; j++) {
          // console.log("projectN.role[j].skills = " , projectN.role[j].skills)
          skill_ProjectRole = projectN.role[j].skills.map(skill => skill._id)

          filteredSkillArray = skillsArray.filter(skill => skill_ProjectRole.includes(skill))

        //console.log("skill_ProjectRole = " , skill_ProjectRole, " compare = ",skillsArray)
        //console.log("filteredSkillArray = " , filteredSkillArray)
        //console.log("filteredSkillArray.length = " , filteredSkillArray.length)

          if (matchNum < filteredSkillArray.length) {
            matchNum = filteredSkillArray.length
            roleIndex = j
          }
        }
        projectMatch.push({
          projectData: projectN,
          matchPercentage: (matchNum/skillsArray.length)*100,
          role: projectN.role[roleIndex]
        })
      }


      return projectMatch
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },

  findTeams: async (parent, args, context, info) => {
   
    const {_id} = args.fields;
    

    try {

      let teamData
      if (_id) {
        teamData = await Team.find({ _id: _id })
      } else {
        

        teamData = await Team.find({})
      }


      


      return teamData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
