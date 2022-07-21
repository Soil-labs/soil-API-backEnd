
const { Members } = require("../../../models/membersModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findMember: async (parent, args, context, info) => {
       
    const {_id} = args.fields;

    if (!_id) {
      throw new ApolloError("No id provided");
    }

    
    try {

      let memberData = await Members.findOne({ _id: _id })
      


      // console.log("memberData = " , memberData)

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
       
    const {_id} = args.fields;

    
    try {

      let membersData
      if (_id){
        membersData = await Members.find({ _id: _id })
      //console.log("membersData = " , membersData)
      } else{
        membersData = await Members.find({})
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
       
    const {memberID} = args.fields;

    if (!memberID) throw new ApolloError("memberID is required");

     
    try {

      let memberData

      memberData = await Members.findOne({ _id: memberID })

      // console.log("memberData = " , memberData)
      
      if (!memberData) throw new ApolloError("The member need to exist on the database ");

      

      skillsArray_user = memberData.skills.map(skill => skill.id) // separate all teh skills

      // console.log("skillsArray_user = " , skillsArray_user)

      let membersMatch_User = await Members.find({ 'skills.id':skillsArray_user}) // Find the members that have the same skill

      
      //filter out my user
      membersMatch_User = membersMatch_User.filter(member => member._id != memberID )

      // console.log("membersMatch_User = " , membersMatch_User)


      let memberMatch
      let memberMatch_Result = []
      for (let i = 0; i < membersMatch_User.length; i++) {
        memberMatch = membersMatch_User[i]

        skill_memberMatch = memberMatch.skills.map(skill => skill.id)

        filteredSkillArray = skillsArray_user.filter(skill => skill_memberMatch.includes(skill))


        // console.log("filteredSkillArray = " , filteredSkillArray)
        // console.log("skillsArray_user = " , skillsArray_user)
        // console.log("skill_memberMatch = " , skill_memberMatch)


        memberMatch_Result.push({
          member: memberMatch,
          matchPersentage: (filteredSkillArray.length/skillsArray_user.length)*100,
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
          matchPersentage: (filteredSkillArray.length/skillsID.length)*100,
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
