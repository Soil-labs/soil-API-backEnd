const { SkillSubCategory} = require("../../../models/skillSubCategoryModel");
const { ServerTemplate } = require("../../../models/serverModel");

const {createNode_neo4j,createNode_neo4j_field,updateNode_neo4j_serverID_f,makeConnection_neo4j} = require("../../../neo4j/func_neo4j");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  updateSkillSubCategory: async (parent, args, context, info) => {
   

    const {_id,name,description,skills,categorySkills,id_lightcast,emoji} = args.fields;
    console.log("Mutation > updateSkillSubCategory > args.fields = " , args.fields)


    let fields = {
    };
 
     
    if (skills) fields.skills = skills;
    if (description) fields.description = description;
    if (name) fields.name = name;
    if (_id) fields._id = _id;
    if (categorySkills) fields.categorySkills = categorySkills;
    if (id_lightcast) fields.id_lightcast = id_lightcast;
    if (emoji) fields.emoji = emoji;


    try {

        let isNewCategory = false;

        let skillSubCategoryData
        if (_id || id_lightcast) {

            if (_id){
              skillSubCategoryData = await SkillSubCategory.findOne({ _id: _id })
            }else{
              skillSubCategoryData = await SkillSubCategory.findOne({ id_lightcast: id_lightcast })
            }
            
            if (!skillSubCategoryData) {
                skillSubCategoryData = await new SkillSubCategory(fields);
                skillSubCategoryData.save()

                isNewCategory = true;

            } else {
                skillSubCategoryData= await SkillSubCategory.findOneAndUpdate(
                    {_id: skillSubCategoryData._id},
                    {
                        $set: fields
                    },
                    {new: true}
                )
            }
            
        } else {
            skillSubCategoryData = await new SkillSubCategory(fields);
            skillSubCategoryData.save()

            isNewCategory = true;

        }

        if (isNewCategory) {
          let serverData = await ServerTemplate.find({})

          let serverID = []
          serverData.map(server => {
            serverID.push(server._id)
          })

          createNode_neo4j_field({
            fields:{
              node:"Skill_Sub_Category",
              _id: skillSubCategoryData._id,
              serverID_code: "828",
              name: skillSubCategoryData.name,
              serverID: serverID,
            }
          })
        }


        return skillSubCategoryData;
          
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },

};
