const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  addNewMember: async (parent, args, context, info) => {
   

  const {discordName,_id,discordAvatar,discriminator} = args.fields;


    if (!_id) throw new ApolloError( "_id is required");

    let fields = {
      _id,
      registeredAt: new Date(),
    };

    
    if (discordName) fields.discordName = discordName;
    if (discordAvatar) fields.discordAvatar = discordAvatar;
    if (discriminator) fields.discriminator = discriminator;


    try {

      let membersData = await Members.findOne({ _id: fields._id })

      console.log("membersData = " , membersData)

      if (!membersData){
        membersData = await new Members(fields);
        
        membersData.save()
      } 
      // else {
      //   console.log("change = " )
      //   throw new ApolloError("Member already exists")
      // }

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },
  updateMember: async (parent, args, context, info) => {
   

    const {discordName,_id,discordAvatar,discriminator} = args.fields;

    if (!_id) throw new ApolloError( "_id is required");

    let fields = {
      _id,
      registeredAt: new Date(),
    };

    if (discordAvatar) fields =  {...fields,discordAvatar}
    if (discordName) fields =  {...fields,discordName}
    if (discriminator) fields =  {...fields,discriminator}

    

    try {

      let membersData = await Members.findOne({ _id: fields._id })


      if (!membersData ){
        membersData = await new Members(fields);
        
        membersData.save()

        membersData = membersData
      } else {
        membersData = await Members.findOneAndUpdate({ _id: fields._id }, fields, { new: true });
      }

      console.log("membersData = " , membersData)

      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },
  addSkillToMember: async (parent, args, context, info) => {
   

    const {skillID,memberID,authorID} = args.fields;

    if (!skillID) throw new ApolloError( "skillID is required");
    if (!memberID) throw new ApolloError( "memberID is required");
    if (!authorID) throw new ApolloError( "authorID is required");

    try {


      let fieldUpdate = {}

      let member = await Members.findOne({ _id: memberID })

      let authorInfo = await Members.findOne({ _id: authorID })

      let skill = await Skills.findOne({ _id: skillID })


      let newSkils


      let skillExist = true
      let makeAnUpdate = false


      // check all the skills, if the skill is already in the member, then update the author
      const updatedSkills = member.skills.map(skillMem=>{
        if (skillMem.id.equals(skill._id)===true){
            skillExist = false

            if (!skillMem.authors.includes(authorID)){ // If the skill already exist but the author is not in the list, add it
                makeAnUpdate = true

                skillMem.authors.push(authorID)

                return skillMem
            } else {
                return skillMem
            }
        } else {
            return skillMem
        }
    })

    // ---------- Network Member-----------
    let networkMember
    let flagMemberExist = false
    member.network.forEach(net=>{
      if (net.memberID.equals(authorID)===true){
        flagMemberExist = true
      } 
    })

    if (flagMemberExist===false){
      networkMember = member.network.concat({memberID: authorID})
    } else {
      networkMember = member.network
    }
    // ---------- Network Member-----------

    // ---------- Network Author-----------
    let networkAuthor
    flagMemberExist = false
    authorInfo.network.forEach(net=>{
      if (net.memberID.equals(authorID)===true){
        flagMemberExist = true
      } 
    })

    if (flagMemberExist===false){
      networkAuthor = authorInfo.network.concat({memberID: member._id})
    } else {
      networkAuthor = authorInfo.network
    }
    // ---------- Network Author-----------


    

    let updateMembers = skill.members
    // if the skill is not in the member, then add it
    if (skillExist === true){
        makeAnUpdate = true
        updatedSkills.push({
            id: skill._id, 
            authors: [authorID]
        })
        updateMembers.push(member._id)
    }


    let newMember,newSkill
    if (makeAnUpdate){
        member= await Members.findOneAndUpdate(
            {_id: member._id},
            {
                $set: {
                    skills: updatedSkills,
                    network: networkMember
                }
            },
            {new: true}
        )

        authorInfo = await Members.findOneAndUpdate(
            {_id: authorInfo._id},
            {
                $set: {
                    network: networkAuthor
                }
            },
            {new: true}
        )

        skill= await Skills.findOneAndUpdate(
            {_id: skill._id},
            {
                $set: {
                    members: updateMembers
                }
            },
            {new: true}
        )

      }
      
      console.log("member = " , member)

      console.log("networkAuthor 22 - = " , networkAuthor)
      console.log("authorInfo 22 - = " , authorInfo)

    member = {
      ...member._doc,
      // skills: []
    }


      return member
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember"}
      );
    }
  },

};