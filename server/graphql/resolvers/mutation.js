const {
  addNewMember,
  updateMember,
  addNodesToMember,
  deleteNodesFromMember,
  deleteMember,
  addFavoriteProject,
  addSkillToMember,
  endorseAttribute,
  memberUpdated,
  addEndorsement,
} = require("./mutation/memberMutation");
const {
  updateProject,
  addNodesToProjectRole,
  addProjectRole,
  deleteNodesToProjectRole,
  newTweetProject,
  approveTweet,
  changeTeamMember_Phase_Project,
  createNewTeam,
  createNewRole,
  createNewEpic,
} = require("./mutation/projectsMutation");

const {
  createSkill,
  createSkills,
  relatedSkills,
  createApprovedSkill,
  approveOrRejectSkill,
} = require("./mutation/skillMutation");
const {
  createNode,
  relatedNode,
  relatedNode_name,
} = require("./mutation/nodeMutation");
const { updateRoleTemplate } = require("./mutation/roleTemplateMutation");
const { updateServer } = require("./mutation/serverMutation");
const {
  updateGrant,
  addNodesToGrant,
  applyGrant,
} = require("./mutation/grantMutation");
const { updateSkillCategory } = require("./mutation/skillCategoryMutation");
const {
  updateSkillSubCategory,
} = require("./mutation/skillSubCategoryMutation");
const { createProjectUpdate } = require("./mutation/projectUpdateMutation");
const {
  createRoom,
  enterRoom,
  exitRoom,
  updateMemberInRoom,
  roomUpdated,
  memberUpdatedInRoom,
} = require("./mutation/roomMutation");
const {
  addNewChat,
  updateChatReply,
  updateChatResult,
} = require("./mutation/chatMutation");

module.exports = {
  Mutation: {
    // ------------- MEMBER MUTATION -----------------
    addNewMember,
    updateMember,
    addNodesToMember,
    deleteNodesFromMember,
    deleteMember,
    endorseAttribute,
    addFavoriteProject,
    addSkillToMember,
    addEndorsement,

    // ------------- PROJECT MUTATION -----------------
    updateProject,
    addNodesToProjectRole,
    addProjectRole,
    deleteNodesToProjectRole,
    newTweetProject,
    approveTweet,
    changeTeamMember_Phase_Project,
    createNewTeam,
    createNewRole,
    createNewEpic,

    // ------------- SKILL MUTATION -----------------
    createSkill,
    createSkills,
    relatedSkills,
    createApprovedSkill,
    approveOrRejectSkill,

    // ------------- NODE MUTATION -----------------
    createNode,
    relatedNode,
    relatedNode_name,

    // ------------- ROLE MUTATION -----------------
    updateRoleTemplate,

    // ------------- SERVER MUTATION -----------------
    updateServer,

    // ------------- GRANT MUTATION -----------------
    updateGrant,
    addNodesToGrant,
    applyGrant,

    // ------------- SKILL CATEGORY MUTATION -----------------
    updateSkillCategory,

    // ------------- SKILL SUB CATEGORY MUTATION -----------------
    updateSkillSubCategory,

    // ------------- PROJECT UPDATE MUTATION -----------------
    createProjectUpdate,

    //---------------ROOM MUTATION --------------------
    createRoom,
    enterRoom,
    exitRoom,
    updateMemberInRoom,

    // ------------- CHAT MUTATION -----------------
    addNewChat,
    updateChatReply,
    updateChatResult,
  },
  Subscription: {
    memberUpdated,
    roomUpdated,
    memberUpdatedInRoom,
  },
};
