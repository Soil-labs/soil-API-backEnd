const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  createSkill: async (parent, args, context, info) => {
   
  const {tagName} = args.fields;


  if (!tagName) throw new ApolloError( "You need to specify the name of the skill");

  let fields = {
    tagName,
    approvedSkill: "waiting",
    registeredAt: new Date(),
  };



  try {

      let skillData

      skillData = await Skills.findOne({ tagName: fields.tagName })


      if (!skillData ){
        skillData = await new Skills(fields);
        
        skillData.save()

        skillData = skillData
      }


      return skillData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },
  createApprovedSkill: async (parent, args, context, info) => {
    // Be careful only Admins can created preapproved skills
   
    const {_id} = args.fields;
  
  
    if (!_id) throw new ApolloError( "You need to specify the ID of the skill");
  
    let fields = {
      _id,
      approvedSkill: "approved",
      registeredAt: new Date(),
    };
  
  
  
    try {
  
        let skillData
  
        skillData = await Skills.findOne({ _id: fields._id })
  
  
        if (!skillData ){
          skillData = await new Skills(fields);
          
          skillData.save()
  
          skillData = skillData
        }
  
  
        return skillData
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember"}
        );
      }
    },
  approveOrRejectSkill: async (parent, args, context, info) => {
   
    const {_id,approvedSkill} = args.fields;
  
  
    if (!_id) throw new ApolloError( "You need to specify the ID of the skill");
    if (!approvedSkill) throw new ApolloError( "You need to specify if you approve or reject the skill");
  
    if (approvedSkill !== "approved" && approvedSkill !== "rejected") throw new ApolloError( "You need to specify if you approve or reject the skill");
  
  
    try {
  
        let skillData
  
        skillData = await Skills.findOne({ _id: _id })
  
        console.log("skillData = " , skillData)
  
        if (skillData ){

          skillData= await Skills.findOneAndUpdate(
              {_id: _id},
              {
                  $set: {
                    approvedSkill: approvedSkill,
                  }
              },
              {new: true}
          )
        }

        console.log("skillData 2= " , skillData)

  
  
        return skillData
      } catch (err) {
        throw new ApolloError(
          err.message,
          err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
          { component: "tmemberQuery > addNewMember"}
        );
      }
    },
  

};
