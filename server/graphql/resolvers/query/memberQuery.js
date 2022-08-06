
const { Members } = require("../../../models/membersModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findMember: async (parent, args, context, info) => {
       
    const {_id,serverID} = args.fields;

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

  matchMembersToUser: async (parent, args, context, info) => {
       
    const {memberID,serverID} = args.fields;

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
       
    const {skillsID} = args.fields;

    if (!skillsID) throw new ApolloError("skillsID is required");
    

     
    try {


      let membersMatch_User = await Members.find({ 'skills.id':skillsID}) // Find the members that have the same skill

    
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
  

  
  
};
