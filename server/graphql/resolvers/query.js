const {
  findMember,
  findMembers,
  matchMembersToUser,
  matchMembersToSkills,
  matchMembersToProject,
  matchMembersToProjectRole,
  matchPrepareSkillToMembers,
  matchPrepareNode,
  matchPrepareNode_old,
  matchPrepareSkillToProjectRoles,
  matchSkillsToMembers,
  matchNodesToMembers,
  setAllMatch_v2,
  matchNodesToMembers_old,
  matchSkillsToProjects,
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
const { findMessage } = require("./query/aiQuery");
const { findMemberGraph } = require("./query/graphVisualQuery");

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
    matchPrepareNode,
    matchPrepareNode_old,
    matchPrepareSkillToProjectRoles,
    matchSkillsToMembers,
    matchNodesToMembers,
    setAllMatch_v2,
    matchNodesToMembers_old,
    matchSkillsToProjects,
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

    //----------- AI QUERY ------------------
    findMessage,

    //----------- GRAPH VISUAL QUERY ------------------
    findMemberGraph,
  },
};
