const {
  addNewMember,
  updateMember,
  addNodesToMember,
  updateNodesToMember,
  updateNodesToMemberMultiTypeNode,
  deleteNodesFromMember,
  deleteMember,
  addFavoriteProject,
  addPreferencesToMember,
  // addSkillToMember,
  endorseAttribute,
  memberUpdated,
  createFakeUser,
  createFakeUserCVnew,
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
  updateConversation,
  updateConvSummaries,
} = require("./mutation/conversationMutation");

const { addQuestionToEdenAI } = require("./mutation/questionsEdenAIMutation");

const {
  updatePosition,
  updateUrl,
  addQuestionsToAskPosition,
  interviewQuestionCreationUser,
  deleteQuestionsToAskPosition,
  addCandidatesPosition,
  deletePositionCandidate,
  addConvRecruiterToPosition,
  updatePositionUserAnswers,
  updateAnalysisEdenAICandidates,
  updatePositionConvRecruiter,
  createTalentListPosition,
  updateUsersTalentListPosition,
  addNodesToPosition,
} = require("./mutation/positionMutation");

const {
  updateCompany,
  updateUrlCompany,
  addEmployeesCompany,
} = require("./mutation/companyMutation");

const {
  updateQueryResponse
} = require("./mutation/queryResponseMutation");

const {
  addMemory,
  deleteMemories,
} = require("./mutation/memoryPineconeMutation");

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
  findEndorsements,
  deleteAllEndorsements,
  calculateReputation,
  createMultipleFakeEndorsementAndReview,
  createFakeEndorsement,
  createEndorsementLink,
} = require("./mutation/endorsementMutation");
const {
  addReview,
  createFakeReview,
  findReviews,
} = require("./mutation/reviewMutation");
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
  secondInterviewLetter,
  rejectionLetter,
  storeLongTermMemory,
  storeLongTermMemorySummary,
  websiteToMemoryCompany,
  positionTextToExtraQuestions,
  conversationCVPositionToReport,
  positionTextAndConvoToReportCriteria,
  positionSuggestQuestionsAskCandidate,
  saveCVtoUser,
  autoUpdateUserInfoFromCV,
  addMessages,
  updateMessage,
  useAI_OnMessage,
  messageToGPT,
  autoUpdateMemoryFromCV,
  autoUpdateMemoryFromPositionRequirments,
  inputToGPT,
  CVtoSummary,
  CVtoJobs,
  cvMapKG,
  userCVSavedToDB,
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
    updateNodesToMember,
    updateNodesToMemberMultiTypeNode,
    deleteNodesFromMember,
    deleteMember,
    endorseAttribute,
    addFavoriteProject,
    addPreferencesToMember,
    // addSkillToMember,
    createFakeUser,
    createFakeUserCVnew,
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
    updateConversation,
    updateConvSummaries,

    // ------------- QUESTION EDEN AI MUTATION -----------------
    addQuestionToEdenAI,

    // ------------- POSITION MUTATION -----------------
    updatePosition,
    updateUrl,
    addQuestionsToAskPosition,
    interviewQuestionCreationUser,
    deleteQuestionsToAskPosition,
    addCandidatesPosition,
    deletePositionCandidate,
    addConvRecruiterToPosition,
    updatePositionUserAnswers,
    updateAnalysisEdenAICandidates,
    updatePositionConvRecruiter,
    createTalentListPosition,
    updateUsersTalentListPosition,
    addNodesToPosition,

    // ------------- COMPANY MUTATION -----------------
    updateCompany,
    updateUrlCompany,
    addEmployeesCompany,

    // ------------- QUERY RESPONSE MUTATION -----------------
    updateQueryResponse,

    // ------------- MEMORY PINECONE MUTATION -----------------
    addMemory,
    deleteMemories,

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
    findEndorsements,
    deleteAllEndorsements,
    calculateReputation,
    createMultipleFakeEndorsementAndReview,
    createFakeEndorsement,
    createEndorsementLink,

    // ------------- REVIEW MUTATION -----------------
    addReview,
    createFakeReview,
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
    secondInterviewLetter,
    rejectionLetter,
    storeLongTermMemory,
    storeLongTermMemorySummary,
    websiteToMemoryCompany,
    positionTextToExtraQuestions,
    conversationCVPositionToReport,
    positionTextAndConvoToReportCriteria,
    positionSuggestQuestionsAskCandidate,
    saveCVtoUser,
    autoUpdateUserInfoFromCV,
    addMessages,
    updateMessage,
    useAI_OnMessage,
    messageToGPT,
    autoUpdateMemoryFromCV,
    autoUpdateMemoryFromPositionRequirments,
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
    userCVSavedToDB,
  },
};
