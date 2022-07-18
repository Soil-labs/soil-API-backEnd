const {addNewMember,updateMember,addSkillToMember,endorseAttribute} = require("./mutation/memberMutation");
const {updateProject,newTweetProject,approveTweet} = require("./mutation/projectsMutation");
const {createSkill,createApprovedSkill,approveOrRejectSkill} = require("./mutation/skillMutation")
const {updateRoleTemplate} = require("./mutation/roleTemplateMutation")
const {updateSkillCategory} = require("./mutation/skillCategoryMutation")



module.exports = {
  Mutation: {
    // ------------- MEMBER MUTATION -----------------
    addNewMember,
    updateMember,
    addSkillToMember,
    endorseAttribute,

    // ------------- PROJECT MUTATION -----------------
    updateProject,
    newTweetProject,
    approveTweet,

    // ------------- SKILL MUTATION -----------------
    createSkill,createApprovedSkill,approveOrRejectSkill,

    // ------------- ROLE MUTATION -----------------
    updateRoleTemplate,

    // ------------- SKILL CATEGORY MUTATION -----------------
    updateSkillCategory,

    
  },
};