
const { Members } = require("../../../models/membersModel");
const mongoose = require("mongoose");
const { Projects } = require("../../../models/projectsModel");
const { Skills } = require("../../../models/skillsModel");
const { driver } = require("../../../../server/neo4j_config");

const {matchMembersToProject_neo4j,matchMembersToProjectRole_neo4j,matchPrepareSkillToMembers_neo4j,matchPrepareSkillToProjectRoles_neo4j} = require("../../../neo4j/func_neo4j");


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

  matchPrepareSkillToMembers: async (parent, args, context, info) => {
       
    const {skillID,serverID} = args.fields;
    console.log("Query > matchPrepareSkillToMembers > args.fields = " , args.fields)

    if (!skillID) throw new ApolloError("projectID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    console.log("skillID = " , skillID)

     
    try {
      
      let project

      let skillData = await Skills.findOne({ "_id": skillID })

      if (!skillData) throw new ApolloError("Skill Don't exist");

      console.log("skillData = " , skillData)



      // ------------ WiseTy -----------------

      console.log("change = 22" )
      result = await matchPrepareSkillToMembers_neo4j({skillID:skillData._id})

      console.log("result 22-2-2 = " , result)

      matchMembers = []
      matchIDs = []

      
      distanceMatchHop = [[],[],[]]

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
          distanceMatchHop[i].push(result[i][j]._id)
        }
      }

      
      let distanceMembers = {
        hop0: distanceMatchHop[0],
        hop1: distanceMatchHop[1],
        hop2: distanceMatchHop[2],
      }
      console.log("distanceMembers = " , distanceMembers)


      // let skillData = await Skills.findOne({ "_id": skillID })

      skillDataNew= await Skills.findOneAndUpdate(
        {_id: skillID},
        {
            $set: {
                match: {
                  recalculateMembers: false,
                  distanceMembers: distanceMembers,
                  recalculateProjectRoles: skillData.match.recalculateProjectRoles,
                  distanceProjectRoles: skillData.match.distanceProjectRoles,
                }
            }
        },
        {new: true}
    )

      // console.log("matchMembers = " , matchMembers)

      // // ------------ WiseTy -----------------


      return skillDataNew
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchPrepareSkillToProjectRoles: async (parent, args, context, info) => {
       
    const {skillID,serverID} = args.fields;
    console.log("Query > matchPrepareSkillToProjectRoles > args.fields = " , args.fields)

    if (!skillID) throw new ApolloError("skillID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    console.log("skillID = " , skillID)

     
    try {

      let skillData = await Skills.findOne({ "_id": skillID })

      if (!skillData) throw new ApolloError("Skill Don't exist");

      console.log("skillData = " , skillData)



      // ------------ WiseTy -----------------

      console.log("change = 22" )
      result = await matchPrepareSkillToProjectRoles_neo4j({skillID:skillData._id})

      console.log("result 22-2-2 = " , result)

      matchMembers = []
      matchIDs = []

      
      distanceMatchHop = [[],[],[]]

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
          distanceMatchHop[i].push(result[i][j]._id)
        }
      }

      
      let distanceProjectRoles = {
        hop0: distanceMatchHop[0],
        hop1: distanceMatchHop[1],
        hop2: distanceMatchHop[2],
      }
      console.log("distanceProjectRoles = " , distanceProjectRoles)


      // let skillData = await Skills.findOne({ "_id": skillID })

      skillDataNew= await Skills.findOneAndUpdate(
        {_id: skillID},
        {
            $set: {
                match: {
                  recalculateProjectRoles: false,
                  distanceProjectRoles: distanceProjectRoles,

                  recalculateMembers: skillData.match.recalculateMembers,
                  distanceMembers: skillData.match.distanceMembers,
                }
            }
        },
        {new: true}
    )

      // console.log("matchMembers = " , matchMembers)

    //   // // ------------ WiseTy -----------------


      return skillDataNew
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchSkillsToMembers: async (parent, args, context, info) => {
       
    const {skillsID,serverID} = args.fields;
    let {page,limit} = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = " , args.fields)

    if (!skillsID) throw new ApolloError("projectID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    if (page!=null && limit!=null){

    } else {
      page=0
      limit=10
    }

     
    try {
      
      let project

      let skillData = await Skills.find({ "_id": skillsID })

      if (!skillData) throw new ApolloError("Skill Don't exist");

      console.log("skillData[0] = " , skillData[0])
      console.log("skillData[0] = " , skillData[0].match)


      let numberOfSkills = skillData.length

      let distanceAll = [[],[],[]]
      let points = [[],[],[]]
      let persentage = [[],[],[]]

      let everyID = []

      let newSkillFlag,persentageNow 
      console.log("distanceAll = " , distanceAll)
      for (let i=0;i<skillData.length;i++){

        newSkillFlag = true
        for (let k=0;k<3;k++){
          let membersNow
          if (k==0) membersNow = skillData[i].match.distanceMembers.hop0
          if (k==1) membersNow = skillData[i].match.distanceMembers.hop1
          if (k==2) membersNow = skillData[i].match.distanceMembers.hop2

          for (let j=0;j<membersNow.length;j++){
            let memberID = membersNow[j]
            if (!everyID.includes(memberID)){
              newSkillFlag = false
              distanceAll[k].push(memberID)
              points[k].push(1)
              everyID.push(memberID)

              persentageNow = (100/numberOfSkills)*(  (25*(4-k))/(100)  ) // (How powerful is this skill) * (what is the distance)

              persentage[k].push(persentageNow)


              if (i==1) console.log("add the memberID = " , memberID)
            } else {
              newSkillFlag = false
              let pos = distanceAll[k].indexOf(memberID)
              // console.log("pos = " , pos)
              if (pos>-1) {
                points[k][pos] = points[k][pos] + 1

                persentageNow = (100/numberOfSkills)*(  (25*(4-k))/(100)  ) // (How powerful is this skill) * (what is the distance)

                persentage[k][pos] = persentage[k][pos] + persentageNow

              }


            }
          }
        }
      }

      console.log("points = " , points)

      matchSkillsToMembersOutput = []
      
      for (let i=0;i<distanceAll.length;i++){

        for (let k=0;k<distanceAll[i].length;k++){
          matchSkillsToMembersOutput.push({
            memberID: distanceAll[i][k],
            // matchPercentage: 25*(3-i) + (25/skillData.length)*points[i][k],
            matchPercentage: persentage[i][k],
            // commonSkills: 

          })
          
        }
        

      }


      return matchSkillsToMembersOutput.slice(page*limit,(page+1)*limit)
      // return [{}]
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  matchSkillsToProjects: async (parent, args, context, info) => {
       
    const {skillsID,serverID} = args.fields;
    let {page,limit} = args.fields;
    console.log("Query > matchSkillsToMembers > args.fields = " , args.fields)

    if (!skillsID) throw new ApolloError("projectID is required");
    
    let queryServerID = []
    if (serverID) {
      serverID.forEach(id => {
        queryServerID.push({ serverID: id })
      })
    }

    if (page!=null && limit!=null){

    } else {
      page=0
      limit=10
    }

     
    try {
      
      let project

      let skillData = await Skills.find({ "_id": skillsID })

      if (!skillData) throw new ApolloError("Skill Don't exist");

      // console.log("skillData[0] = " , skillData[0])
      // console.log("skillData[0] = " , skillData[0].match)


      let distanceAll = [[],[],[]]
      let points = [[],[],[]]

      let everyID = []

      console.log("distanceAll = " , distanceAll)
      for (let i=0;i<skillData.length;i++){

        for (let k=0;k<3;k++){
          let projectsNow
          if (k==0) projectsNow = skillData[i].match.distanceProjectRoles.hop0
          if (k==1) projectsNow = skillData[i].match.distanceProjectRoles.hop1
          if (k==2) projectsNow = skillData[i].match.distanceProjectRoles.hop2

          for (let j=0;j<projectsNow.length;j++){
            let projectID = projectsNow[j]
            if (!everyID.includes(projectID.toString())){
              distanceAll[k].push(projectID.toString())
              points[k].push(1)
              everyID.push(projectID.toString())

              // if (i==1) console.log("add the projectID = " , projectID)
            } else {
              let pos = distanceAll[k].indexOf(projectID.toString())
              if (pos>-1) points[k][pos] = points[k][pos] + 1
            }
          }
        }
      }

      // console.log("distanceAll = " , distanceAll)
      // console.log("points = " , points)

      let projectNow_allData = await Projects.find({ "role._id": everyID })

      console.log("everyID = " , everyID)
      console.log("projectNow_allData = " , projectNow_allData)

      roleIDtoProjectID = {}

      for (let i=0;i<projectNow_allData.length;i++){
        let projectNow = projectNow_allData[i]
        for (let j=0;j<projectNow.role.length;j++){
          let roleNow = projectNow.role[j]
          roleIDtoProjectID[roleNow._id.toString()] = projectNow._id.toString()
        }
      }



      matchSkillsToMembersOutput = []
      projectsID_all = []
      
      for (let i=0;i<distanceAll.length;i++){

        for (let k=0;k<distanceAll[i].length;k++){

          // let projectNowData = await Projects.findOne({ "role._id": distanceAll[i][k] })

          let projectNowID = roleIDtoProjectID[distanceAll[i][k]]

          // if (i==0 && k==0) {
          //   console.log("distanceAll[i][k] = " , distanceAll[i][k])
          //   console.log("projectNowData = " , projectNowData)
          // }

          if (projectsID_all.includes(projectNowID.toString())) {

            let pos = projectsID_all.indexOf(projectNowID.toString())

            newMatchPersentage = matchSkillsToMembersOutput[pos].matchPercentage
            if (matchSkillsToMembersOutput[pos].matchPercentage<25*(3-i) + (25/skillData.length)*points[i][k]){
              newMatchPersentage = 25*(3-i) + (25/skillData.length)*points[i][k]
            }
            matchSkillsToMembersOutput[pos] = {
              projectID: matchSkillsToMembersOutput[pos].projectID,
              matchPercentage: newMatchPersentage,
              commonSkillsID: [],
              projectRoles: [{
                projectRoleID: distanceAll[i][k],
                matchPercentage: 25*(3-i) + (25/skillData.length)*points[i][k],
                commonSkillsID: [],
              }]

            }

          } else {
            matchSkillsToMembersOutput.push({
              projectID: projectNowID,
              matchPercentage: 25*(3-i) + (25/skillData.length)*points[i][k],
              commonSkillsID: [],

              projectRoles: [{
                projectRoleID: distanceAll[i][k],
                matchPercentage: 25*(3-i) + (25/skillData.length)*points[i][k],
                commonSkillsID: [],
              }]
            })
            projectsID_all.push(projectNowID.toString())
          }

        }

      }

      return matchSkillsToMembersOutput.slice(page*limit,(page+1)*limit)
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  

  
  
};
