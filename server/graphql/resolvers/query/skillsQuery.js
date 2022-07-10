
const { Skills } = require("../../../models/skillsModel");



const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkill: async (parent, args, context, info) => {
   

    const {_id} = args.fields;

    if (!_id) throw new ApolloError( "You need to specify the id of the skill");

    let fields = {
      _id,
      registeredAt: new Date(),
    };


    

    try {
      let skillData
      
      
      skillData = await Skills.findOne( {
          $and: [
            { _id: fields._id },
            { approvedSkill: "approved" },
          ]
      } ) 


      if (!skillData  ){
        skillData = await new Skills({
          ...fields,
          approvedSkill: "waiting",
        });
        
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
   

    const {_id} = args.fields;

    let fields = {
    };

    if (_id) fields = { ...fields, _id };

    console.log("fields = " , fields)
    

    try {
      let membersData
      if (_id) {
        console.log("change =1 ")

          membersData = await Skills.find( {
            $and: [
              { _id: fields._id },
              { approvedSkill: "approved" },
            ]
        } )


      } else {
        console.log("change =2 ")

        membersData = await Skills.find({approvedSkill: "approved"})
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
  waitingToAproveSkills: async (parent, args, context, info) => {
   

    let fields = {
    };
    

    try {
      let membersData

        membersData = await Skills.find({approvedSkill: "waiting"})

      


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
