const {addNewMember,updateMember,addFavoriteProject,addSkillToMember,endorseAttribute,} = require("./mutation/memberMutation");
const {updateProject,newTweetProject,approveTweet} = require("./mutation/projectsMutation");
const {createSkill,createSkills,createApprovedSkill,approveOrRejectSkill} = require("./mutation/skillMutation")
const {updateRoleTemplate} = require("./mutation/roleTemplateMutation")
const {updateSkillCategory} = require("./mutation/skillCategoryMutation")



module.exports = {
  Mutation: {
    // ------------- MEMBER MUTATION -----------------
    addNewMember,
    updateMember,
    addSkillToMember,
    endorseAttribute,
    addFavoriteProject,

    // ------------- PROJECT MUTATION -----------------
    updateProject,
    newTweetProject,
    approveTweet,

    // ------------- SKILL MUTATION -----------------
    createSkill,createSkills,createApprovedSkill,approveOrRejectSkill,

    // ------------- ROLE MUTATION -----------------
    updateRoleTemplate,

    // ------------- SKILL CATEGORY MUTATION -----------------
    updateSkillCategory,

    
  },
};