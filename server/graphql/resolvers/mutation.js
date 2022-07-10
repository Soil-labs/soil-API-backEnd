const {addNewMember,updateMember,addSkillToMember} = require("./mutation/memberMutation");
const {updateProject,newTweetProject} = require("./mutation/projectsMutation");
const {createSkill,createApprovedSkill,approveOrRejectSkill} = require("./mutation/skillMutation")
const {updateRoleTemplate} = require("./mutation/roleTemplateMutation")
const {updateSkillCategory} = require("./mutation/skillCategoryMutation")



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
    createSkill,createApprovedSkill,approveOrRejectSkill,

    // ------------- ROLE MUTATION -----------------
    updateRoleTemplate,

    // ------------- SKILL CATEGORY MUTATION -----------------
    updateSkillCategory,

    
  },
};