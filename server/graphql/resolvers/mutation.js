const {addNewMember,addSkillToMember} = require("./mutation/memberMutation");
const {updateProject,newTweetPorject} = require("./mutation/projectsMutation");



module.exports = {
  Mutation: {
    // ------------- MEMBER MUTATION -----------------
    addNewMember,
    addSkillToMember,


    // ------------- PROJECT MUTATION -----------------
    updateProject,
    newTweetPorject,


  
    
  },
};