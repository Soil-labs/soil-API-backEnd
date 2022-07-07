
const { Skills } = require("../../../models/skillsModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkill: async (parent, args, context, info) => {
   

    const {tagName} = args.fields;

    if (!tagName) throw new ApolloError( "You need to specify the name of the skill");

    let fields = {
      registeredAt: new Date(),
    };

    if (tagName) fields = { ...fields, tagName };

    

    try {
      let skillData
      
      
      skillData = await Skills.findOne({ tagName: fields.tagName }) 



      console.log("skillData = ",skillData )

      if (!skillData  ){
        skillData = await new Skills(fields);
        
        skillData.save()

        skillData = skillData
      }


      return skillData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },

  findSkills: async (parent, args, context, info) => {
   

    const {tagName} = args.fields;

    let fields = {
    };

    if (tagName) fields = { ...fields, tagName };

    console.log("fields = " , fields)
    

    try {
      let membersData
      if (tagName) {
        console.log("change =1 ")
        membersData = await Skills.find({ tagName: fields.tagName })
      } else {
        console.log("change =2 ")

        membersData = await Skills.find({})
        console.log("membersData = " , membersData)
      }

      


      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
