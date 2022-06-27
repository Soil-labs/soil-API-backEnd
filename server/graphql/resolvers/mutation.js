const {addSkillToMember} = require("./mutation/memberMutation");
const {updateProject,newTweetPorject} = require("./mutation/projectsMutation");



module.exports = {
  Mutation: {
    // ------------- USER MUTATION -----------------

    addSkillToMember,
    updateProject,
    newTweetPorject,

    // ------------- USER MUTATION -----------------

  
    
  },
};