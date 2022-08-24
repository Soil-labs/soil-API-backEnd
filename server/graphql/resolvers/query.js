

const { findMember,findMembers,matchMembersToUser,matchMembersToSkills } = require("./query/memberQuery");
const { findSkill,findSkills,waitingToAproveSkills,adminFindAllSkillsEveryState } = require("./query/skillsQuery");

const {findProject,findProjects,findProjects_RequireSkill,findProjects_RecommendedToUser,match_projectToUser,findTeams,findRoles} = require("./query/projectQuery");
const {findProjectUpdates,findAllProjectsTeamsAnouncments,findGarden} = require("./query/projectUpdateQuery");


const {findRoleTemplate,findRoleTemplates} = require("./query/roleTemplateQuery");
const {findServers} = require("./query/serverQuery");
const {findSkillCategory,findSkillCategories} = require("./query/skillCategoryQuery");
const {findSkillSubCategory,findSkillSubCategories} = require("./query/skillSubCategoryQuery");


const { errors } = require("./query/errorQuery");


module.exports = {
  Query: {

    // ------------- DEV-ONLY QUERY ----------------
    errors,


    // ------------- PROJECT QUERY -----------------
    findProject,findProjects,findProjects_RequireSkill,findProjects_RecommendedToUser,match_projectToUser,findTeams,findRoles,

    // ------------- MEMBER QUERY -----------------
    findMember,findMembers,matchMembersToUser,matchMembersToSkills,

    // ------------- SKILL QUERY -----------------
    findSkill,findSkills,waitingToAproveSkills,adminFindAllSkillsEveryState,

    // ------------- ROLE TEMPLATE QUERY -----------------
    findRoleTemplate,findRoleTemplates,

    // ------------- SERVER TEMPLATE QUERY -----------------
    findServers,

    // ------------- SKILL CATEGORY QUERY -----------------
    findSkillCategory,findSkillCategories,

    // ------------- SKILL SUB CATEGORY QUERY -----------------
    findSkillSubCategory,findSkillSubCategories,


    // ------------- PROJECT UPDATE QUERY -----------------
    findProjectUpdates,findAllProjectsTeamsAnouncments,findGarden,

  },
};
