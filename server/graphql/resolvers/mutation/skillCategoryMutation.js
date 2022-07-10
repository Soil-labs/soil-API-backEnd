const { SkillCategory} = require("../../../models/skillCategoryModel");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  updateSkillCategory: async (parent, args, context, info) => {
   

    const {_id,name,description,skills} = args.fields;


    let fields = {
    };
 
     
    if (skills) fields.skills = skills;
    if (description) fields.description = description;
    if (name) fields.name = name;
    if (_id) fields._id = _id;


    try {

        if (_id) {
            let skillCategoryData = await SkillCategory.findOne({ _id: _id })
            if (!skillCategoryData) {
                skillCategoryData = await new SkillCategory(fields);
                skillCategoryData.save()
            } else {
                skillCategoryData= await SkillCategory.findOneAndUpdate(
                    {_id: skillCategoryData._id},
                    {
                        $set: fields
                    },
                    {new: true}
                )
            }
            return skillCategoryData;
        } else {
            let skillCategoryData = await new SkillCategory(fields);
            skillCategoryData.save()
            return skillCategoryData;
        }
        
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },

};
