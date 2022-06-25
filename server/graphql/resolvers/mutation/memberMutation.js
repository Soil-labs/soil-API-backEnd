const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");


module.exports = {
  add_member_skill: async (parent, args, context, info) => {
   

    const {skillID,memberID,authorID} = args.fields;



    try {



      let member = await Members.findOne({ _id: memberID })

      let skill = await Skills.findOne({ _id: skillID })

    //console.log("member = " , member)
    //console.log("skill = " , skill)



      let newSkils


      let skillExist = true
      let makeAnUpdate = false


      const updatedSkills = member.skills.map(skillMem=>{
        if (skillMem.id.equals(skill._id)===true){
            skillExist = false

            if (!skillMem.authors.includes(authorID)){
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

    // console.log("updatedSkills = " , makeAnUpdate,updatedSkills)

    // console.log("skill = " , skill)

    let updateMembers = skill.members
    if (skillExist === true){
        makeAnUpdate = true
        updatedSkills.push({
            id: skill._id, 
            authors: [authorID]
        })
        updateMembers.push(member._id)
    }

    // console.log("updatedSkills = " , makeAnUpdate,updatedSkills)

    let newMember,newSkill
    if (makeAnUpdate){
        member= await Members.findOneAndUpdate(
            {_id: member._id},
            {
                $set: {
                    skills: updatedSkills
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
      //console.log("newSkills 22 - skill = " , skill)
        // console.log("newSkills 22= " , newSkills.skills[0].authors)
    }

    member = {
      ...member._doc,
      // skills: []
    }


      return member
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findMember", user: req.user.id }
      );
    }
  },

};
