const { SkillCategory} = require("../../../models/skillCategoryModel");
const { ServerTemplate } = require("../../../models/serverModel");

const {createNode_neo4j,createNode_neo4j_field,updateNode_neo4j_serverID_f,makeConnection_neo4j} = require("../../../neo4j/func_neo4j");

const {ApolloError} = require("apollo-server-express");

module.exports = {
  updateSkillCategory: async (parent, args, context, info) => {
   

    const {_id,name,description,skills,subCategorySkill,id_lightcast,emoji} = args.fields;
    console.log("Mutation > updateSkillCategory > args.fields = " , args.fields)


    let fields = {
    };
 
     
    if (skills) fields.skills = skills;
    if (description) fields.description = description;
    if (name) fields.name = name;
    if (_id) fields._id = _id;
    if (subCategorySkill) fields.subCategorySkill = subCategorySkill;
    if (id_lightcast) fields.id_lightcast = id_lightcast;
    if (emoji) fields.emoji = emoji;


    try { 

        let isNewCategory = false;

        let skillCategoryData
        if (_id || id_lightcast) {

            if (_id){
              skillCategoryData = await SkillCategory.findOne({ _id: _id })
            }else{
              skillCategoryData = await SkillCategory.findOne({ id_lightcast: id_lightcast })
            }

            if (!skillCategoryData) {
                skillCategoryData = await new SkillCategory(fields);
                skillCategoryData.save()

                isNewCategory = true;

            } else {
                skillCategoryData= await SkillCategory.findOneAndUpdate(
                    {_id: skillCategoryData._id},
                    {
                        $set: fields
                    },
                    {new: true}
                )
            }
            
        } else {
            skillCategoryData = await new SkillCategory(fields);
            skillCategoryData.save()

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
              node:"Skill_Category",
              _id: skillCategoryData._id,
              serverID_code: "828",
              name: skillCategoryData.name,
              serverID: serverID,
            }
          })
        }


        return skillCategoryData;
          
    } catch (err) {
      throw new ApolloError(
        err.message,
        err.extensions?.code || "DATABASE_FIND_TWEET_ERROR",
        { component: "tmemberQuery > addNewMember"}
      );
    }
  },

};
