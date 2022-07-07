const { SkillCategory} = require("../../../models/skillCategoryModel");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  newSkillCategory: async (parent, args, context, info) => {
   

  const {name,description,skills} = args.fields;

  console.log("change = " )

    if (!name) throw new ApolloError( "name is required");

    let fields = {
      name,
    };

    
    if (skills) fields.skills = skills;
    if (description) fields.description = description;

    console.log("fields = " , fields)


    try {

        skillCategoryData = await new SkillCategory(fields);
        
        skillCategoryData.save()

      return skillCategoryData
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },

};
