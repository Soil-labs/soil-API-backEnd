

const {SkillSubCategory} = require("../../../models/skillSubCategoryModel");

const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkillSubCategory: async (parent, args, context, info) => {
   
    const {_id,id_lightcast} = args.fields;

    let searchQuery = {}

    if (_id){
      searchQuery = { _id: _id };
    } else if (id_lightcast){
      searchQuery = { id_lightcast: id_lightcast };
    } else {
      throw new ApolloError( "You need to specify the id of the skill sub category ");
    }

    try {


      let skillSubCategoryData 

      skillSubCategoryData = await SkillSubCategory.findOne(searchQuery)

 
      return skillSubCategoryData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  findSkillSubCategories: async (parent, args, context, info) => {
   
    const {_id,id_lightcast} = args.fields;

    let searchQuery = {}

    if (_id){
      searchQuery = { _id: _id };
    } else if (id_lightcast){
      searchQuery = { id_lightcast: id_lightcast };
    } else {
      searchQuery = { };
    }

    try {

      let skillSubCategoryData

      // if (_id) {
      //   skillSubCategoryData = await SkillSubCategory.find({ _id: _id })
      // } else {
      //   skillSubCategoryData = await SkillSubCategory.find({})
      // }

      skillSubCategoryData = await SkillSubCategory.find(searchQuery)

   


      return skillSubCategoryData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > findSkill"}
      );
    }
  },
  
  
};
