const { Members } = require("../../../models/membersModel");
const { Skills } = require("../../../models/skillsModel");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  createSkill: async (parent, args, context, info) => {
   
  const {tagName} = args.fields;


  if (!tagName) throw new ApolloError( "You need to specify the name of the skill");

  let fields = {
    tagName,
    registeredAt: new Date(),
  };



  try {

      let skillData

      skillData = await Skills.findOne({ tagName: fields.tagName })


      if (!skillData || skillData.length==0 ){
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
  

};
