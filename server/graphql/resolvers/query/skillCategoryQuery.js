

const {SkillCategory} = require("../../../models/skillCategoryModel");

const {
  ApolloError,
} = require("apollo-server-express");


module.exports = {
  findSkillCategory: async (parent, args, context, info) => {
   
    const {_id,id_lightcast} = args.fields;
    console.log("Query > findSkillCategory > args.fields = " , args.fields)

    let searchQuery = {}

    if (_id){
      searchQuery = { _id: _id };
    } else if (id_lightcast){
      searchQuery = { id_lightcast: id_lightcast };
    } else {
      throw new ApolloError( "You need to specify the id of the skill category ");
    }


    try {


      let skillCategoryData 

      skillCategoryData = await SkillCategory.findOne(searchQuery)

 
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
   
    const {_id,id_lightcast} = args.fields;
    console.log("Query > findSkillCategories > args.fields = " , args.fields)

    let searchQuery = {}

    if (_id){
      searchQuery = { _id: _id };
    } else if (id_lightcast){
      searchQuery = { id_lightcast: id_lightcast };
    } else {
      searchQuery = { };
    }

    try {

      let skillCategoryData

      // if (_id) {
      //   skillCategoryData = await SkillCategory.find({ _id: _id })
      // } else {
      //   skillCategoryData = await SkillCategory.find({})
      // }

      skillCategoryData = await SkillCategory.find(searchQuery)

   


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
