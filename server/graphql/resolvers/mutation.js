const {
  addNewMember,
  updateMember,
  addNodesToMember,
  updateNodesToMember,updateNodesToMemberMultiTypeNode,
  deleteNodesFromMember,
  deleteMember,
  addFavoriteProject,
  addPreferencesToMember,
  // addSkillToMember,
  endorseAttribute,
  memberUpdated,
  createFakeUser,
  uploadUserDataGPT,
  updateMemberSignalInfo,
} = require("./mutation/memberMutation");
const {
  updateProject,
  addNodesToProjectRole,
  updateNodesToProjectRole,
  addProjectRole,
  deleteNodesToProjectRole,
  newTweetProject,
  approveTweet,
  changeTeamMember_Phase_Project,
  createNewTeam,
  createNewRole,
  createNewEpic,
  deleteProject,
  createProject,
} = require("./mutation/projectsMutation");

const {
  // createSkill,
  // createSkills,
  //relatedSkills,
  // createApprovedSkill,
  // approveOrRejectSkill,
} = require("./mutation/skillMutation");
const {
  createNode,
  relatedNode,
  relatedNode_name,
  createNodeCategoryGroup,
} = require("./mutation/nodeMutation");

const {
  updateConversation,updateConvSummaries,
} = require("./mutation/conversationMutation");

const {
  addQuestionToEdenAI,
} = require("./mutation/questionsEdenAIMutation");

const {
  updateCompany,addEmployeesCompany,addQuestionsToAskCompany,deleteQuestionsToAskCompany,addCandidatesCompany,updateCompanyUserAnswers,
} = require("./mutation/companyMutation");

const { updateRoleTemplate } = require("./mutation/roleTemplateMutation");
const { updateServer } = require("./mutation/serverMutation");
const {
  updateGrant,
  addNodesToGrant,
  applyGrant,
  updateNodesToGrant,
} = require("./mutation/grantMutation");
// const { updateSkillCategory } = require("./mutation/skillCategoryMutation");
// const {
//   updateSkillSubCategory,
// } = require("./mutation/skillSubCategoryMutation");
const { createProjectUpdate } = require("./mutation/projectUpdateMutation");
const {
  addEndorsement,
  findEndorsements,deleteAllEndorsements,calculateReputation,createMultipleFakeEndorsementAndReview,
  createFakeEndorsement,
  createEndorsementLink,
} = require("./mutation/endorsementMutation");
const { addReview,createFakeReview, findReviews } = require("./mutation/reviewMutation");
const {
  createRoom,
  enterRoom,
  exitRoom,
  updateMemberInRoom,
  addNodesToMemberInRoom,
  deleteNodesFromMemberInRoom,
  roomUpdated,
  memberUpdatedInRoom,
  updateNodesToMemberInRoom,
} = require("./mutation/roomMutation");
const {
  addNewChat,
  updateChatReply,
  updateChatResult,
} = require("./mutation/chatMutation");

const {
  addMessage,
  storeLongTermMemory,
  storeLongTermMemorySummary,
  addMessages,
  updateMessage,
  useAI_OnMessage,
  messageToGPT,
  inputToGPT,
  CVtoSummary,
  CVtoJobs,
  cvMapKG,
} = require("./mutation/aiMutation");

const { createError, deleteError } = require("./mutation/errorsMutation");

const {
  saveCoreProductFeatureInteration,
  saveDailyLogin,
  saveActionsPerformed,
} = require("./mutation/edenMetricsMutation");

module.exports = {
  Mutation: {
    // ------------- MEMBER MUTATION -----------------
    addNewMember,
    updateMember,
    addNodesToMember,
    updateNodesToMember,updateNodesToMemberMultiTypeNode,
    deleteNodesFromMember,
    deleteMember,
    endorseAttribute,
    addFavoriteProject,
    addPreferencesToMember,
    // addSkillToMember,
    createFakeUser,
    uploadUserDataGPT,
    updateMemberSignalInfo,

    // ------------- PROJECT MUTATION -----------------
    updateProject,
    addNodesToProjectRole,
    updateNodesToProjectRole,
    addProjectRole,
    deleteNodesToProjectRole,
    newTweetProject,
    approveTweet,
    changeTeamMember_Phase_Project,
    createNewTeam,
    createNewRole,
    createNewEpic,
    deleteProject,
    createProject,

    // ------------- SKILL MUTATION -----------------
    // createSkill,
    // createSkills,
    //relatedSkills,
    // createApprovedSkill,
    // approveOrRejectSkill,

    // ------------- NODE MUTATION -----------------
    createNode,
    relatedNode,
    relatedNode_name,
    createNodeCategoryGroup,

    // ------------- CONVERSATION MUTATION -----------------
    updateConversation,updateConvSummaries,

    // ------------- QUESTION EDEN AI MUTATION -----------------
    addQuestionToEdenAI,

    // ------------- COMPANY MUTATION -----------------
    updateCompany,addEmployeesCompany,addQuestionsToAskCompany,deleteQuestionsToAskCompany,addCandidatesCompany,updateCompanyUserAnswers,

    // ------------- ROLE MUTATION -----------------
    updateRoleTemplate,

    // ------------- SERVER MUTATION -----------------
    updateServer,

    // ------------- GRANT MUTATION -----------------
    updateGrant,
    addNodesToGrant,
    applyGrant,
    updateNodesToGrant,

    // ------------- SKILL CATEGORY MUTATION -----------------
    // updateSkillCategory,

    // ------------- SKILL SUB CATEGORY MUTATION -----------------
    // updateSkillSubCategory,

    // ------------- PROJECT UPDATE MUTATION -----------------
    createProjectUpdate,

    // ------------- ENDORSEMENT MUTATION -----------------
    addEndorsement,
    findEndorsements,deleteAllEndorsements,calculateReputation,createMultipleFakeEndorsementAndReview,
    createFakeEndorsement,
    createEndorsementLink,

    // ------------- REVIEW MUTATION -----------------
    addReview,createFakeReview,
    findReviews,

    //---------------ROOM MUTATION --------------------
    createRoom,
    enterRoom,
    exitRoom,
    updateMemberInRoom,
    addNodesToMemberInRoom,
    deleteNodesFromMemberInRoom,
    updateNodesToMemberInRoom,

    // ------------- CHAT MUTATION -----------------
    addNewChat,
    updateChatReply,
    updateChatResult,

    // --------------- AI MUTATION -----------------
    addMessage,
    storeLongTermMemory,
    storeLongTermMemorySummary,
    addMessages,
    updateMessage,
    useAI_OnMessage,
    messageToGPT,
    inputToGPT,
    CVtoSummary,
    CVtoJobs,
    cvMapKG,

    // ------------- ERROR MUTATION -----------------
    createError,
    deleteError,

    // -------------- EDEN METRICS MUTATION --------------
    saveCoreProductFeatureInteration,
    saveDailyLogin,
    saveActionsPerformed,
  },
  Subscription: {
    memberUpdated,
    roomUpdated,
    memberUpdatedInRoom,
  },
};
