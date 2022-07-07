

// const {SkillCategory} = require("../../../models/skillCategoryModel");

const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkillCategory: async (parent, args, context, info) => {
   
    const {_id} = args.fields;

    if (!_id) throw new ApolloError("No id provided");

    try {


      let skillCategoryData 

      // skillCategoryData = await SkillCategory.findOne({ _id: _id })

 
      return skillCategoryData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  findSkillCategories: async (parent, args, context, info) => {
   
    const {_id} = args.fields;

    try {

      let skillCategoryData

      if (_id) {
        skillCategoryData = await SkillCategory.find({ _id: _id })
      } else {
        skillCategoryData = await SkillCategory.find({})
      }

   


      return skillCategoryData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
