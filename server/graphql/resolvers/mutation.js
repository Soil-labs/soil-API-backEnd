const {addNewMember,updateMember,addSkillToMember} = require("./mutation/memberMutation");
const {updateProject,newTweetPorject} = require("./mutation/projectsMutation");



module.exports = {
  Mutation: {
    // ------------- MEMBER MUTATION -----------------
    addNewMember,
    updateMember,
    addSkillToMember,


    // ------------- PROJECT MUTATION -----------------
    updateProject,
    newTweetPorject,


  
    
  },
};