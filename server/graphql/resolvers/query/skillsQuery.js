
const { Skills } = require("../../../models/skillsModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkill: async (parent, args, context, info) => {
   

    const {tagName} = args.fields;

    let fields = {
      registeredAt: new Date(),
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



    //console.log("membersData = ",membersData )

      if (!membersData || membersData.length==0 ){
        membersData = await new Skills(fields);
        
        membersData.save()
      //console.log("membersData = " , membersData)

        membersData = [membersData]
      }


      return membersData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill", user: req.user.id }
      );
    }
  },

  
  
};
