
const { Skills } = require("../../../models/skillsModel");
const {Projects} = require("../../../models/projectsModel");
const {Members} = require("../../../models/membersModel");
const {Team} = require("../../../models/teamModal");
const {Role} = require("../../../models/roleModel");


const {
  ApolloError,
} = require("apollo-server-express");
const { Initiative } = require("..");


module.exports = {
  findProject: async (parent, args, context, info) => {
   
    const {_id,serverID} = args.fields;

    if (!_id) throw new ApolloError("Project id is required");


    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    try {


      // let projectData = await Projects.findOne({ _id: _id })

      let projectData

      if (queryServerID.length>0){
        projectData = await Projects.findOne({ $and:[{ _id: _id },{$or:queryServerID}]})
      } else {
        console.log("change = " )
        projectData = await Projects.findOne({ _id: _id })
      }


      // if (!projectData) throw new ApolloError("Project not found");


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
   
    const {_id,serverID} = args.fields;

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    

    try {


      // let projectsData
      // if (_id) {
        
      //   projectsData = await Projects.find({ _id: _id })
      // } else {
        

      //   projectsData = await Projects.find({})
      // }
    
      
      let projectsData

      if (_id){
        if (queryServerID.length>0){
          projectsData = await Projects.find({ $and:[{ _id: _id },{$or:queryServerID}]})
        } else {
          projectsData = await Projects.find({ _id: _id })
        }
      } else{
        if (queryServerID.length>0){
          projectsData = await Projects.find({$or:queryServerID})
        } else {
          projectsData = await Projects.find({})

        }
      }


      


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
   
    const {skillID,serverID} = args.fields;

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    

    try {


      let projectsData
      // projectsData = await Projects.find({ 'role.skills._id':skillID})

      if (queryServerID.length>0){
        projectsData = await Projects.find({ $and:[{ 'role.skills._id':skillID },{$or:queryServerID}]})
      } else {
        projectsData = await Projects.find({ 'role.skills._id':skillID })
      }

    //console.log("projectsData = " , projectsData)
      
      // if (projectsData){
        // return projectsData
      // } else {
      //   return [{}]
      // }

      return projectsData
      
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  findProjects_RecommendedToUser: async (parent, args, context, info) => {
   
    const {memberID,serverID} = args.fields;

    if (!memberID) throw new ApolloError("Member id is required");


    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    

    try {

      // let memberData = await Members.findOne({ _id: memberID }) // Find the Member info

      // console.log("memberData.length = " , memberData.serverID)

      let memberData

      if (queryServerID.length>0){
        memberData = await Members.findOne({ $and:[{ _id: memberID },{$or:queryServerID}]})
      } else {
        console.log("change = " )
        memberData = await Members.findOne({ _id: memberID })
      }

      if (!memberData) throw new ApolloError("Member not found or doenst exist on this server");

      skillsArray = memberData.skills.map(skill => skill.id) // separate all teh skills

      
      let projectsData

      if (queryServerID.length>0){
        projectsData = await Projects.find({ $and:[{ 'role.skills._id':skillsArray },{$or:queryServerID}]})
      } else {
        console.log("change = 2" )
        projectsData = await Projects.find({ 'role.skills._id':skillsArray })
      }

      // projectsData = await Projects.find({ 'role.skills._id':skillsArray}) // Find the proejcts that have one of this skills in their roles

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
  match_projectToUser: async (parent, args, context, info) => {
   
    // console.log("change = " )
    const {memberID,projectID,roleID,serverID} = args.fields;

    if (!memberID) throw new ApolloError("Member id is required");
    if (!projectID) throw new ApolloError("Project id is required");
    if (!roleID) throw new ApolloError("Role id is required");


    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }


    try {

      // let memberData = await Members.findOne({ _id: memberID }) // Find the Member info

      let memberData
      if (queryServerID.length>0){
        memberData = await Members.findOne({ $and:[{ _id: memberID},{$or:queryServerID}]})
      } else {
        memberData = await Members.findOne({ _id: memberID})
      }

      if (!memberData) throw new ApolloError("Member not found - is not on the database or in this server");




      // let projectData = await Projects.findOne({ _id: projectID }) // Find the Project info
      let projectData
      if (queryServerID.length>0){
        projectData = await Projects.findOne({ $and:[{ _id: projectID },{$or:queryServerID}]})
      } else {
        projectData = await Projects.findOne({ _id: projectID })
      }

      if (!projectData) throw new ApolloError("Project not found - is not on the database or in this server");




      skillsArray = memberData.skills.map(skill => skill.id) // separate all teh skills


      console.log("skillsArray = " , skillsArray)

      let projectN,skill_ProjectRole,filteredSkillArray

      let matchNum,roleIndex;
      let projectMatch = []
        
      projectN = projectData

      matchNum = 0

      let roleChoose = projectN.role.filter(role => {
        if (role._id == roleID) {
          return role
        }
      })

      console.log("roleChoose = " , roleChoose)


      
      skill_ProjectRole = roleChoose[0].skills.map(skill => skill._id)

      console.log("skill_ProjectRole = " , skill_ProjectRole)

      filteredSkillArray = skillsArray.filter(skill => skill_ProjectRole.includes(skill))

      if (matchNum < filteredSkillArray.length) {
        matchNum = filteredSkillArray.length
      }
        

      // console.log("freak = ",{
      //   projectData: projectN,
      //   matchPercentage: (matchNum/skillsArray.length)*100,
      //   skillsMatch: filteredSkillArray,
      //   skillsDontMatch: skillsArray.filter(skill => !filteredSkillArray.includes(skill)),
      // })


      return ({
        projectData: projectN,
        matchPercentage: (matchNum/skillsArray.length)*100,
        skillsMatch: filteredSkillArray,
        skillsDontMatch: skillsArray.filter(skill => !filteredSkillArray.includes(skill)),
        
      })
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },

  findTeams: async (parent, args, context, info) => {
   
    const {_id,projectID,serverID} = args.fields;

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    
    let fields = {};

    if (projectID) {
      fields = {
        ...fields,
        projectID: projectID
      }
    }

    if (_id) {
      fields = {
        ...fields,
        _id: _id
      }
    }

    try {

      let teamData

      console.log("change = ",fields,queryServerID )

      
      if (queryServerID.length>0){
        teamData = await Team.find({ $and:[fields,{$or:queryServerID},]})
      } else {
        console.log("change = 2" )
        teamData = await Team.find(fields)
      }
        

        // if (_id){
        //   if (queryServerID.length>0){
        //     teamData = await Team.find({ $and:[{ _id: _id },{$or:queryServerID},]})
        //   } else {
        //     teamData = await Team.find({ _id: _id })
        //   }
        // } else{
        //   if (queryServerID.length>0){
        //     teamData = await Team.find({$or:queryServerID})
        //   } else {
        //     teamData = await Team.find({})
  
        //   }
        // }

      console.log("fields = " , fields)
      console.log("teamData = " , teamData)


      


      return teamData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  findRoles: async (parent, args, context, info) => {
   
    const {_id,serverID,projectID,teamID} = args.fields;

    // console.log("change = " )

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    
    let fields = {};
    if (projectID) {
      fields = {
        ...fields,
        projectID: projectID
      }
    }

    if (teamID) {
      fields = {
        ...fields,
        teamID: teamID
      }
    }
    if (_id) {
      fields = {
        ...fields,
        _id: _id
      }
    }
    

    try {

      let teamData
  

      if (queryServerID.length>0){
        teamData = await Role.find({ $and:[fields,{$or:queryServerID}]})
      } else {
        teamData = await Role.find(fields)
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

  findInitiative: async (parent, args, context, info) => {
   
    const {_id,serverID,projectID,teamID} = args.fields;


    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    
    let fields = {};
    if (projectID) {
      fields = {
        ...fields,
        projectID: projectID
      }
    }

    if (teamID) {
      fields = {
        ...fields,
        teamID: teamID
      }
    }
    if (_id) {
      fields = {
        ...fields,
        _id: _id
      }
    }
    

    try {

      let initiativeData
  

      if (queryServerID.length>0){
        initiativeData = await Initiative.find({ $and:[fields,{$or:queryServerID}]})
      } else {
        initiativeData = await Initiative.find(fields)
      }



      


      return initiativeData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
