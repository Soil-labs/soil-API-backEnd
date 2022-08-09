const {addNewMember,updateMember,addFavoriteProject,addSkillToMember,endorseAttribute,} = require("./mutation/memberMutation");
const {updateProject,newTweetProject,approveTweet,changeTeamMember_Phase_Project,createNewTeam} = require("./mutation/projectsMutation");
const {createSkill,createSkills,createApprovedSkill,approveOrRejectSkill} = require("./mutation/skillMutation")
const {updateRoleTemplate} = require("./mutation/roleTemplateMutation")
const {updateServer} = require("./mutation/serverMutation")
const {updateSkillCategory} = require("./mutation/skillCategoryMutation")
const {createProjectUpdate} = require("./mutation/projectUpdateMutation")



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
    approveTweet,changeTeamMember_Phase_Project,createNewTeam,

    // ------------- SKILL MUTATION -----------------
    createSkill,createSkills,createApprovedSkill,approveOrRejectSkill,

    // ------------- ROLE MUTATION -----------------
    updateRoleTemplate,

    // ------------- SERVER MUTATION -----------------
    updateServer,

    // ------------- SKILL CATEGORY MUTATION -----------------
    updateSkillCategory,

    // ------------- PROJECT UPDATE MUTATION -----------------
    createProjectUpdate,

    
  },
};