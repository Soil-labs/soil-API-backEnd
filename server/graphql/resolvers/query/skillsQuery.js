
const { Skills } = require("../../../models/skillsModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkill: async (parent, args, context, info) => {
   

    const {tagName} = args.fields;

    if (!tagName) throw new ApolloError( "You didnt specify skill (you need to have a tagName) ");

    let fields = {
      tagName,
      registeredAt: new Date(),
    };
    
    console.log("fields = " , fields)

    try {
      let membersData = await Skills.findOne({ tagName: fields.tagName })



      console.log("membersData = ",membersData )

      if (!membersData || membersData.length==0 ){
        membersData = await new Skills(fields);
        
        membersData.save()

        membersData = membersData
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
