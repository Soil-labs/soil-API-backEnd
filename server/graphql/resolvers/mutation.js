const {addNewMember,updateMember,addSkillToMember} = require("./mutation/memberMutation");
const {updateProject,newTweetProject} = require("./mutation/projectsMutation");
const {createSkill} = require("./mutation/skillMutation")



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
    createSkill


  
    
  },
};