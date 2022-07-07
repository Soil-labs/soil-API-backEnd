const {addNewMember,updateMember,addSkillToMember} = require("./mutation/memberMutation");
const {updateProject,newTweetProject} = require("./mutation/projectsMutation");
const {createSkill} = require("./mutation/skillMutation")
const {updateRoleTemplate} = require("./mutation/roleTemplateMutation")
const {newSkillCategory} = require("./mutation/skillCategoryMutation")



module.exports = {
  Mutation: {
    // ------------- MEMBER MUTATION -----------------
    addNewMember,
    updateMember,
    addSkillToMember,


    // ------------- PROJECT MUTATION -----------------
    updateProject,
    newTweetProject,

    // ------------- SKILL MUTATION -----------------
    createSkill,

    // ------------- ROLE MUTATION -----------------
    updateRoleTemplate,

    // ------------- SKILL CATEGORY MUTATION -----------------
    newSkillCategory,

    
  },
};