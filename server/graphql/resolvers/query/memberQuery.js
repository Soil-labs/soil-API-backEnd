
const { Members } = require("../../../models/membersModel");
const mongoose = require("mongoose");
const { Projects } = require("../../../models/projectsModel");
const { driver } = require("../../../../server/neo4j_config");

const {matchMembersToProject_neo4j,matchMembersToProjectRole_neo4j,matchProjectsToMember_neo4j} = require("../../../neo4j/func_neo4j");


const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findMember: async (parent, args, context, info) => {
       
    const {_id,serverID} = args.fields;
    console.log("Query > findMember > args.fields = " , args.fields)

    if (!_id) {
      throw new ApolloError("No id provided");
    }

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }
    
    try {

      // let memberData = await Members.findOne({ _id: _id })

      let memberData

      if (queryServerID.length>0){
        memberData = await Members.findOne({ $and:[{ _id: _id },{$or:queryServerID}]})
      } else {
        memberData = await Members.findOne({ _id: _id })
      }
      


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
       
    const {_id,serverID} = args.fields;
    console.log("Query > findMembers > args.fields = " , args.fields)

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    
    try {

      let membersData

      if (_id){
        if (queryServerID.length>0){
          membersData = await Members.find({ $and:[{ _id: _id },{$or:queryServerID}]})
        } else {
          membersData = await Members.find({ _id: _id })
        }
      } else{
        if (queryServerID.length>0){
          membersData = await Members.find({$or:queryServerID})
        } else {
          membersData = await Members.find({})

        }
      }


    //console.log("membersData = " , membersData)

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

  members_autocomplete: async (parent, args, context, info) => {
   

    const {search} = args.fields;
    console.log("Query > members_autocomplete > args.fields = " , args.fields)
    
    let collection = mongoose.connection.db.collection("members")


    try {

      console.log("change = 1" ,search)
      let result = await collection.aggregate([ { 
          "$search": {
              "autocomplete": { 
                  "query": search,
                  "path": "discordName", 
                  "fuzzy": { 
                      "maxEdits": 1, 
                  } 
              } 
          } 
      }])
      .toArray();

      console.log("result = " , result)

      
      return result
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > members_autocomplete"}
      );
    }
  },

  matchMembersToUser: async (parent, args, context, info) => {
       
    const {memberID,serverID} = args.fields;
    console.log("Query > matchMembersToUser > args.fields = " , args.fields)

    if (!memberID) throw new ApolloError("memberID is required");

    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

     
    try {

      let memberData

      // memberData = await Members.findOne({ _id: memberID })

      if (queryServerID.length>0){
        memberData = await Members.findOne({ $and:[{ _id: memberID },{$or:queryServerID}]})
      } else {
        memberData = await Members.findOne({ _id: memberID })
      }
      
      if (!memberData) throw new ApolloError("The member need to exist on the database ");

      skillsArray_user = memberData.skills.map(skill => skill.id) // separate all teh skills



      
      
      // let membersMatch_User = await Members.find({ 'skills.id':skillsArray_user}) // Find the members that have the same skill

      let membersMatch_User

      if (queryServerID.length>0){
        membersMatch_User = await Members.find({ $and:[{ 'skills.id':skillsArray_user },{$or:queryServerID}]})
      } else {
        membersMatch_User = await Members.find({ 'skills.id':skillsArray_user })
      }


      if (membersMatch_User.length == 0){
        // membersMatch_User = await Members.find({})
        if (queryServerID.length>0){
          membersMatch_User = await Members.find({ $and:[{ },{$or:queryServerID}]})
        } else {
          membersMatch_User = await Members.find({ })
        }
        membersMatch_User = membersMatch_User.slice(0, 4)

      }
      
      //filter out my user
      membersMatch_User = membersMatch_User.filter(member => member._id != memberID )
      


      let memberMatch,matchPercentage
      let memberMatch_Result = []
      for (let i = 0; i < membersMatch_User.length; i++) {
        memberMatch = membersMatch_User[i]

        skill_memberMatch = memberMatch.skills.map(skill => skill.id)

        filteredSkillArray = skillsArray_user.filter(skill => skill_memberMatch.includes(skill))

        if (skillsArray_user.length>0){
          matchPercentage = (filteredSkillArray.length/skillsArray_user.length)*100
        } else {
          matchPercentage = 0
        }

        memberMatch_Result.push({
          member: memberMatch,
          matchPercentage: matchPercentage,
          commonSkills: filteredSkillArray
        })

      }

      memberMatch_Result.sort((a,b) => (a.matchPercentage < b.matchPercentage) ? 1 : -1)

      return memberMatch_Result
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchMembersToSkills: async (parent, args, context, info) => {
       
    const {skillsID,serverID} = args.fields;
    console.log("Query > matchMembersToSkills > args.fields = " , args.fields)

    if (!skillsID) throw new ApolloError("skillsID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

     
    try {


      // let membersMatch_User = await Members.find({ 'skills.id':skillsID}) // Find the members that have the same skill

      let membersMatch_User

      if (queryServerID.length>0){
        membersMatch_User = await Members.find({ $and:[{ 'skills.id':skillsID },{$or:queryServerID}]})
      } else {
        membersMatch_User = await Members.find({ 'skills.id':skillsID })
      }

    
      let memberMatch
      let memberMatch_Result = []
      for (let i = 0; i < membersMatch_User.length; i++) {
        memberMatch = membersMatch_User[i]

        skill_memberMatch = memberMatch.skills.map(skill => skill.id)

        filteredSkillArray = skillsID.filter(skill => skill_memberMatch.includes(skill))



        memberMatch_Result.push({
          member: memberMatch,
          matchPercentage: (filteredSkillArray.length/skillsID.length)*100,
          commonSkills: filteredSkillArray
        })

      }

      return memberMatch_Result
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchMembersToProject: async (parent, args, context, info) => {
       
    const {projectID,serverID} = args.fields;
    console.log("Query > matchMembersToProject > args.fields = " , args.fields)

    if (!projectID) throw new ApolloError("projectID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

     
    try {

      let project

      if (queryServerID.length>0){
        projectMatch_User = await Projects.find({ $and:[{ _id: projectID },{$or:queryServerID}]})
      } else {
        projectMatch_User = await Projects.find({ _id: projectID })
      }
      // console.log("projectMatch_User = " , projectMatch_User)

      // ------------ WiseTy -----------------

      console.log("change = 22" )
      result = await matchMembersToProject_neo4j({projectID:"630c18e7b9854c303ccd99fc"})

      console.log("result 22-2-2 = " , result)

      matchMembers = []
      matchIDs = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < result[i].length; j++) {
          if (matchIDs.includes(result[i][j]._id)) continue
          matchIDs.push(result[i][j]._id)
          // matchMembers.push(result[i][j])
          matchMembers.push({
            member: result[i][j]._id,
            matchPercentage: (3-i)*30,
          })
        }
      }

      console.log("matchMembers = " , matchMembers)

      // ------------ WiseTy -----------------


      return matchMembers
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

  matchMembersToProjectRole: async (parent, args, context, info) => {
       
    const {projectRoleID,serverID} = args.fields;
    console.log("Query > matchMembersToProjectRole > args.fields = " , args.fields)

    if (!projectRoleID) throw new ApolloError("projectID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    console.log("projectRoleID = " , projectRoleID)

     
    try {
      
      let project

      let projectMatch_User = await Projects.findOne({ "role._id": projectRoleID })

      let projectRoleMatch ={}

      projectMatch_User.role.filter(roleNow => {
        if (roleNow._id.equals(projectRoleID)==true){
          projectRoleMatch = roleNow
          
        }
      })



      console.log("projectMatch_User = " , projectMatch_User)
      console.log("projectMatch_User.role = " , projectMatch_User.role)
      console.log("projectRoleMatch = " , projectRoleMatch)

      // console.log("projectMatch_User = " , projectMatch_User)

      // ------------ WiseTy -----------------

      console.log("change = 22" )
      result = await matchMembersToProjectRole_neo4j({projectRoleID:projectRoleMatch._id})

      console.log("result 22-2-2 = " , result)

      matchMembers = []
      matchIDs = []
      for (let i = 0; i < 3; i++) {

        if (!result[i]) continue

        for (let j = 0; j < result[i].length; j++) {
          if (matchIDs.includes(result[i][j]._id)) continue
          matchIDs.push(result[i][j]._id)
          // matchMembers.push(result[i][j])
          matchMembers.push({
            member: result[i][j]._id,
            matchPercentage: (3-i)*30,
          })
        }
      }

      console.log("matchMembers = " , matchMembers)

      // ------------ WiseTy -----------------


      return matchMembers
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchProjectsToMember: async (parent, args, context, info) => {
       
    const {memberID,serverID} = args.fields;
    console.log("Query > matchMembersToProjectRole > args.fields = " , args.fields)

    if (!memberID) throw new ApolloError("projectID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    // console.log("projectRoleID = " , projectRoleID)

     
    try {
      
      // let project

      let memberData = await Members.findOne({ "_id": memberID })

      if (!memberData) throw new ApolloError("member is not in the database");

      console.log("memberData = " , memberData)

   
      // ------------ WiseTy -----------------

      console.log("change = 22" )
      result = await matchProjectsToMember_neo4j({memberID:memberData._id})

      console.log("result 22-2-2 = " , result)

      matchMembers = []
      matchIDs = []
      for (let i = 0; i < 3; i++) {
        
        if (!result[i]) continue

        for (let j = 0; j < result[i].length; j++) {

          if (matchIDs.includes(result[i][j].project._id)) {

            let pos = matchIDs.indexOf(result[i][j].project._id)

            console.log("pos = " , pos)

            if (!matchMembers[pos].roleID.includes(result[i][j].role.properties._id)) {
              // console.log("=------- result[i][j].role.properties = " , result[i][j].role.properties)
              // matchMembers[pos].role.push(result[i][j].role.properties)
              matchMembers[pos].role.push({
                roleID: result[i][j].role.properties._id,
                matchPercentage: (3-i)*30,
              })
              matchMembers[pos].roleID.push(result[i][j].role.properties._id)
            }


            

          } else {

            matchIDs.push(result[i][j].project._id)
            // matchMembers.push(result[i][j].project)
            // console.log("result[i][j].role.properties = " , result[i][j].role.properties)
            
            matchMembers.push({
              projectID: result[i][j].project._id,
              // role: [{result[i][j].role.properties}],
              role:[{
                roleID:result[i][j].role.properties._id,
                matchPercentage: (3-i)*30,
              }],
              roleID: [result[i][j].role.properties._id],
              matchPercentage: (3-i)*30,
            })
          }
        }
      }

      console.log("matchMembers = " , matchMembers)

      // ------------ WiseTy -----------------


      return matchMembers
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  

  
  
};
