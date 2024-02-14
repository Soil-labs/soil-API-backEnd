const {
  findMember,
  findMembers,
  matchMembersToUser,
  matchMembersToSkills,
  matchMembersToProject,
  matchMembersToProjectRole,
  matchPrepareSkillToMembers,
  pingNeo4j,
  matchPrepareNode,
  matchPrepareNode_AI4,
  matchPrepareNode_old,
  matchPrepareSkillToProjectRoles,
  matchSkillsToMembers,
  matchNodesToMembers,
  matchNodesToMembers_AI4,
  setAllMatch_v2,
  matchNodesToMembers_old,
  matchSkillsToProjects,
  memberPieChartNodeCategories,
  memberRadioChartCharacterAttributes,
  candidateNotesEdenAI,
  candidateNotesComparePositionEdenAI,
  findCandidateInfoForMember,
  matchNodesToProjectRoles,
  matchNodesToProjectRoles_old,
  members_autocomplete,
  findMemberByIDOrDiscordName,
} = require("./query/memberQuery");
const {
  findSkill,
  findSkills,
  waitingToAproveSkills,
  adminFindAllSkillsEveryState,
  skills_autocomplete,
  skills,
} = require("./query/skillsQuery");

const {
  findNode,
  findNodes,
  nodes_autocomplete,
  treeOfRelatedNodes,
} = require("./query/nodeQuery");

const {
  findConversation,
  findConversations,
} = require("./query/conversationQuery");

const {
  findPosition,
  findPositionCandidate,
  findPositions,
  findUserTalentListPosition,
  findPositionsOfCommunity,
} = require("./query/positionQuery");

const {
  findCompany,
  findCompanies,
  findCompanyFromSlug,
} = require("./query/companyQuery");

const { findQueryResponses } = require("./query/queryResponseQuery");

const { findMemories } = require("./query/memoryPineconeQuery");

const { findCardMemories } = require("./query/cardMemoryQuery");

const { findQuestionEdenAI } = require("./query/questionsEdenAIQuery");

const {
  findProject,
  findProjects,
  findProjects_RequireSkill,
  findProjects_RecommendedToUser,
  match_projectToUser,
  findTeams,
  findRoles,
  findEpic,
} = require("./query/projectQuery");
const {
  findProjectUpdates,
  findAllProjectsTeamsAnouncments,
  findGarden,
} = require("./query/projectUpdateQuery");

const {
  findRoleTemplate,
  findRoleTemplates,
} = require("./query/roleTemplateQuery");
const { findServers } = require("./query/serverQuery");
const { findGrants } = require("./query/grantQuery");
const { findRoom, findRooms } = require("./query/roomQuery");
const {
  findSkillCategory,
  findSkillCategories,
} = require("./query/skillCategoryQuery");
const {
  findSkillSubCategory,
  findSkillSubCategories,
} = require("./query/skillSubCategoryQuery");

const { findChat } = require("./query/chatQuery");

const {
  findLastNumMessagesChatExternalApp,
  checkLimitMessagesExternalApp,
} = require("./query/chatExternalAppQuery");

const {
  findMessage,
  edenGPTreply,
  identifyCategoryAndReply,
  messageMapKG,
  messageMapKG_V2,
  messageMapKG_V3,
  messageMapKG_V4,
  messageMapKG_V5,
  findPrioritiesTrainEdenAI,
  edenGPTreplyMemory,
  askEdenUserPosition,
  askEdenUserPositionGPTFunc,
  askEdenUserPositionGPTFunc_V2,
  searchEden_V1,
  edenGPTreplyChatAPI,
  edenGPTreplyChatAPI_V2,
  edenGPTreplyChatAPI_V3,
  edenGPTsearchProfiles,
  edenGPTsummaryProfile,
  conversationToSummaryGPT,
  edenGPTEndorseChatAPI,
  evaluateAnswerEdenAI,
  edenGPTCreateProfileExperienceChatAPI,
  edenAITalSearchExpirience,
  interviewEdenAI,
  interviewEdenGPT4only,
  createProfileExperienceWithChatCVMemory,
  edenGPTReviewChatAPI,
} = require("./query/aiQuery");

const {
  findMemberGraph,
  findProjectGraph,
  findMemberToProjectGraph,
  dynamicSearchToProjectGraph,
  dynamicSearchGraph,
  dynamicSearchToMemberGraph,
  dynamicSearchToMemberGraphV2,
  dynamicSearchToMemberGraphGPT,
  dynamicSearchToMemberCategoryGroup,
  findMemberToMemberGraph,
  findMultipleMembersProjectsGraph,
  findOneMemberToMembersGraph,
} = require("./query/graphVisualQuery");

const {
  membersStats,
  lurkersContributorsQuery,
  activeMembersStats,
  activeUsersQueryStats,
} = require("./query/edenMetricsQuery");

const { findEndorsementLink } = require("./query/endorsementQuery");

const { sendWhatsAppMessage } = require("./query/whatsAppQuery");

const { sendEmailViaSendGrid } = require("./query/emailQuery");

const { errors } = require("./query/errorQuery");

module.exports = {
  Query: {
    // ------------- DEV-ONLY QUERY ----------------
    errors,

    // ------------- PROJECT QUERY -----------------
    findProject,
    findProjects,
    findProjects_RequireSkill,
    findProjects_RecommendedToUser,
    match_projectToUser,
    findTeams,
    findRoles,
    findEpic,

    // ------------- MEMBER QUERY -----------------
    findMember,
    findMembers,
    matchMembersToUser,
    matchMembersToSkills,
    matchMembersToProject,
    matchMembersToProjectRole,
    matchPrepareSkillToMembers,
    pingNeo4j,
    matchPrepareNode,
    matchPrepareNode_AI4,
    matchPrepareNode_old,
    matchPrepareSkillToProjectRoles,
    matchSkillsToMembers,
    matchNodesToMembers,
    matchNodesToMembers_AI4,
    setAllMatch_v2,
    matchNodesToMembers_old,
    matchSkillsToProjects,
    memberPieChartNodeCategories,
    memberRadioChartCharacterAttributes,
    candidateNotesEdenAI,
    candidateNotesComparePositionEdenAI,
    findCandidateInfoForMember,
    matchNodesToProjectRoles,
    matchNodesToProjectRoles_old,
    members_autocomplete,

    // ------------- SKILL QUERY -----------------
    findSkill,
    findSkills,
    waitingToAproveSkills,
    adminFindAllSkillsEveryState,
    skills,
    skills_autocomplete,

    // ------------- NODE QUERY -----------------
    findNode,
    findNodes,
    nodes_autocomplete,
    treeOfRelatedNodes,

    // ------------- CONVERSATION QUERY -----------------
    findConversation,
    findConversations,

    // ------------- POSITION QUERY -----------------
    findPosition,
    findPositionCandidate,
    findPositions,
    findUserTalentListPosition,
    findPositionsOfCommunity,

    // ------------- COMPANY QUERY -----------------
    findCompany,
    findCompanies,
    findCompanyFromSlug,

    // ------------- QUERY RESPONSE QUERY -----------------
    findQueryResponses,

    // ------------- MEMORY PINECONE QUERY -----------------
    findMemories,

    // ------------- CARD MEMORY -----------------
    findCardMemories,

    // ------------- QUESTIONS EDEN AI QUERY -----------------
    findQuestionEdenAI,

    // ------------- ROLE TEMPLATE QUERY -----------------
    findRoleTemplate,
    findRoleTemplates,

    // ------------- SERVER TEMPLATE QUERY -----------------
    findServers,

    // ------------- GRANT TEMPLATE QUERY -----------------
    findGrants,

    // ------------- ROOM TEMPLATE QUERY -----------------
    findRoom,
    findRooms,

    // ------------- SKILL CATEGORY QUERY -----------------
    findSkillCategory,
    findSkillCategories,

    // ------------- SKILL SUB CATEGORY QUERY -----------------
    findSkillSubCategory,
    findSkillSubCategories,

    // ------------- PROJECT UPDATE QUERY -----------------
    findProjectUpdates,
    findAllProjectsTeamsAnouncments,
    findGarden,

    // ------------ CHAT QUERY ---------------
    findChat,

    // ------------ CHAT EXTERNAL APP QUERY ---------------
    findLastNumMessagesChatExternalApp,
    checkLimitMessagesExternalApp,

    //----------- AI QUERY ------------------
    findMessage,
    edenGPTreply,
    identifyCategoryAndReply,
    messageMapKG,
    messageMapKG_V2,
    messageMapKG_V3,
    messageMapKG_V4,
    messageMapKG_V5,
    findPrioritiesTrainEdenAI,
    edenGPTreplyMemory,
    askEdenUserPosition,
    askEdenUserPositionGPTFunc,
    askEdenUserPositionGPTFunc_V2,
    searchEden_V1,
    edenGPTreplyChatAPI,
    edenGPTreplyChatAPI_V2,
    edenGPTreplyChatAPI_V3,
    edenGPTsearchProfiles,
    edenGPTsummaryProfile,
    conversationToSummaryGPT,
    edenGPTEndorseChatAPI,
    evaluateAnswerEdenAI,
    edenGPTCreateProfileExperienceChatAPI,
    edenAITalSearchExpirience,
    createProfileExperienceWithChatCVMemory,
    interviewEdenAI,
    interviewEdenGPT4only,
    edenGPTReviewChatAPI,

    //----------- GRAPH VISUAL QUERY ------------------
    findMemberGraph,
    findProjectGraph,
    findMemberToProjectGraph,
    dynamicSearchToProjectGraph,
    dynamicSearchGraph,
    dynamicSearchToMemberGraph,
    dynamicSearchToMemberGraphV2,
    dynamicSearchToMemberGraphGPT,
    dynamicSearchToMemberCategoryGroup,
    findMemberToMemberGraph,
    findMultipleMembersProjectsGraph,
    findOneMemberToMembersGraph,

    //----------- EDEN METRICS QUERY ------------------
    membersStats,
    lurkersContributorsQuery,
    activeMembersStats,
    activeUsersQueryStats,

    //----------- EDEN ENDORSEMENT QUERY ------------------
    findEndorsementLink,
    sendWhatsAppMessage,

    //-------------- SEND EMAIL QUERY --------------------
    sendEmailViaSendGrid,
  },
};
